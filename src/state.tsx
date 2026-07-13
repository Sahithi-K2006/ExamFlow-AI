import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ApiUser } from './api/auth';
import { studentLogin, studentRegister, adminLogin, fetchMe, logoutApi } from './api/auth';
import { getToken, setToken, clearToken, ApiError } from './api/client';
import {
  getExam, startExam, getQuestions as getQuestionsApi, saveAnswers as saveAnswersApi,
  submitExamApi, leaveQueueApi, getMySession, getAnswers, type ApiExam, type ApiSession
} from './api/exams';
import { listExams, getAdminQueue, updateCapacity as updateCapacityApi, forceAdmitApi, forceExitApi } from './api/admin';
import { openStudentSocket, openAdminSocket } from './api/ws';

// The single live exam this build targets end-to-end. Phase 4 (Exam Builder + sharing)
// generalizes this to arbitrary admin-created exams reachable at /exam/:slug.
export const DEFAULT_EXAM_SLUG = 'dsa-101';

// Interfaces
export interface Student {
  id: string; // exam_session id
  name: string;
  email: string;
  studentId: string;
  joinedAt: string;
  status: 'waiting' | 'admitted' | 'exited';
  queuePosition: number;
}

export interface Question {
  id: string;
  type: 'mcq' | 'multiple_correct' | 'coding' | 'sql' | 'fill_blank' | 'short_answer' | 'descriptive';
  description: string;
  points: number;
  options?: string[];
  initialCode?: string;
  programmingLanguage?: string | null;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'danger';
}

export interface ServerHealth {
  cpu: number;
  memory: number;
  networkLoad: number;
  status: 'Healthy' | 'Degraded' | 'Offline';
}

interface AppContextType {
  // Which exam the student flow currently targets — defaults to DEFAULT_EXAM_SLUG for the
  // existing dashboard "Enter Exam" button, but is set to a specific slug when a student opens
  // a shared /exam/:slug link, so each published exam gets a real working deep link.
  currentExamSlug: string;
  setCurrentExamSlug: (slug: string) => void;

  // Real backend authentication (JWT-based, replaces the old simulated role switch)
  authUser: ApiUser | null;
  authLoading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  loginStudent: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  registerStudent: (data: { name: string; email: string; password: string; studentId: string; college?: string }) => Promise<boolean>;
  loginAdmin: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  logoutUser: () => void;

  // Student Auth
  studentUser: { name: string; email: string; studentId: string } | null;
  setStudentUser: (user: { name: string; email: string; studentId: string } | null) => void;
  studentStatus: 'logged_out' | 'dashboard' | 'system_check' | 'waiting' | 'exam' | 'submitted';
  setStudentStatus: (status: 'logged_out' | 'dashboard' | 'system_check' | 'waiting' | 'exam' | 'submitted') => void;

  // Queue state (admin-facing; backed by the real Redis FIFO queue on the server)
  capacity: number;
  setCapacity: (cap: number) => void;
  queue: Student[];
  refreshAdminQueue: () => void;
  leaveQueue: () => void;
  forceAdmit: (sessionId: string) => void;
  forceExit: (sessionId: string) => void;

  // Which exam the admin queue/session views are currently scoped to — the admin picks from
  // adminExams (every exam, any status) rather than the dashboard silently defaulting to one.
  adminExams: ApiExam[];
  adminExamId: string | null;
  selectAdminExam: (examId: string) => void;

  // Exam Engine State (student-facing)
  examMeta: ApiExam | null;
  startExamSession: () => Promise<void>;
  queuePosition: number;
  totalWaiting: number;
  estimatedWaitSeconds: number;
  questions: Question[];
  currentQuestionIndex: number;
  setCurrentQuestionIndex: (index: number) => void;
  studentAnswers: Record<string, string>;
  setAnswer: (questionId: string, answer: string) => void;
  examTimeRemaining: number; // seconds
  setExamTimeRemaining: React.Dispatch<React.SetStateAction<number>>;
  proctoringViolations: number;
  addProctoringViolation: () => void;
  submitExam: () => void;
  examReport: { score: number; total: number; pass: boolean; needsReview: boolean } | null;

  // Super Admin Control
  maintenanceMode: boolean;
  setMaintenanceMode: (mode: boolean) => void;
  serverHealth: ServerHealth;
  auditLogs: AuditLog[];
  addLog: (message: string, type?: 'info' | 'warning' | 'success' | 'danger') => void;
  clearLogs: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const mapApiQuestion = (q: { id: string; type: Question['type']; question_text: string; options: string[]; initial_code: string | null; marks: number; programming_language: string | null }): Question => ({
  id: q.id,
  type: q.type,
  description: q.question_text,
  points: q.marks,
  options: q.options,
  initialCode: q.initial_code ?? undefined,
  programmingLanguage: q.programming_language,
});

const mapAdminQueueStudent = (s: { session_id: string; student_name: string; student_email: string; student_code: string | null; status: string; queue_position: number; joined_queue_at: string | null }): Student => ({
  id: s.session_id,
  name: s.student_name,
  email: s.student_email,
  studentId: s.student_code || '',
  joinedAt: s.joined_queue_at ? new Date(s.joined_queue_at).toLocaleTimeString() : '',
  status: s.status === 'in_progress' ? 'admitted' : 'waiting',
  queuePosition: s.queue_position,
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentExamSlug, setCurrentExamSlug] = useState<string>(DEFAULT_EXAM_SLUG);
  const [authUser, setAuthUser] = useState<ApiUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [studentUser, setStudentUser] = useState<{ name: string; email: string; studentId: string } | null>(null);
  const [studentStatus, setStudentStatus] = useState<'logged_out' | 'dashboard' | 'system_check' | 'waiting' | 'exam' | 'submitted'>('logged_out');

  // Admin-facing queue state (real backend)
  const [capacity, setCapacityState] = useState<number>(2);
  const [queue, setQueue] = useState<Student[]>([]);
  const [adminExams, setAdminExams] = useState<ApiExam[]>([]);
  const [adminExamId, setAdminExamId] = useState<string | null>(null);
  const adminWsRef = useRef<WebSocket | null>(null);

  // Student-facing exam engine state (real backend)
  const [examMeta, setExamMeta] = useState<ApiExam | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [queuePosition, setQueuePosition] = useState<number>(0);
  const [totalWaiting, setTotalWaiting] = useState<number>(0);
  const [estimatedWaitSeconds, setEstimatedWaitSeconds] = useState<number>(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [studentAnswers, setStudentAnswers] = useState<Record<string, string>>({});
  const [examTimeRemaining, setExamTimeRemaining] = useState<number>(15 * 60);
  const [proctoringViolations, setProctoringViolations] = useState<number>(0);
  const [examReport, setExamReport] = useState<{ score: number; total: number; pass: boolean; needsReview: boolean } | null>(null);
  const studentWsRef = useRef<WebSocket | null>(null);

  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Server health state
  const [serverHealth, setServerHealth] = useState<ServerHealth>({
    cpu: 25,
    memory: 45,
    networkLoad: 12,
    status: 'Healthy'
  });

  // Restore session from a stored JWT on first load
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setAuthLoading(false);
      return;
    }
    fetchMe()
      .then((user) => setAuthUser(user))
      .catch(() => clearToken())
      .finally(() => setAuthLoading(false));
  }, []);

  // Keep the legacy studentUser shape in sync with the real authenticated user
  // so the existing StudentFlow.tsx logic (queue lookups, exam header, etc.) needs no changes.
  useEffect(() => {
    if (authUser && authUser.role === 'student') {
      setStudentUser({ name: authUser.name, email: authUser.email, studentId: authUser.student_id || '' });
      setStudentStatus(prev => (prev === 'logged_out' ? 'dashboard' : prev));
    } else if (!authUser) {
      setStudentUser(null);
    }
  }, [authUser]);

  // Refresh/reconnect recovery: right after a student session is established (fresh login or a
  // page reload that restored the JWT), silently check for an already-waiting/in-progress exam
  // session and resume straight into it instead of stranding the student back at the dashboard.
  useEffect(() => {
    if (!authUser || authUser.role !== 'student') return;
    (async () => {
      try {
        const existing = await getMySession(currentExamSlug);
        if (!existing) return;
        const exam = await getExam(currentExamSlug);
        setExamMeta(exam);
        setSessionId(existing.id);
        if (existing.status === 'in_progress') {
          const qs = await getQuestionsApi(currentExamSlug);
          setQuestions(qs.map(mapApiQuestion));
          const savedAnswers = await getAnswers(existing.id);
          setStudentAnswers(Object.fromEntries(savedAnswers.map(a => [a.question_id, a.answer_text])));
          setExamTimeRemaining(existing.time_remaining_seconds);
          setProctoringViolations(existing.proctoring_violations);
          addLog('Reconnected to your active exam session.', 'success');
          setStudentStatus('exam');
        } else {
          setQueuePosition(existing.queue_position);
          setTotalWaiting(existing.queue_position);
          setEstimatedWaitSeconds(existing.estimated_wait_seconds ?? 0);
          addLog('Reconnected to your place in the waiting queue.', 'info');
          setStudentStatus('waiting');
        }
      } catch {
        // no existing session to resume from — normal case, nothing to do
      }
    })();
  }, [authUser, currentExamSlug]);

  const clearAuthError = () => setAuthError(null);

  const loginStudent = async (email: string, password: string, rememberMe: boolean = true): Promise<boolean> => {
    setAuthError(null);
    try {
      const res = await studentLogin(email, password);
      setToken(res.access_token, rememberMe);
      setAuthUser(res.user);
      addLog(`Student "${res.user.name}" logged in.`, 'success');
      return true;
    } catch (err) {
      setAuthError(err instanceof ApiError ? err.message : 'Login failed. Please try again.');
      return false;
    }
  };

  // Creates the account only — does not log the student in. The caller (StudentFlow) sends
  // them to the Login tab afterward so they authenticate with the credentials they just set.
  const registerStudent = async (data: { name: string; email: string; password: string; studentId: string; college?: string }): Promise<boolean> => {
    setAuthError(null);
    try {
      await studentRegister({
        name: data.name,
        email: data.email,
        password: data.password,
        student_id: data.studentId,
        college: data.college,
      });
      addLog(`Student "${data.name}" registered.`, 'success');
      return true;
    } catch (err) {
      setAuthError(err instanceof ApiError ? err.message : 'Registration failed. Please try again.');
      return false;
    }
  };

  const loginAdmin = async (email: string, password: string, rememberMe: boolean = true): Promise<boolean> => {
    setAuthError(null);
    try {
      const res = await adminLogin(email, password);
      setToken(res.access_token, rememberMe);
      setAuthUser(res.user);
      addLog(`Admin "${res.user.name}" logged in.`, 'success');
      return true;
    } catch (err) {
      setAuthError(err instanceof ApiError ? err.message : 'Unauthorized Access');
      return false;
    }
  };

  const logoutUser = () => {
    logoutApi().catch(() => {});
    clearToken();
    setAuthUser(null);
    setStudentStatus('logged_out');
    setSessionId(null);
    setExamMeta(null);
    setQuestions([]);
    setStudentAnswers({});
    setQueuePosition(0);
    setTotalWaiting(0);
    setExamReport(null);
    setAdminExamId(null);
    setQueue([]);
    addLog('User logged out.', 'info');
  };

  // Logging utility
  const addLog = (message: string, type: 'info' | 'warning' | 'success' | 'danger' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setAuditLogs((prev) => [
      { id: Math.random().toString(), timestamp, message, type },
      ...prev.slice(0, 49) // Keep last 50 logs
    ]);
  };

  const clearLogs = () => setAuditLogs([]);

  // Mock server load oscillations
  useEffect(() => {
    const interval = setInterval(() => {
      const activeCount = queue.filter(s => s.status === 'admitted').length;
      const waitingCount = queue.filter(s => s.status === 'waiting').length;

      // Base loads shift depending on active students
      const baseCpu = 15 + activeCount * 25 + waitingCount * 2;
      const baseMemory = 30 + activeCount * 12 + waitingCount * 1;
      const baseNetwork = 5 + activeCount * 30 + waitingCount * 4;

      // Add minor random noise
      const cpu = Math.min(100, Math.max(5, Math.floor(baseCpu + (Math.random() * 8 - 4))));
      const memory = Math.min(100, Math.max(10, Math.floor(baseMemory + (Math.random() * 4 - 2))));
      const networkLoad = Math.min(100, Math.max(2, Math.floor(baseNetwork + (Math.random() * 6 - 3))));

      let status: 'Healthy' | 'Degraded' | 'Offline' = 'Healthy';
      if (cpu > 85 || networkLoad > 85) {
        status = 'Degraded';
      }
      if (maintenanceMode) {
        status = 'Healthy'; // maintenance has minimal traffic load
      }

      setServerHealth({ cpu, memory, networkLoad, status });
    }, 3000);

    return () => clearInterval(interval);
  }, [queue, maintenanceMode]);

  // Handle countdown timer inside exam; auto-submits when time runs out.
  // Also covers a resumed session that already had 0 seconds left server-side
  // (e.g. the student let the timer expire, closed the tab, and reopened it later).
  useEffect(() => {
    if (studentStatus !== 'exam') return;
    if (examTimeRemaining <= 0) {
      submitExam();
      return;
    }
    const timer = setInterval(() => {
      setExamTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          submitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: submitExam is stable enough for this ticking effect
  }, [studentStatus, examTimeRemaining]);

  // Live student WebSocket: queue position updates and the "admitted" push that moves a
  // waiting student straight into the exam with no page refresh.
  const inQueueOrExam = studentStatus === 'waiting' || studentStatus === 'exam';
  useEffect(() => {
    if (!sessionId || !inQueueOrExam) {
      studentWsRef.current?.close();
      studentWsRef.current = null;
      return;
    }
    const token = getToken();
    if (!token) return;

    const ws = openStudentSocket(sessionId, token, async (msg) => {
      if (msg.type === 'queue_position') {
        setQueuePosition(msg.position);
        setTotalWaiting(msg.total_waiting);
        setEstimatedWaitSeconds(msg.estimated_wait_seconds);
      } else if (msg.type === 'admitted') {
        try {
          const qs = await getQuestionsApi(currentExamSlug);
          setQuestions(qs.map(mapApiQuestion));
        } catch {
          // ignore; exam view will show an empty question list if this failed
        }
        setStudentAnswers({});
        setCurrentQuestionIndex(0);
        setExamTimeRemaining(examMeta ? examMeta.duration_minutes * 60 : 15 * 60);
        addLog('A slot opened up — you have been admitted into the exam.', 'success');
        setStudentStatus('exam');
      } else if (msg.type === 'exited') {
        addLog('You were removed from the active exam by an administrator.', 'danger');
        setSessionId(null);
        setStudentStatus('dashboard');
      }
    });
    studentWsRef.current = ws;
    return () => ws.close();
  }, [sessionId, inQueueOrExam, examMeta, currentExamSlug]);

  // Bootstrap: resolve the admin's exam + queue once right after login (before this,
  // adminExamId is unset so the WS-connect effect below has nothing to attach to yet).
  useEffect(() => {
    if (authUser && authUser.role === 'admin' && !adminExamId) {
      refreshAdminQueue();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: only re-run on auth change, adminExamId/refreshAdminQueue read fresh via closure
  }, [authUser]);

  // Admin WebSocket: re-pull the queue list whenever the server broadcasts a snapshot change
  // (someone joined, submitted, was force-admitted/ejected, or capacity changed).
  useEffect(() => {
    if (!authUser || authUser.role !== 'admin' || !adminExamId) {
      adminWsRef.current?.close();
      adminWsRef.current = null;
      return;
    }
    const token = getToken();
    if (!token) return;
    const ws = openAdminSocket(adminExamId, token, () => {
      refreshAdminQueue();
    });
    adminWsRef.current = ws;
    return () => ws.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: refreshAdminQueue is stable enough for this socket-lifecycle effect
  }, [authUser, adminExamId]);

  // Methods
  const refreshAdminQueue = async () => {
    if (!authUser || authUser.role !== 'admin') return;
    try {
      let examId = adminExamId;
      if (!examId) {
        const exams = await listExams();
        setAdminExams(exams);
        // Previously always defaulted to whichever exam had the slug 'dsa-101' (or just
        // exams[0]) — so the queue monitor silently kept watching the wrong exam once an
        // admin published a different one, always showing "No students active". Default to
        // the most recently published exam instead (falling back to most recently created),
        // and let selectAdminExam() below switch to any other exam explicitly.
        const published = exams.filter(e => e.status === 'published');
        const pool = published.length > 0 ? published : exams;
        const target = [...pool].sort((a, b) => {
          const aTime = new Date(a.published_at ?? a.created_at ?? 0).getTime();
          const bTime = new Date(b.published_at ?? b.created_at ?? 0).getTime();
          return bTime - aTime;
        })[0];
        if (!target) return;
        examId = target.id;
        setAdminExamId(examId);
        setCapacityState(target.max_active_students);
      }
      const list = await getAdminQueue(examId);
      setQueue(list.map(mapAdminQueueStudent));
    } catch {
      // ignore transient failures; the next WS snapshot or manual refresh will retry
    }
  };

  // Lets the admin explicitly switch which exam's live queue/session history they're viewing
  // (e.g. from a <select> on the Queue Monitoring page), instead of being stuck on whatever
  // refreshAdminQueue defaulted to.
  const selectAdminExam = (examId: string) => {
    const target = adminExams.find(e => e.id === examId);
    setAdminExamId(examId);
    setQueue([]);
    if (target) setCapacityState(target.max_active_students);
    getAdminQueue(examId).then(list => setQueue(list.map(mapAdminQueueStudent))).catch(() => {});
  };

  const setCapacity = async (cap: number) => {
    if (cap < 0 || !adminExamId) return;
    try {
      const updated = await updateCapacityApi(adminExamId, cap);
      setCapacityState(updated.max_active_students);
      addLog(`Admin adjusted max concurrent slot capacity to: ${cap}`, 'warning');
      await refreshAdminQueue();
    } catch (err) {
      addLog(err instanceof ApiError ? err.message : 'Failed to update capacity.', 'danger');
    }
  };

  const forceAdmit = async (targetSessionId: string) => {
    try {
      await forceAdmitApi(targetSessionId);
      addLog('Admin OVERRIDE: force-admitted a waiting student directly into the exam.', 'warning');
      await refreshAdminQueue();
    } catch (err) {
      addLog(err instanceof ApiError ? err.message : 'Failed to admit student.', 'danger');
    }
  };

  const forceExit = async (targetSessionId: string) => {
    try {
      await forceExitApi(targetSessionId);
      addLog('Admin OVERRIDE: ejected a student from the queue/exam.', 'danger');
      await refreshAdminQueue();
    } catch (err) {
      addLog(err instanceof ApiError ? err.message : 'Failed to remove student.', 'danger');
    }
  };

  const startExamSession = async () => {
    if (!studentUser) return;
    try {
      const exam = await getExam(currentExamSlug);
      setExamMeta(exam);
      const session: ApiSession = await startExam(currentExamSlug);
      setSessionId(session.id);

      if (session.status === 'in_progress') {
        const qs = await getQuestionsApi(currentExamSlug);
        setQuestions(qs.map(mapApiQuestion));
        const savedAnswers = await getAnswers(session.id);
        setStudentAnswers(Object.fromEntries(savedAnswers.map(a => [a.question_id, a.answer_text])));
        setExamTimeRemaining(session.time_remaining_seconds);
        setCurrentQuestionIndex(0);
        setProctoringViolations(0);
        addLog(`Student "${studentUser.name}" entered the exam directly (a slot was available).`, 'success');
        setStudentStatus('exam');
      } else {
        setQueuePosition(session.queue_position);
        setTotalWaiting(session.queue_position); // corrected by the next WS broadcast
        setEstimatedWaitSeconds(session.estimated_wait_seconds ?? 0);
        addLog(`Student "${studentUser.name}" joined the virtual queue at position #${session.queue_position}.`, 'info');
        setStudentStatus('waiting');
      }
    } catch (err) {
      addLog(err instanceof ApiError ? err.message : 'Could not start the exam. Please try again.', 'danger');
    }
  };

  const leaveQueue = async () => {
    if (!sessionId) return;
    try {
      await leaveQueueApi(sessionId);
      addLog('You left the queue.', 'info');
    } catch {
      // ignore; the session may have already been resolved server-side (e.g. just got admitted)
    }
    setSessionId(null);
    setQueuePosition(0);
    setStudentStatus('dashboard');
  };

  const answerSaveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const setAnswer = (questionId: string, answer: string) => {
    setStudentAnswers(prev => ({ ...prev, [questionId]: answer }));
    if (!sessionId) return;
    clearTimeout(answerSaveTimers.current[questionId]);
    answerSaveTimers.current[questionId] = setTimeout(() => {
      saveAnswersApi(sessionId, [{ question_id: questionId, answer_text: answer }]).catch(() => {});
    }, 800);
  };

  const addProctoringViolation = () => {
    setProctoringViolations(prev => {
      const nextVal = prev + 1;
      addLog(`Proctoring violation detected: Student switched window/tab. Violation Count: ${nextVal}`, 'danger');
      return nextVal;
    });
  };

  const submitExam = async () => {
    if (!sessionId || !studentUser) return;
    try {
      const payload = questions.map(q => ({ question_id: q.id, answer_text: studentAnswers[q.id] || '' }));
      const res = await submitExamApi(sessionId, payload, proctoringViolations);
      const { session } = res;
      setExamReport({
        score: session.score ?? 0,
        total: session.total_marks ?? 0,
        pass: !!session.passed,
        needsReview: session.needs_review,
      });
      setStudentStatus('submitted');
      addLog(
        `Student "${studentUser.name}" submitted the exam. Score: ${session.score}/${session.total_marks} (${session.passed ? 'PASS' : 'FAIL'})`,
        session.passed ? 'success' : 'danger'
      );
      setSessionId(null);
    } catch (err) {
      addLog(err instanceof ApiError ? err.message : 'Submission failed. Please try again.', 'danger');
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentExamSlug,
        setCurrentExamSlug,
        authUser,
        authLoading,
        authError,
        clearAuthError,
        loginStudent,
        registerStudent,
        loginAdmin,
        logoutUser,
        studentUser,
        setStudentUser,
        studentStatus,
        setStudentStatus,
        capacity,
        setCapacity,
        queue,
        refreshAdminQueue,
        leaveQueue,
        forceAdmit,
        forceExit,
        adminExams,
        adminExamId,
        selectAdminExam,
        examMeta,
        startExamSession,
        queuePosition,
        totalWaiting,
        estimatedWaitSeconds,
        questions,
        currentQuestionIndex,
        setCurrentQuestionIndex,
        studentAnswers,
        setAnswer,
        examTimeRemaining,
        setExamTimeRemaining,
        proctoringViolations,
        addProctoringViolation,
        submitExam,
        examReport,
        maintenanceMode,
        setMaintenanceMode,
        serverHealth,
        auditLogs,
        addLog,
        clearLogs
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components -- standard context-module pattern: provider + its hook live together
export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
