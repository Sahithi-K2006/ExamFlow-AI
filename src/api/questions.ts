import { apiFetch, API_BASE, getToken } from './client';

export type QuestionType = 'mcq' | 'multiple_correct' | 'coding' | 'sql' | 'fill_blank' | 'short_answer' | 'descriptive';

export interface AdminQuestion {
  id: string;
  type: QuestionType;
  question_text: string;
  options: string[];
  correct_answer: Record<string, unknown>;
  initial_code: string | null;
  test_cases: unknown[];
  difficulty: string;
  marks: number;
  negative_marks: number;
  subject: string | null;
  topic: string | null;
  tags: string[];
  explanation: string | null;
  image_url: string | null;
  attachments: unknown[];
  programming_language: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuestionPayload {
  type: QuestionType;
  question_text: string;
  options?: string[];
  correct_answer?: Record<string, unknown>;
  initial_code?: string | null;
  test_cases?: unknown[];
  difficulty?: string;
  marks?: number;
  negative_marks?: number;
  subject?: string | null;
  topic?: string | null;
  tags?: string[];
  explanation?: string | null;
  programming_language?: string | null;
}

export interface QuestionFilters {
  search?: string;
  type?: string;
  subject?: string;
  difficulty?: string;
}

const toQuery = (filters: QuestionFilters): string => {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.type) params.set('type', filters.type);
  if (filters.subject) params.set('subject', filters.subject);
  if (filters.difficulty) params.set('difficulty', filters.difficulty);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
};

export const listQuestions = (filters: QuestionFilters = {}) =>
  apiFetch<AdminQuestion[]>(`/api/admin/questions${toQuery(filters)}`);

export const createQuestion = (payload: QuestionPayload) =>
  apiFetch<AdminQuestion>('/api/admin/questions', { method: 'POST', body: JSON.stringify(payload) });

export const updateQuestion = (id: string, payload: Partial<QuestionPayload>) =>
  apiFetch<AdminQuestion>(`/api/admin/questions/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });

export const deleteQuestion = (id: string) =>
  apiFetch<{ message: string }>(`/api/admin/questions/${id}`, { method: 'DELETE' });

export const duplicateQuestion = (id: string) =>
  apiFetch<AdminQuestion>(`/api/admin/questions/${id}/duplicate`, { method: 'POST' });

export const uploadQuestionImage = async (id: string, file: File): Promise<AdminQuestion> => {
  const token = getToken();
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE}/api/admin/questions/${id}/image`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || 'Image upload failed');
  }
  return res.json();
};
