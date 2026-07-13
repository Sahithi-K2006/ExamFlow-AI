import { apiFetch } from './client';

export interface AIChatResponse {
  reply: string;
}

export const sendChatMessage = (message: string) =>
  apiFetch<AIChatResponse>('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });

export interface Flashcard {
  front: string;
  back: string;
}

export interface FlashcardsResponse {
  topic: string;
  flashcards: Flashcard[];
}

export const generateFlashcards = (topic: string) =>
  apiFetch<FlashcardsResponse>('/api/ai/flashcards', {
    method: 'POST',
    body: JSON.stringify({ topic }),
  });
