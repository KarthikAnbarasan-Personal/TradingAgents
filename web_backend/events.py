from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Dict

from web_backend.schemas import RunEvent


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def make_event(seq: int, event_type: str, data: Dict) -> RunEvent:
    return RunEvent(seq=seq, type=event_type, timestamp=utc_now_iso(), data=data)


def to_sse(event: RunEvent) -> str:
    payload = event.model_dump(mode="json")
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"

