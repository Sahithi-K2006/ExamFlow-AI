import { apiFetch } from './client';

export interface AIChatResponse {
  reply: string;
}

export const sendChatMessage = (message: string) =>
  apiFetch<AIChatResponse>('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
