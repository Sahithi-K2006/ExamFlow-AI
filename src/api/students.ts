import { apiFetch } from './client';

export interface ApiStudent {
  id: string;
  name: string;
  email: string;
  student_id: string | null;
  college: string | null;
  created_at: string;
  exams_taken: number;
  avg_score: number | null;
}

export interface ApiActivityLog {
  id: string;
  student_id: string | null;
  student_name: string | null;
  user_role: 'student' | 'admin' | null;
  exam_id: string | null;
  exam_title: string | null;
  session_id: string | null;
  event_type: string;
  ip_address: string | null;
  device: string | null;
  browser: string | null;
  event_metadata: Record<string, unknown>;
  created_at: string;
}

export const listStudents = () => apiFetch<ApiStudent[]>('/api/admin/students');

export const getStudentActivity = (studentId: string) =>
  apiFetch<ApiActivityLog[]>(`/api/admin/students/${studentId}/activity`);

export const listActivityLog = (limit = 200, eventType?: string) =>
  apiFetch<ApiActivityLog[]>(
    `/api/admin/activity-log?limit=${limit}${eventType ? `&event_type=${eventType}` : ''}`
  );
