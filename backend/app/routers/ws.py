from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.auth import decode_token
from app.database import SessionLocal
from app.exam_service import build_admin_snapshot
from app.models import ExamSession, UserRole
from app.websocket_manager import manager

router = APIRouter()


@router.websocket("/ws/student/{session_id}")
async def student_ws(websocket: WebSocket, session_id: str, token: str = Query(...)):
    try:
        payload = decode_token(token)
    except Exception:
        await websocket.close(code=4401)
        return

    db: Session = SessionLocal()
    try:
        exam_session = db.get(ExamSession, session_id)
        if not exam_session or exam_session.student_id != payload.get("sub"):
            await websocket.close(code=4403)
            return
    finally:
        db.close()

    await manager.connect_student(session_id, websocket)
    try:
        while True:
            await websocket.receive_text()  # client doesn't need to send anything; keep the socket open
    except WebSocketDisconnect:
        manager.disconnect_student(session_id, websocket)


@router.websocket("/ws/admin/{exam_id}")
async def admin_ws(websocket: WebSocket, exam_id: str, token: str = Query(...)):
    try:
        payload = decode_token(token)
    except Exception:
        await websocket.close(code=4401)
        return

    if payload.get("role") != UserRole.admin.value:
        await websocket.close(code=4403)
        return

    await manager.connect_admin(exam_id, websocket)

    db: Session = SessionLocal()
    try:
        snapshot = await build_admin_snapshot(db, exam_id)
        await websocket.send_json({"type": "snapshot", **snapshot})
    finally:
        db.close()

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_admin(exam_id, websocket)
