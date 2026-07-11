import { API_BASE } from './client';

const WS_BASE = API_BASE.replace(/^http/, 'ws');

export type StudentWsMessage =
  | { type: 'queue_position'; position: number; total_waiting: number; estimated_wait_seconds: number }
  | { type: 'admitted'; session_id: string }
  | { type: 'exited' };

export type AdminWsMessage = {
  type: 'snapshot';
  active_count: number;
  waiting_count: number;
  completed_count: number;
};

export function openStudentSocket(sessionId: string, token: string, onMessage: (msg: StudentWsMessage) => void): WebSocket {
  const ws = new WebSocket(`${WS_BASE}/ws/student/${sessionId}?token=${encodeURIComponent(token)}`);
  ws.onmessage = (event) => {
    try {
      onMessage(JSON.parse(event.data));
    } catch {
      // ignore malformed frames
    }
  };
  return ws;
}

export function openAdminSocket(examId: string, token: string, onMessage: (msg: AdminWsMessage) => void): WebSocket {
  const ws = new WebSocket(`${WS_BASE}/ws/admin/${examId}?token=${encodeURIComponent(token)}`);
  ws.onmessage = (event) => {
    try {
      onMessage(JSON.parse(event.data));
    } catch {
      // ignore malformed frames
    }
  };
  return ws;
}
