import { apiFetch } from './client';

export interface ApiExam {
  id: string;
  slug: string;
  title: string;
  description: string;
  instructions: string;
  duration_minutes: number;
  passing_marks: number;
  negative_marking: boolean;
  random_question_order: boolean;
  random_option_order: boolean;
  max_active_students: number;
  queue_capacity: number;
  programming_languages: string[];
  browser_restrictions: Record<string, unknown>;
  status: string;
  question_count: number;
  question_ids: string[];
  start_date: string | null;
  end_date: string | null;
  created_at: string | null;
  published_at: string | null;
}

export interface ApiQuestion {
  id: string;
  type: 'mcq' | 'multiple_correct' | 'coding' | 'sql' | 'fill_blank' | 'short_answer' | 'descriptive';
  question_text: string;
  options: string[];
  initial_code: string | null;
  marks: number;
  negative_marks: number;
  programming_language: string | null;
}

export interface ApiSession {
  id: string;
  exam_id: string;
  status: 'waiting' | 'in_progress' | 'submitted' | 'exited';
  queue_position: number;
  estimated_wait_seconds: number | null;
  time_remaining_seconds: number;
  proctoring_violations: number;
  score: number | null;
  total_marks: number | null;
  passed: boolean | null;
  needs_review: boolean;
}

export interface SubmitResponse {
  session: ApiSession;
  redirect_to: string;
}

export const listPublishedExams = () => apiFetch<ApiExam[]>('/api/exams');

export const getExam = (slug: string) => apiFetch<ApiExam>(`/api/exams/${slug}`);

export const startExam = (slug: string) => apiFetch<ApiSession>(`/api/exams/${slug}/start`, { method: 'POST' });

export const getQuestions = (slug: string) => apiFetch<ApiQuestion[]>(`/api/exams/${slug}/questions`);

export interface PracticeQuestion {
  id: string;
  type: ApiQuestion['type'];
  question_text: string;
  subject: string | null;
  topic: string | null;
  difficulty: string;
  marks: number;
  programming_language: string | null;
}

export const getPracticeQuestions = (slug: string) => apiFetch<PracticeQuestion[]>(`/api/exams/${slug}/practice-questions`);

export const logPracticeQuestionClick = (slug: string, questionId: string) =>
  apiFetch<{ message: string }>(`/api/exams/${slug}/practice-questions/${questionId}/click`, { method: 'POST' });

export const getSession = (sessionId: string) => apiFetch<ApiSession>(`/api/exams/sessions/${sessionId}`);

export const getMySession = (slug: string) => apiFetch<ApiSession | null>(`/api/exams/${slug}/my-session`);

export const getAnswers = (sessionId: string) =>
  apiFetch<{ question_id: string; answer_text: string }[]>(`/api/exams/sessions/${sessionId}/answers`);

export const saveAnswers = (sessionId: string, answers: { question_id: string; answer_text: string }[]) =>
  apiFetch<{ message: string }>(`/api/exams/sessions/${sessionId}/answers`, {
    method: 'PATCH',
    body: JSON.stringify({ answers }),
  });

export const submitExamApi = (sessionId: string, answers: { question_id: string; answer_text: string }[], proctoringViolations: number) =>
  apiFetch<SubmitResponse>(`/api/exams/sessions/${sessionId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ answers, proctoring_violations: proctoringViolations }),
  });

export const leaveQueueApi = (sessionId: string) =>
  apiFetch<{ message: string }>(`/api/exams/sessions/${sessionId}/leave`, { method: 'POST' });
