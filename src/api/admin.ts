import { apiFetch } from './client';
import type { ApiExam } from './exams';

export type { ApiExam };

export interface AdminQueueStudent {
  session_id: string;
  student_name: string;
  student_email: string;
  student_code: string | null;
  status: 'waiting' | 'in_progress';
  queue_position: number;
  joined_queue_at: string | null;
  entered_exam_at: string | null;
}

export interface ExamPayload {
  title?: string;
  slug?: string;
  description?: string;
  instructions?: string;
  duration_minutes?: number;
  passing_marks?: number;
  negative_marking?: boolean;
  random_question_order?: boolean;
  random_option_order?: boolean;
  max_active_students?: number;
  queue_capacity?: number;
  programming_languages?: string[];
  browser_restrictions?: Record<string, unknown>;
  start_date?: string | null;
  end_date?: string | null;
}

export const listExams = () => apiFetch<ApiExam[]>('/api/admin/exams');

export const createExam = (payload: ExamPayload) =>
  apiFetch<ApiExam>('/api/admin/exams', { method: 'POST', body: JSON.stringify(payload) });

export const getExamDetail = (examId: string) => apiFetch<ApiExam>(`/api/admin/exams/${examId}`);

export const updateExam = (examId: string, payload: Partial<ExamPayload>) =>
  apiFetch<ApiExam>(`/api/admin/exams/${examId}`, { method: 'PATCH', body: JSON.stringify(payload) });

export const deleteExam = (examId: string) =>
  apiFetch<{ message: string }>(`/api/admin/exams/${examId}`, { method: 'DELETE' });

export const duplicateExam = (examId: string) =>
  apiFetch<ApiExam>(`/api/admin/exams/${examId}/duplicate`, { method: 'POST' });

export const publishExam = (examId: string) =>
  apiFetch<ApiExam>(`/api/admin/exams/${examId}/publish`, { method: 'POST' });

export const unpublishExam = (examId: string) =>
  apiFetch<ApiExam>(`/api/admin/exams/${examId}/unpublish`, { method: 'POST' });

export const archiveExam = (examId: string) =>
  apiFetch<ApiExam>(`/api/admin/exams/${examId}/archive`, { method: 'POST' });

export const assignExamQuestions = (examId: string, questionIds: string[]) =>
  apiFetch<ApiExam>(`/api/admin/exams/${examId}/questions`, {
    method: 'PUT',
    body: JSON.stringify({ question_ids: questionIds }),
  });

export const getAdminQueue = (examId: string) => apiFetch<AdminQueueStudent[]>(`/api/admin/exams/${examId}/queue`);

export const updateCapacity = (examId: string, maxActiveStudents: number) =>
  apiFetch<ApiExam>(`/api/admin/exams/${examId}/capacity`, {
    method: 'PATCH',
    body: JSON.stringify({ max_active_students: maxActiveStudents }),
  });

export const forceAdmitApi = (sessionId: string) =>
  apiFetch<{ message: string }>(`/api/admin/exam-sessions/${sessionId}/force-admit`, { method: 'POST' });

export const forceExitApi = (sessionId: string) =>
  apiFetch<{ message: string }>(`/api/admin/exam-sessions/${sessionId}/force-exit`, { method: 'POST' });
