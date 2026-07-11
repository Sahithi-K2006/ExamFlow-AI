from collections import defaultdict

from fastapi import WebSocket


class ConnectionManager:
    """In-process WebSocket fan-out. Single uvicorn worker is assumed for this deployment,
    so a direct broadcast (no Redis pub/sub bridge) is sufficient and keeps things simple."""

    def __init__(self):
        self.student_sockets: dict[str, list[WebSocket]] = defaultdict(list)
        self.admin_sockets: dict[str, list[WebSocket]] = defaultdict(list)

    async def connect_student(self, session_id: str, ws: WebSocket):
        await ws.accept()
        self.student_sockets[session_id].append(ws)

    def disconnect_student(self, session_id: str, ws: WebSocket):
        if ws in self.student_sockets.get(session_id, []):
            self.student_sockets[session_id].remove(ws)

    async def connect_admin(self, exam_id: str, ws: WebSocket):
        await ws.accept()
        self.admin_sockets[exam_id].append(ws)

    def disconnect_admin(self, exam_id: str, ws: WebSocket):
        if ws in self.admin_sockets.get(exam_id, []):
            self.admin_sockets[exam_id].remove(ws)

    async def send_to_session(self, session_id: str, payload: dict):
        dead = []
        for ws in self.student_sockets.get(session_id, []):
            try:
                await ws.send_json(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect_student(session_id, ws)

    async def broadcast_admin(self, exam_id: str, payload: dict):
        dead = []
        for ws in self.admin_sockets.get(exam_id, []):
            try:
                await ws.send_json(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect_admin(exam_id, ws)


manager = ConnectionManager()
