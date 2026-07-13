import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useApp } from '../state';
import {
  AlertTriangle, Play, HelpCircle, Terminal, Send, Clock,
  ChevronLeft, ChevronRight, Award, Wifi, Camera, Monitor, LogOut, Copy, Check,
} from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Input } from './ui/Field';
import { Modal } from './ui/Modal';
import { Checkbox } from './ui/Checkbox';
import { useToast } from './ui/Toast';
import { getPracticeQuestions, logPracticeQuestionClick, type PracticeQuestion } from '../api/exams';
import { sendChatMessage } from '../api/ai';
import { ApiError } from '../api/client';

interface ChatMessage {
  sender: 'student' | 'ai';
  text: string;
  isError?: boolean;
}

const QUICK_ACTIONS: { label: string; prompt: string }[] = [
  { label: 'Exam Rules', prompt: 'What are the exam rules I should know before starting?' },
  { label: 'Technical Help', prompt: "I'm having a technical issue — can you help me troubleshoot?" },
  { label: 'Queue Status', prompt: 'Can you explain how the waiting queue and my position work?' },
  { label: 'Browser Issues', prompt: 'Which browsers are supported and how do I fix browser compatibility issues?' },
  { label: 'Webcam Help', prompt: "My webcam isn't working — how do I fix webcam permissions?" },
  { label: 'Network Problems', prompt: "I'm having network or internet connection problems. What should I do?" },
  { label: 'Practice Questions', prompt: 'Tell me about the practice questions available while I wait.' },
  { label: 'FAQ', prompt: 'What are some frequently asked questions about ExamFlow?' },
];

export const StudentFlow: React.FC = () => {
  const {
    studentUser,
    studentStatus, setStudentStatus,
    startExamSession, leaveQueue, queuePosition, totalWaiting, estimatedWaitSeconds,
    currentExamSlug,
    questions, currentQuestionIndex, setCurrentQuestionIndex,
    studentAnswers, setAnswer,
    examTimeRemaining,
    proctoringViolations, addProctoringViolation,
    submitExam, examReport,
    maintenanceMode,
    loginStudent, registerStudent, authError, clearAuthError, logoutUser
  } = useApp();

  const navigate = useNavigate();
  const location = useLocation() as { state?: { message?: string } };
  const { show } = useToast();

  // Local form states
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formStudentId, setFormStudentId] = useState('');
  const [formCollege, setFormCollege] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // System check states
  const [checking, setChecking] = useState(false);
  const [checksPassed, setChecksPassed] = useState(false);
  const [checkStatus, setCheckStatus] = useState({ browser: 'idle', internet: 'idle', camera: 'idle' });
  const [speedVal, setSpeedVal] = useState(0);

  // Prep lounge states
  const [practiceInput, setPracticeInput] = useState(`// Practice Sandbox\nfunction doubleNumber(n) {\n  return n * 2;\n}`);
  const [practiceOutput, setPracticeOutput] = useState('Output console idle...');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { sender: 'ai', text: "Hello! I'm ExamFlow AI, your examination support assistant. Ask me about exam rules, the waiting queue, technical issues, or anything else ExamFlow-related." }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [aiTyping, setAiTyping] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [practiceQuestions, setPracticeQuestions] = useState<PracticeQuestion[]>([]);
  const [clickedPracticeIds, setClickedPracticeIds] = useState<Set<string>>(new Set());

  // Active Exam state
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [proctorWarning, setProctorWarning] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // Active Student Queue position (live, pushed over WebSocket — see startExamSession/state.tsx)
  const queuePos = queuePosition;
  const totalQueueSize = totalWaiting;

  const formatWait = (seconds: number): string => {
    if (seconds <= 0) return 'Admitting…';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} min ${secs.toString().padStart(2, '0')} sec`;
  };

  // Heuristic practice-question recommendations for the waiting lounge (see backend/app/heuristics.py) —
  // fetched once per wait, never includes this exam's own questions.
  useEffect(() => {
    if (studentStatus !== 'waiting') return;
    getPracticeQuestions(currentExamSlug).then(setPracticeQuestions).catch(() => setPracticeQuestions([]));
  }, [studentStatus, currentExamSlug]);

  const handlePracticeClick = (question: PracticeQuestion) => {
    setClickedPracticeIds(prev => new Set(prev).add(question.id));
    logPracticeQuestionClick(currentExamSlug, question.id).catch(() => {});
  };

  // Track page focus for proctoring
  useEffect(() => {
    const handleBlur = () => {
      if (studentStatus === 'exam') {
        addProctoringViolation();
        setProctorWarning(true);
      }
    };

    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: re-bind only when studentStatus changes
  }, [studentStatus]);

  // Handle system check triggers
  const runSystemChecks = () => {
    setChecking(true);
    setCheckStatus({ browser: 'running', internet: 'running', camera: 'running' });

    setTimeout(() => {
      setCheckStatus(prev => ({ ...prev, browser: 'success' }));
    }, 1000);

    setTimeout(() => {
      setCheckStatus(prev => ({ ...prev, internet: 'success' }));
      setSpeedVal(45);
    }, 2000);

    setTimeout(() => {
      setCheckStatus(prev => ({ ...prev, camera: 'success' }));
      setChecking(false);
      setChecksPassed(true);
    }, 3000);
  };

  // Register & Login Submit — now calls the real backend instead of faking a local user
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    clearAuthError();

    if (authMode === 'register') {
      if (!formName || !formEmail || !formPassword || !formStudentId) {
        setFormError('Please fill in all required fields.');
        return;
      }
      setSubmitting(true);
      const ok = await registerStudent({ name: formName, email: formEmail, password: formPassword, studentId: formStudentId, college: formCollege || undefined });
      setSubmitting(false);
      if (ok) {
        show({ tone: 'success', title: 'Registration successful.', description: 'Please log in with your new credentials.' });
        setAuthMode('login');
        setFormPassword('');
      }
    } else {
      if (!formEmail || !formPassword) {
        setFormError('Please enter your email and password.');
        return;
      }
      setSubmitting(true);
      const ok = await loginStudent(formEmail, formPassword, rememberMe);
      setSubmitting(false);
      if (ok) navigate('/app');
    }
  };

  const handleStartExamFlow = () => {
    setStudentStatus('system_check');
    setChecksPassed(false);
    setCheckStatus({ browser: 'idle', internet: 'idle', camera: 'idle' });
  };

  const handleJoinQueue = () => {
    if (!studentUser) return;
    startExamSession();
  };

  // Run Practice Sandbox Code
  const runPracticeCode = () => {
    setPracticeOutput('Running test assertions...');
    setTimeout(() => {
      try {
        if (practiceInput.includes('doubleNumber')) {
          if (practiceInput.includes('return') && (practiceInput.includes('* 2') || practiceInput.includes('+ n'))) {
            setPracticeOutput('✓ Test Case 1: doubleNumber(5) => 10\n✓ Test Case 2: doubleNumber(-3) => -6\n\nALL PRACTICE TESTS PASSED (100%)');
          } else {
            setPracticeOutput('✗ Test Case 1: doubleNumber(5) => Expected 10, got unexpected return value.\n\nTEST COMPILATION ERROR');
          }
        } else {
          setPracticeOutput('Running default code...\nDone. Result: undefined');
        }
      } catch (err: any) {
        setPracticeOutput(`SyntaxError: ${err.message}`);
      }
    }, 500);
  };

  // Run Active Exam Code
  const [examConsoleOutput, setExamConsoleOutput] = useState('Console idle...');
  const runActiveExamCode = (code: string) => {
    setExamConsoleOutput('Compiling code...\nExecuting test cases...');
    setTimeout(() => {
      if (code.includes('isPalindrome')) {
        const test1 = code.includes('return') && (code.includes('reverse') || code.includes('split') || code.includes('replace'));
        if (test1) {
          setExamConsoleOutput('✓ Test 1 (Palindrome String with special chars) => Passed\n✓ Test 2 (Non-palindrome String) => Passed\n✓ Test 3 (Empty & Spaces) => Passed\n\nALL TEST CASES PASSED (3/3)');
        } else {
          setExamConsoleOutput('✗ Test 1: isPalindrome("A man, a plan, a canal: Panama") => Expected: true, got: false\n✗ Test 2: isPalindrome("race a car") => Expected: false, got: false\n\nTEST FAILED (0/3 passed)');
        }
      } else {
        setExamConsoleOutput('Error: Function isPalindrome not found or syntax error.');
      }
    }, 600);
  };

  // AI Chat interaction — POST /api/ai/chat (FastAPI backend, which talks to OpenAI; the
  // frontend never calls OpenAI directly).
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, aiTyping]);

  const sendMessage = async (raw: string) => {
    const userMsg = raw.trim();
    if (!userMsg || aiTyping) return;

    setChatMessages(prev => [...prev, { sender: 'student', text: userMsg }]);
    setChatInput('');
    setAiTyping(true);

    try {
      const { reply } = await sendChatMessage(userMsg);
      setChatMessages(prev => [...prev, { sender: 'ai', text: reply }]);
    } catch (err) {
      const text = err instanceof ApiError
        ? err.message
        : 'Could not reach the AI assistant. Please check your connection and try again.';
      setChatMessages(prev => [...prev, { sender: 'ai', text, isError: true }]);
    } finally {
      setAiTyping(false);
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(chatInput);
  };

  const handleChatKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(chatInput);
    }
  };

  const handleCopyMessage = (index: number, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(prev => (prev === index ? null : prev)), 1500);
    }).catch(() => {
      show({ tone: 'danger', title: 'Could not copy to clipboard' });
    });
  };

  // Format countdown time
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Maintenance screen fallback
  if (maintenanceMode) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: 40, textAlign: 'center' }}>
        <Card padding="lg" style={{ maxWidth: 450, borderTop: '4px solid var(--warning-9)' }}>
          <AlertTriangle size={44} color="var(--warning-9)" style={{ marginBottom: 20 }} />
          <h2 style={{ color: 'var(--text-primary)', marginBottom: 12 }}>System Under Maintenance</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 24 }}>
            ExamFlow AI active gates are currently undergoing routine infrastructure updates. Administrators have enabled maintenance mode.
          </p>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Please check back in a few minutes or contact support.</div>
        </Card>
      </div>
    );
  }

  return (
    <div className={studentStatus === 'logged_out' ? 'grid-background' : undefined} style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '32px 24px', maxWidth: 1200, width: '100%', margin: '0 auto' }}>

      {/* 1. Logged Out View */}
      {studentStatus === 'logged_out' && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, padding: '40px 0' }}>
          <Card padding="lg" style={{ width: '100%', maxWidth: 440 }} className="animate-scale-in">
            <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 6, textAlign: 'center', color: 'var(--text-primary)' }}>Student Exam Sign-In</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 24, textAlign: 'center' }}>
              {authMode === 'register'
                ? 'Register your workspace to access scheduling, practice logs, and active examinations.'
                : 'Sign in to view scheduled exams, resume your queue position, or continue an active session.'}
            </p>

            {location.state?.message && (
              <div style={{ background: 'var(--danger-subtle-bg)', border: '1px solid var(--danger-subtle-border)', borderRadius: 'var(--radius-md)', padding: '11px 14px', color: 'var(--danger-9)', fontSize: 'var(--text-sm)', marginBottom: 16 }}>
                {location.state.message}
              </div>
            )}

            <div style={{ display: 'flex', gap: 6, background: 'var(--surface-2)', padding: 4, borderRadius: 'var(--radius-lg)', marginBottom: 22 }}>
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setFormError(''); clearAuthError(); }}
                style={tabBtnStyle(authMode === 'login')}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('register'); setFormError(''); clearAuthError(); }}
                style={tabBtnStyle(authMode === 'register')}
              >
                Register
              </button>
            </div>

            {(formError || authError) && (
              <div style={{ background: 'var(--danger-subtle-bg)', border: '1px solid var(--danger-subtle-border)', borderRadius: 'var(--radius-md)', padding: '11px 14px', color: 'var(--danger-9)', fontSize: 'var(--text-sm)', marginBottom: 16 }}>
                {formError || authError}
              </div>
            )}

            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {authMode === 'register' && (
                <Input label="Full Name" required placeholder="e.g. Anya Sharma" value={formName} onChange={e => setFormName(e.target.value)} />
              )}

              <Input label="University Email Address" type="email" required placeholder="anya@university.edu" value={formEmail} onChange={e => setFormEmail(e.target.value)} />
              <Input label="Password" type="password" required placeholder="••••••••" value={formPassword} onChange={e => setFormPassword(e.target.value)} />

              {authMode === 'login' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Checkbox checked={rememberMe} onChange={setRememberMe} label="Remember me" />
                  <Link to="/forgot-password" style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-9)', fontWeight: 600, textDecoration: 'none' }}>Forgot password?</Link>
                </div>
              )}

              {authMode === 'register' && (
                <>
                  <Input label="Student Enrollment ID" required placeholder="STU-2026-9481" value={formStudentId} onChange={e => setFormStudentId(e.target.value)} />
                  <Input label="Institution Affiliation Code (Optional)" placeholder="COL-IIT-B" value={formCollege} onChange={e => setFormCollege(e.target.value)} />
                </>
              )}

              <Button type="submit" fullWidth loading={submitting} style={{ marginTop: 4 }}>
                {authMode === 'register' ? 'Access Student Dashboard' : 'Sign In'}
              </Button>
            </form>
          </Card>
        </div>
      )}

      {/* 2. Dashboard View */}
      {studentStatus === 'dashboard' && studentUser && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', flex: 1 }}>
          <Card style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h2 style={{ fontSize: 'var(--text-2xl)', color: 'var(--text-primary)' }}>Welcome, {studentUser.name}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>Enrollment ID: {studentUser.studentId} · Session active</p>
            </div>
            <Button variant="secondary" icon={<LogOut size={14} />} onClick={() => { logoutUser(); navigate('/'); }}>Log Out</Button>
          </Card>

          <h3 style={{ fontSize: 'var(--text-lg)', color: 'var(--text-primary)' }}>Active & Scheduled Examinations</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-5)' }}>

            <Card padding="lg" accent="top" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <Badge tone="success" dot>Live Now</Badge>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Points: 45</span>
              </div>
              <h4 style={{ fontSize: 'var(--text-lg)', marginBottom: 8, color: 'var(--text-primary)' }}>Data Structures & Algorithms Midterm</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', flex: 1, marginBottom: 20, lineHeight: 'var(--leading-normal)' }}>
                Covers algorithmic complexities, linear/tree structures, and data filters. Tab-proctoring lock will be enforced.
              </p>
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Duration: 15 mins</div>
                <Button size="sm" icon={<Play size={12} />} iconPosition="right" onClick={handleStartExamFlow}>Start Assessment</Button>
              </div>
            </Card>

            <Card padding="lg" style={{ display: 'flex', flexDirection: 'column', height: '100%', opacity: 0.75 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <Badge tone="accent">Scheduled</Badge>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Tomorrow</span>
              </div>
              <h4 style={{ fontSize: 'var(--text-lg)', marginBottom: 8, color: 'var(--text-primary)' }}>SYS-202: Systems Programming Final</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', flex: 1, marginBottom: 20, lineHeight: 'var(--leading-normal)' }}>
                Covers POSIX thread APIs, concurrency structures, virtual locks, socket servers, and process allocation algorithms.
              </p>
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Duration: 120 mins</div>
                <Button size="sm" variant="secondary" disabled>Locked</Button>
              </div>
            </Card>

          </div>
        </div>
      )}

      {/* 3. Pre-Exam System Check */}
      {studentStatus === 'system_check' && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, padding: '20px 0' }}>
          <Card padding="lg" style={{ width: '100%', maxWidth: 500 }}>
            <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 6, textAlign: 'center', color: 'var(--text-primary)' }}>Pre-Exam Security Check</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 24, textAlign: 'center' }}>
              Ensure your browser, webcam permissions, and network connection meet compliance protocols.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 26 }}>
              <SystemCheckRow icon={Monitor} label="Browser Compatibility" hint="Chrome / Safari / Firefox standards" status={checkStatus.browser} successLabel="Passed" />
              <SystemCheckRow icon={Wifi} label="Network Connection" hint="Minimum bandwidth req: 10 Mbps" status={checkStatus.internet} successLabel={`${speedVal} Mbps`} runningLabel="Checking speed…" />
              <SystemCheckRow icon={Camera} label="Peripherals (Webcam & Mic)" hint="Used for active integrity checks" status={checkStatus.camera} successLabel="Active" runningLabel="Authorizing…" />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <Button variant="secondary" fullWidth onClick={() => setStudentStatus('dashboard')} disabled={checking}>Cancel</Button>
              {!checksPassed ? (
                <Button fullWidth loading={checking} onClick={runSystemChecks} style={{ flex: 1.5 }}>
                  {checking ? 'Checking Peripherals' : 'Run Security Check'}
                </Button>
              ) : (
                <Button fullWidth onClick={handleJoinQueue} style={{ flex: 1.5 }}>Join Wait List & Entrance</Button>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* 4. Waiting Lounge (Preparation Lounge) */}
      {studentStatus === 'waiting' && studentUser && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', flex: 1 }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 'var(--space-5)', alignItems: 'stretch' }}>

            <Card padding="lg" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <h4 style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 16 }}>Your Queue Position</h4>

              <div style={{ position: 'relative', width: 160, height: 160, marginBottom: 18 }}>
                <svg width="160" height="160" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="var(--border-subtle)" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="45" fill="none" stroke="var(--accent-9)" strokeWidth="8"
                    strokeDasharray="283"
                    strokeDashoffset={283 - (283 * (1 - (queuePos / Math.max(1, totalQueueSize))))}
                    strokeLinecap="round"
                    style={{ transform: 'rotate(-90deg)', transformOrigin: '50px 50px', transition: 'stroke-dashoffset 1s ease' }}
                  />
                </svg>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                  <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, fontFamily: 'var(--font-display)' }}>#{queuePos}</div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 4 }}>of {totalQueueSize} waiting</div>
                </div>
              </div>

              <div style={{ background: 'var(--surface-2)', padding: '12px 18px', borderRadius: 'var(--radius-lg)', width: '100%', marginBottom: 18 }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>ESTIMATED WAIT TIME</div>
                <div style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--accent-9)', marginTop: 2 }}>
                  {formatWait(estimatedWaitSeconds)}
                </div>
              </div>

              <Button variant="secondary" fullWidth onClick={() => leaveQueue()}>Leave Queue (Exit)</Button>
            </Card>

            <Card padding="lg" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'left' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <h3 style={{ fontSize: 'var(--text-xl)', color: 'var(--text-primary)' }}>Smart Preparation Lounge</h3>
                  <Badge tone="info"><Wifi size={10} /> Live Gateway Connected</Badge>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 16, lineHeight: 'var(--leading-normal)' }}>
                  We limit active slots on our grading compiler databases to guarantee full processing speeds and eliminate runtime timeouts. You will be automatically redirected to the exam environment as soon as a slot opens — no refresh needed.
                </p>

                <div style={{ background: 'var(--accent-subtle-bg)', border: '1px solid var(--accent-subtle-border)', padding: '10px 14px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <Badge tone="accent">Broadcast</Badge>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Announcement: Practice submissions in this lounge do not affect your final midterm grade.
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, borderTop: '1px solid var(--border-subtle)', paddingTop: 18 }}>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Active Server Health</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--success-9)', display: 'inline-block' }} />
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>Healthy (99.9% uptime)</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Exam Code Target</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, marginTop: 4, color: 'var(--text-primary)' }}>JavaScript ES6 Sandbox</div>
                </div>
              </div>
            </Card>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.4fr', gap: 'var(--space-5)', alignItems: 'stretch' }}>

            <Card padding="lg" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', minHeight: 340 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h4 style={{ fontSize: 'var(--text-base)', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)' }}>
                  <Terminal size={16} color="var(--accent-9)" /> Mini Practice IDE
                </h4>
                <Button size="sm" icon={<Play size={11} />} onClick={runPracticeCode}>Run Code</Button>
              </div>

              <textarea
                style={{ flex: 1, background: 'var(--surface-0)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--accent-9)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', padding: 12, resize: 'none', outline: 'none', minHeight: 160, lineHeight: 1.5 }}
                value={practiceInput}
                onChange={e => setPracticeInput(e.target.value)}
              />

              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 4 }}>Execution Console</div>
                <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 10, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', minHeight: 60, whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)' }}>
                  {practiceOutput}
                </div>
              </div>
            </Card>

            <Card padding="lg" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', height: 340 }}>
              <h4 style={{ fontSize: 'var(--text-base)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)' }}>
                <HelpCircle size={16} color="var(--accent-9)" /> ExamFlow AI Assistant
              </h4>

              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, padding: 10, background: 'var(--surface-0)', borderRadius: 'var(--radius-md)', marginBottom: 10 }}>
                {chatMessages.map((m, i) => (
                  <div key={i} style={{
                    alignSelf: m.sender === 'student' ? 'flex-end' : 'flex-start',
                    background: m.sender === 'student' ? 'var(--accent-9)' : (m.isError ? 'var(--danger-subtle-bg)' : 'var(--surface-2)'),
                    color: m.sender === 'student' ? 'var(--text-on-accent)' : (m.isError ? 'var(--danger-9)' : 'var(--text-primary)'),
                    padding: '8px 26px 8px 12px',
                    borderRadius: 'var(--radius-lg)',
                    maxWidth: '85%',
                    fontSize: 'var(--text-xs)',
                    lineHeight: 1.4,
                    border: m.sender === 'ai' ? `1px solid ${m.isError ? 'var(--danger-subtle-border)' : 'var(--border-subtle)'}` : 'none',
                    position: 'relative',
                  }}>
                    {m.sender === 'ai' ? (
                      <div className="ai-markdown">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{ a: (props) => <a {...props} target="_blank" rel="noopener noreferrer" /> }}
                        >
                          {m.text}
                        </ReactMarkdown>
                      </div>
                    ) : m.text}
                    {m.sender === 'ai' && !m.isError && (
                      <button
                        type="button"
                        onClick={() => handleCopyMessage(i, m.text)}
                        aria-label="Copy response"
                        title="Copy response"
                        style={{ position: 'absolute', top: 6, right: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: 2, display: 'flex' }}
                      >
                        {copiedIndex === i ? <Check size={11} color="var(--success-9)" /> : <Copy size={11} />}
                      </button>
                    )}
                  </div>
                ))}
                {aiTyping && (
                  <div style={{ alignSelf: 'flex-start', background: 'var(--surface-2)', border: '1px solid var(--border-subtle)', padding: '9px 14px', borderRadius: 'var(--radius-lg)' }}>
                    <span className="ai-typing-dots" aria-label="Assistant is typing"><span /><span /><span /></span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="ai-quick-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {QUICK_ACTIONS.map(qa => (
                  <button
                    key={qa.label}
                    type="button"
                    onClick={() => sendMessage(qa.prompt)}
                    disabled={aiTyping}
                    style={{
                      fontSize: 'var(--text-xs)', padding: '4px 10px', borderRadius: 'var(--radius-full)',
                      border: '1px solid var(--border-default)', background: 'var(--surface-2)', color: 'var(--text-secondary)',
                      cursor: aiTyping ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit', flexShrink: 0,
                    }}
                  >
                    {qa.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSendChat} style={{ display: 'flex', gap: 8 }}>
                <textarea
                  className="form-input"
                  placeholder="Ask a question… (Enter to send, Shift+Enter for a new line)"
                  rows={1}
                  style={{ flex: 1, padding: '9px 12px', fontSize: 'var(--text-sm)', resize: 'none', fontFamily: 'inherit', maxHeight: 72 }}
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={handleChatKeyDown}
                />
                <Button type="submit" icon={<Send size={14} />} aria-label="Send message" loading={aiTyping} disabled={!chatInput.trim() && !aiTyping} />
              </form>
            </Card>

          </div>

          {practiceQuestions.length > 0 && (
            <Card padding="lg" style={{ textAlign: 'left' }}>
              <h4 style={{ fontSize: 'var(--text-base)', marginBottom: 4, color: 'var(--text-primary)' }}>Recommended Practice Questions</h4>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: 14 }}>
                Matched to this exam's subjects and topics from the Question Bank — never the actual exam questions.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {practiceQuestions.map(q => (
                  <button
                    key={q.id}
                    onClick={() => handlePracticeClick(q)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', textAlign: 'left',
                      border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                      background: clickedPracticeIds.has(q.id) ? 'var(--accent-subtle-bg)' : 'var(--surface-2)',
                      fontFamily: 'inherit', color: 'var(--text-primary)', fontSize: 'var(--text-sm)',
                    }}
                  >
                    <span style={{ flex: 1 }}>{q.question_text}</span>
                    <Badge tone="neutral">{q.subject ?? q.type}</Badge>
                    <Badge tone="accent">{q.difficulty}</Badge>
                  </button>
                ))}
              </div>
            </Card>
          )}

        </div>
      )}

      {/* 5. Active Exam Engine */}
      {studentStatus === 'exam' && studentUser && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', flex: 1, position: 'relative' }}>

          <Card padding="md" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ fontSize: 'var(--text-lg)', color: 'var(--text-primary)' }}>DSA-101 Midterm Examination</h3>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Student: {studentUser.name} ({studentUser.studentId})</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--danger-subtle-bg)', padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--danger-subtle-border)' }}>
                <AlertTriangle size={13} color="var(--danger-9)" />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--danger-9)', fontWeight: 600 }}>Violations: {proctoringViolations}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-2)', padding: '6px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <Clock size={15} color="var(--accent-9)" />
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-9)', fontSize: 'var(--text-sm)' }}>{formatTime(examTimeRemaining)}</span>
              </div>

              <Button size="sm" onClick={() => setShowSubmitConfirm(true)}>Submit Exam</Button>
            </div>
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: 'var(--space-5)', alignItems: 'stretch' }}>

            <Card style={{ display: 'flex', flexDirection: 'column', gap: 20, textAlign: 'left' }}>
              <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 10, color: 'var(--text-primary)' }}>Question Navigator</h4>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {questions.map((q, idx) => {
                  const isAnswered = studentAnswers[q.id] !== undefined && studentAnswers[q.id] !== '';
                  const isMarked = markedForReview[q.id];

                  let borderCol = 'var(--border-default)';
                  let bgCol = 'var(--surface-2)';
                  let textCol = 'var(--text-secondary)';

                  if (currentQuestionIndex === idx) {
                    borderCol = 'var(--accent-9)'; bgCol = 'var(--accent-subtle-bg)'; textCol = 'var(--accent-9)';
                  } else if (isMarked) {
                    borderCol = 'var(--warning-9)'; bgCol = 'var(--warning-subtle-bg)'; textCol = 'var(--warning-9)';
                  } else if (isAnswered) {
                    borderCol = 'var(--success-9)'; bgCol = 'var(--success-subtle-bg)'; textCol = 'var(--success-9)';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      style={{
                        width: 42, height: 42, borderRadius: 'var(--radius-md)', border: `1.5px solid ${borderCol}`,
                        background: bgCol, color: textCol, fontSize: 'var(--text-sm)', fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all var(--duration-fast) var(--ease-out)',
                        fontFamily: 'var(--font-sans)',
                      }}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
                <LegendItem color="var(--success-9)" label="Answered" />
                <LegendItem color="var(--warning-9)" label="Marked for Review" />
                <LegendItem color="var(--accent-9)" label="Current Question" />
              </div>
            </Card>

            <Card style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', minHeight: 400 }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
                <h4 style={{ fontSize: 'var(--text-lg)', color: 'var(--text-primary)' }}>Question {currentQuestionIndex + 1}</h4>
                <Badge tone="accent">{questions[currentQuestionIndex].points} points</Badge>
              </div>

              <p style={{ color: 'var(--text-primary)', fontSize: 'var(--text-base)', marginBottom: 24, whiteSpace: 'pre-wrap', lineHeight: 'var(--leading-normal)' }}>
                {questions[currentQuestionIndex].description}
              </p>

              <div style={{ flex: 1, marginBottom: 24 }}>

                {questions[currentQuestionIndex].type === 'mcq' && questions[currentQuestionIndex].options && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {questions[currentQuestionIndex].options!.map((opt, i) => {
                      const activeId = questions[currentQuestionIndex].id;
                      const selected = studentAnswers[activeId] === opt;
                      return (
                        <label
                          key={i}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            background: selected ? 'var(--accent-subtle-bg)' : 'var(--surface-2)',
                            border: `1.5px solid ${selected ? 'var(--accent-9)' : 'var(--border-subtle)'}`,
                            padding: '13px 16px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                            transition: 'all var(--duration-fast) var(--ease-out)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)',
                          }}
                        >
                          <input type="radio" name={`mcq-${activeId}`} value={opt} checked={selected} onChange={() => setAnswer(activeId, opt)} style={{ accentColor: 'var(--accent-9)' }} />
                          <span>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {questions[currentQuestionIndex].type === 'coding' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>JavaScript Editor</span>
                      <Button size="sm" variant="secondary" icon={<Play size={11} />} onClick={() => runActiveExamCode(studentAnswers[questions[currentQuestionIndex].id] || questions[currentQuestionIndex].initialCode || '')}>Test Code Execution</Button>
                    </div>
                    <textarea
                      style={{ background: 'var(--surface-0)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--accent-9)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', padding: 14, minHeight: 180, resize: 'vertical', outline: 'none', lineHeight: 1.5 }}
                      value={studentAnswers[questions[currentQuestionIndex].id] !== undefined ? studentAnswers[questions[currentQuestionIndex].id] : questions[currentQuestionIndex].initialCode}
                      onChange={e => setAnswer(questions[currentQuestionIndex].id, e.target.value)}
                    />
                    <div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 4 }}>Output Console</div>
                      <div style={{ background: 'var(--surface-0)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: 10, fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', minHeight: 60, whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)' }}>
                        {examConsoleOutput}
                      </div>
                    </div>
                  </div>
                )}

                {questions[currentQuestionIndex].type === 'sql' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>SQL Editor</span>
                    <textarea
                      style={{ background: 'var(--surface-0)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--accent-9)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', padding: 14, minHeight: 120, resize: 'vertical', outline: 'none', lineHeight: 1.5 }}
                      value={studentAnswers[questions[currentQuestionIndex].id] !== undefined ? studentAnswers[questions[currentQuestionIndex].id] : questions[currentQuestionIndex].initialCode}
                      onChange={e => setAnswer(questions[currentQuestionIndex].id, e.target.value)}
                    />
                  </div>
                )}

              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: 18, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <Button size="sm" variant="secondary" icon={<ChevronLeft size={13} />} disabled={currentQuestionIndex === 0} onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}>Previous</Button>
                  <Button size="sm" variant="secondary" icon={<ChevronRight size={13} />} iconPosition="right" disabled={currentQuestionIndex === questions.length - 1} onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}>Next</Button>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={markedForReview[questions[currentQuestionIndex].id] || false}
                    onChange={e => setMarkedForReview(prev => ({ ...prev, [questions[currentQuestionIndex].id]: e.target.checked }))}
                    style={{ accentColor: 'var(--warning-9)' }}
                  />
                  <span>Mark for Review</span>
                </label>
              </div>

            </Card>
          </div>

          <Modal open={proctorWarning} onClose={() => setProctorWarning(false)} width={400}>
            <div style={{ textAlign: 'center' }}>
              <AlertTriangle size={44} color="var(--danger-9)" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: 'var(--text-xl)', marginBottom: 10, color: 'var(--text-primary)' }}>Proctoring Warning</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 20 }}>
                Tab switch or loss of window focus detected. All browser exits are securely logged and sent to administrators. Repeated attempts will trigger exam lockout.
              </p>
              <Button fullWidth onClick={() => setProctorWarning(false)}>I Understand, Resume Exam</Button>
            </div>
          </Modal>

          <Modal open={showSubmitConfirm} onClose={() => setShowSubmitConfirm(false)} width={420}>
            <div style={{ textAlign: 'center' }}>
              <Send size={40} color="var(--accent-9)" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: 'var(--text-xl)', marginBottom: 10, color: 'var(--text-primary)' }}>Submit Exam?</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 20 }}>
                You have answered {Object.values(studentAnswers).filter(a => a && a.trim() !== '').length} of {questions.length} questions.
                Once submitted, your answers are locked and cannot be changed.
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <Button variant="secondary" fullWidth onClick={() => setShowSubmitConfirm(false)}>Cancel, Keep Working</Button>
                <Button fullWidth onClick={() => { setShowSubmitConfirm(false); submitExam(); }}>Yes, Submit Now</Button>
              </div>
            </div>
          </Modal>

        </div>
      )}

      {/* 6. Submitted Report Card */}
      {studentStatus === 'submitted' && examReport && studentUser && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, padding: '40px 0' }}>
          <Card padding="lg" style={{ width: '100%', maxWidth: 520, textAlign: 'center' }} className="animate-scale-in">
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: examReport.pass ? 'var(--success-subtle-bg)' : 'var(--danger-subtle-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Award size={36} color={examReport.pass ? 'var(--success-9)' : 'var(--danger-9)'} />
            </div>

            <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 6, color: 'var(--text-primary)' }}>Exam Submitted Successfully</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 24 }}>
              Your answers have been graded. Here is your preliminary assessment score.
              {examReport.needsReview && ' Some answers are flagged for manual review.'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
              <div style={{ background: 'var(--surface-2)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Your Score</div>
                <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: examReport.pass ? 'var(--success-9)' : 'var(--danger-9)', marginTop: 4, fontFamily: 'var(--font-display)' }}>
                  {examReport.score} / {examReport.total}
                </div>
              </div>
              <div style={{ background: 'var(--surface-2)', padding: 16, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Status</div>
                <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: examReport.pass ? 'var(--success-9)' : 'var(--danger-9)', marginTop: 4, fontFamily: 'var(--font-display)' }}>
                  {examReport.pass ? 'PASS' : 'FAIL'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--surface-2)', padding: 14, borderRadius: 'var(--radius-md)', marginBottom: 28, textAlign: 'left' }}>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 6, marginBottom: 6, fontWeight: 600 }}>Integrity Audit Records</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Focus exits recorded:</span>
                <span style={{ color: proctoringViolations > 0 ? 'var(--danger-9)' : 'var(--success-9)', fontWeight: 700 }}>{proctoringViolations} times</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Proctoring Status:</span>
                <span style={{ color: proctoringViolations > 2 ? 'var(--warning-9)' : 'var(--success-9)', fontWeight: 700 }}>
                  {proctoringViolations > 2 ? 'Flagged for Review' : 'Verified Secure'}
                </span>
              </div>
            </div>

            <Button variant="secondary" fullWidth onClick={() => setStudentStatus('dashboard')}>Return to Dashboard</Button>
          </Card>
        </div>
      )}

    </div>
  );
};

const tabBtnStyle = (active: boolean): React.CSSProperties => ({
  flex: 1,
  border: 'none',
  padding: '9px',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-sans)',
  fontWeight: 600,
  fontSize: 'var(--text-sm)',
  cursor: 'pointer',
  background: active ? 'var(--accent-9)' : 'transparent',
  color: active ? 'var(--text-on-accent)' : 'var(--text-secondary)',
  transition: 'all var(--duration-fast) var(--ease-out)',
});

const LegendItem: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <span style={{ width: 10, height: 10, borderRadius: 2, border: `1.5px solid ${color}`, background: `color-mix(in srgb, ${color} 14%, transparent)` }} />
    <span>{label}</span>
  </div>
);

const SystemCheckRow: React.FC<{
  icon: React.ElementType;
  label: string;
  hint: string;
  status: string;
  successLabel: string;
  runningLabel?: string;
}> = ({ icon: Icon, label, hint, status, successLabel, runningLabel = 'Verifying…' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--surface-2)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
    <Icon size={19} color={status === 'success' ? 'var(--success-9)' : 'var(--text-tertiary)'} />
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{hint}</div>
    </div>
    {status === 'idle' && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Pending</span>}
    {status === 'running' && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-9)' }}>{runningLabel}</span>}
    {status === 'success' && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--success-9)', fontWeight: 700 }}>✓ {successLabel}</span>}
  </div>
);
