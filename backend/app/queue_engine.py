import time

from app.redis_client import redis_client

# Redis-backed FIFO queue per exam.
#   queue:{exam_id}   sorted set, member=session_id, score=join timestamp -> strict FIFO order
#   active:{exam_id}  set of session_ids currently occupying an exam slot


def _queue_key(exam_id: str) -> str:
    return f"queue:{exam_id}"


def _active_key(exam_id: str) -> str:
    return f"active:{exam_id}"


async def get_active_count(exam_id: str) -> int:
    return await redis_client.scard(_active_key(exam_id))


async def get_queue_length(exam_id: str) -> int:
    return await redis_client.zcard(_queue_key(exam_id))


async def get_queue_position(exam_id: str, session_id: str) -> int:
    """1-indexed position, or 0 if not waiting."""
    rank = await redis_client.zrank(_queue_key(exam_id), session_id)
    return rank + 1 if rank is not None else 0


async def is_active(exam_id: str, session_id: str) -> bool:
    return bool(await redis_client.sismember(_active_key(exam_id), session_id))


async def admit_immediately(exam_id: str, session_id: str) -> None:
    """Unconditional admit, no capacity check — used only for the deliberate admin
    force-admit override (admin.py::force_admit), which is allowed to exceed capacity."""
    await redis_client.sadd(_active_key(exam_id), session_id)


# Both scripts run the capacity check and the mutation as a single atomic Redis operation,
# so concurrent callers can never both observe "capacity available" and both get admitted —
# closing the check-then-act race that existed here before (SCARD, then a separate SADD/ZPOPMIN).
_TRY_ADMIT_IMMEDIATE_SCRIPT = """
local active_count = redis.call('SCARD', KEYS[1])
if active_count >= tonumber(ARGV[1]) then
    return 0
end
redis.call('SADD', KEYS[1], ARGV[2])
return 1
"""

_TRY_ADMIT_NEXT_SCRIPT = """
local active_count = redis.call('SCARD', KEYS[1])
if active_count >= tonumber(ARGV[1]) then
    return false
end
local popped = redis.call('ZPOPMIN', KEYS[2], 1)
if #popped == 0 then
    return false
end
local session_id = popped[1]
redis.call('SADD', KEYS[1], session_id)
return session_id
"""


async def try_admit_immediately(exam_id: str, session_id: str, max_active: int) -> bool:
    """Atomic capacity-checked admit for a session arriving fresh (exams.py::start_exam).
    Returns True if admitted, False if the exam was already at capacity (caller should
    queue the session instead)."""
    result = await redis_client.eval(_TRY_ADMIT_IMMEDIATE_SCRIPT, 1, _active_key(exam_id), max_active, session_id)
    return bool(result)


async def join_queue(exam_id: str, session_id: str) -> None:
    await redis_client.zadd(_queue_key(exam_id), {session_id: time.time()})


async def leave_queue(exam_id: str, session_id: str) -> None:
    await redis_client.zrem(_queue_key(exam_id), session_id)


async def release_slot(exam_id: str, session_id: str) -> None:
    await redis_client.srem(_active_key(exam_id), session_id)


async def try_admit_next(exam_id: str, max_active: int) -> str | None:
    """If a slot is free, atomically pop the earliest-waiting session and mark it active.
    Returns its session_id, or None if at capacity or the queue is empty."""
    result = await redis_client.eval(_TRY_ADMIT_NEXT_SCRIPT, 2, _active_key(exam_id), _queue_key(exam_id), max_active)
    return result if result else None


async def get_waiting_session_ids(exam_id: str) -> list[str]:
    return await redis_client.zrange(_queue_key(exam_id), 0, -1)


async def get_active_session_ids(exam_id: str) -> list[str]:
    return list(await redis_client.smembers(_active_key(exam_id)))
