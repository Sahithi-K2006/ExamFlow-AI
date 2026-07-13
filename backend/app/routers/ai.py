from collections import defaultdict, deque

from fastapi import APIRouter, Depends

from app.auth import get_current_student
from app.models import User
from app.schemas import AIChatRequest, AIChatResponse, FlashcardsResponse, FlashcardTopicRequest, MessageResponse
from app.services.ai_service import MAX_HISTORY_MESSAGES, generate_flashcards, get_ai_reply

router = APIRouter(prefix="/api/ai", tags=["ai"])

# In-memory per-student conversation history (spec: "no database required"). Cleared on process
# restart or redeploy — acceptable, since reloading the lounge just starts a fresh conversation.
_history: dict[str, deque[dict[str, str]]] = defaultdict(lambda: deque(maxlen=MAX_HISTORY_MESSAGES))


@router.post("/chat", response_model=AIChatResponse)
def chat(payload: AIChatRequest, user: User = Depends(get_current_student)) -> AIChatResponse:
    history = list(_history[user.id])
    reply = get_ai_reply(history, payload.message)

    conversation = _history[user.id]
    conversation.append({"role": "user", "content": payload.message})
    conversation.append({"role": "assistant", "content": reply})

    return AIChatResponse(reply=reply)


@router.post("/chat/reset", response_model=MessageResponse)
def reset_chat(user: User = Depends(get_current_student)) -> dict[str, str]:
    _history.pop(user.id, None)
    return {"message": "Conversation reset"}


@router.post("/flashcards", response_model=FlashcardsResponse)
def flashcards(payload: FlashcardTopicRequest, user: User = Depends(get_current_student)) -> FlashcardsResponse:
    cards = generate_flashcards(payload.topic)
    return FlashcardsResponse(topic=payload.topic, flashcards=cards)
