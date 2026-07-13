from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.auth import get_current_student
from app.main import app
from app.models import User, UserRole
from app.services import ai_service


def _fake_student() -> User:
    return User(
        id="test-student-id",
        role=UserRole.student,
        name="Test Student",
        email="student@example.com",
        password_hash="unused",
    )


@pytest.fixture
def client():
    app.dependency_overrides[get_current_student] = _fake_student
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def test_chat_returns_ai_reply(client):
    with patch("app.routers.ai.get_ai_reply", return_value="Here's how the queue works.") as mock_reply:
        response = client.post("/api/ai/chat", json={"message": "How does the queue work?"})

    assert response.status_code == 200
    assert response.json() == {"reply": "Here's how the queue works."}
    mock_reply.assert_called_once()


def test_chat_uses_recent_history_on_followup(client):
    with patch("app.routers.ai.get_ai_reply", return_value="First reply."):
        client.post("/api/ai/chat", json={"message": "First question"})

    with patch("app.routers.ai.get_ai_reply", return_value="Second reply.") as mock_reply:
        client.post("/api/ai/chat", json={"message": "Second question"})

    history_arg = mock_reply.call_args[0][0]
    assert {"role": "user", "content": "First question"} in history_arg
    assert {"role": "assistant", "content": "First reply."} in history_arg


def test_chat_rejects_empty_message(client):
    response = client.post("/api/ai/chat", json={"message": ""})
    assert response.status_code == 422


def test_chat_rejects_oversized_message(client):
    response = client.post("/api/ai/chat", json={"message": "a" * 5000})
    assert response.status_code == 422


def test_chat_rejects_missing_message_field(client):
    response = client.post("/api/ai/chat", json={})
    assert response.status_code == 422


def test_chat_rejects_wrong_type(client):
    response = client.post("/api/ai/chat", json={"message": 12345})
    assert response.status_code == 422


def test_chat_requires_authentication():
    app.dependency_overrides.clear()
    with TestClient(app) as c:
        response = c.post("/api/ai/chat", json={"message": "Hello"})
    assert response.status_code == 401


def test_missing_api_key_returns_friendly_503(client, monkeypatch):
    monkeypatch.setattr(ai_service, "_client", lambda: None)
    response = client.post("/api/ai/chat", json={"message": "How does the queue work?"})
    assert response.status_code == 503
    assert "GOOGLE_API_KEY" in response.json()["detail"]


def test_error_response_never_leaks_stack_trace(client, monkeypatch):
    monkeypatch.setattr(ai_service, "_client", lambda: None)
    response = client.post("/api/ai/chat", json={"message": "How does the queue work?"})
    body = response.text
    assert "Traceback" not in body
    assert "ai_service.py" not in body


def test_flashcards_returns_generated_cards(client):
    cards = [{"front": "What is Big O?", "back": "A notation for algorithmic complexity."}]
    with patch("app.routers.ai.generate_flashcards", return_value=cards) as mock_generate:
        response = client.post("/api/ai/flashcards", json={"topic": "Big O notation"})

    assert response.status_code == 200
    assert response.json() == {"topic": "Big O notation", "flashcards": cards}
    mock_generate.assert_called_once_with("Big O notation")


def test_flashcards_rejects_empty_topic(client):
    response = client.post("/api/ai/flashcards", json={"topic": ""})
    assert response.status_code == 422


def test_flashcards_rejects_missing_topic_field(client):
    response = client.post("/api/ai/flashcards", json={})
    assert response.status_code == 422


def test_flashcards_rejects_oversized_topic(client):
    response = client.post("/api/ai/flashcards", json={"topic": "a" * 500})
    assert response.status_code == 422


def test_flashcards_requires_authentication():
    app.dependency_overrides.clear()
    with TestClient(app) as c:
        response = c.post("/api/ai/flashcards", json={"topic": "Binary Search Trees"})
    assert response.status_code == 401


def test_flashcards_missing_api_key_returns_friendly_503(client, monkeypatch):
    monkeypatch.setattr(ai_service, "_client", lambda: None)
    response = client.post("/api/ai/flashcards", json={"topic": "Binary Search Trees"})
    assert response.status_code == 503
    assert "GOOGLE_API_KEY" in response.json()["detail"]


def test_flashcards_refused_topic_returns_friendly_422(client, monkeypatch):
    monkeypatch.setattr(ai_service, "_client", lambda: object())
    monkeypatch.setattr(
        ai_service,
        "_generate",
        lambda contents, config: type("Resp", (), {"text": "[]"})(),
    )
    response = client.post("/api/ai/flashcards", json={"topic": "who won the last IPL"})
    assert response.status_code == 422
