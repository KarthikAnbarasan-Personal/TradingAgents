from __future__ import annotations

import json
import queue
import threading
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Iterable, List, Optional
from uuid import uuid4

from web_backend.events import make_event
from web_backend.schemas import RunCreateRequest, RunEvent, RunSnapshot, RunStats


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


@dataclass
class RunRecord:
    snapshot: RunSnapshot
    event_seq: int = 0
    events: List[RunEvent] = field(default_factory=list)
    subscribers: List[queue.Queue] = field(default_factory=list)
    lock: threading.RLock = field(default_factory=threading.RLock)
    cancel_requested: bool = False


class RunManager:
    def __init__(self, runs_dir: Path) -> None:
        self.runs_dir = runs_dir
        self.runs_dir.mkdir(parents=True, exist_ok=True)
        self._lock = threading.RLock()
        self._runs: Dict[str, RunRecord] = {}
        self._load_existing_runs()

    def _load_existing_runs(self) -> None:
        for meta_path in self.runs_dir.glob("*/meta.json"):
            try:
                data = json.loads(meta_path.read_text(encoding="utf-8"))
                snapshot = RunSnapshot.model_validate(data)
                if snapshot.status in {"queued", "running", "cancel_requested"}:
                    snapshot.status = "interrupted"
                    snapshot.updated_at = _utcnow()
                    snapshot.finished_at = snapshot.finished_at or snapshot.updated_at
                    meta_path.write_text(
                        json.dumps(snapshot.model_dump(mode="json"), indent=2),
                        encoding="utf-8",
                    )
                self._runs[snapshot.run_id] = RunRecord(snapshot=snapshot)
            except Exception:
                continue

    def create_run(self, request: RunCreateRequest) -> RunSnapshot:
        run_id = uuid4().hex
        now = _utcnow()
        snapshot = RunSnapshot(
            run_id=run_id,
            status="queued",
            created_at=now,
            updated_at=now,
            request=request,
            artifact_dir=str((self.runs_dir / run_id).resolve()),
        )
        with self._lock:
            self._runs[run_id] = RunRecord(snapshot=snapshot)
        self._persist_snapshot(snapshot)
        return snapshot

    def get_run(self, run_id: str) -> Optional[RunSnapshot]:
        with self._lock:
            record = self._runs.get(run_id)
            if not record:
                return None
            return record.snapshot.model_copy(deep=True)

    def list_runs(self) -> List[RunSnapshot]:
        with self._lock:
            runs = [record.snapshot.model_copy(deep=True) for record in self._runs.values()]
        runs.sort(key=lambda s: s.created_at, reverse=True)
        return runs

    def update_snapshot(self, run_id: str, **kwargs) -> Optional[RunSnapshot]:
        with self._lock:
            record = self._runs.get(run_id)
            if not record:
                return None
            for key, value in kwargs.items():
                setattr(record.snapshot, key, value)
            record.snapshot.updated_at = _utcnow()
            snapshot = record.snapshot.model_copy(deep=True)
        self._persist_snapshot(snapshot)
        return snapshot

    def set_status(self, run_id: str, status: str, error: Optional[str] = None) -> Optional[RunSnapshot]:
        now = _utcnow()
        kwargs = {"status": status, "updated_at": now}
        if status == "running":
            kwargs["started_at"] = now
        if status in {"completed", "failed", "cancelled", "interrupted"}:
            kwargs["finished_at"] = now
        if error:
            kwargs["error"] = error
        return self.update_snapshot(run_id, **kwargs)

    def update_stats(self, run_id: str, stats: Dict[str, int]) -> Optional[RunSnapshot]:
        snapshot = self.get_run(run_id)
        if snapshot is None:
            return None
        snapshot.stats = RunStats(**stats)
        return self.update_snapshot(run_id, stats=snapshot.stats)

    def request_cancel(self, run_id: str) -> bool:
        with self._lock:
            record = self._runs.get(run_id)
            if not record:
                return False
            record.cancel_requested = True
        self.set_status(run_id, "cancel_requested")
        return True

    def is_cancel_requested(self, run_id: str) -> bool:
        with self._lock:
            record = self._runs.get(run_id)
            return bool(record and record.cancel_requested)

    def append_event(self, run_id: str, event_type: str, data: Dict) -> Optional[RunEvent]:
        with self._lock:
            record = self._runs.get(run_id)
            if not record:
                return None
            record.event_seq += 1
            event = make_event(record.event_seq, event_type, data)
            record.events.append(event)
            for subscriber in list(record.subscribers):
                subscriber.put(event)
            snapshot = record.snapshot.model_copy(deep=True)
        self._append_event_file(snapshot.run_id, event)
        return event

    def subscribe(self, run_id: str) -> Optional[queue.Queue]:
        with self._lock:
            record = self._runs.get(run_id)
            if not record:
                return None
            q: queue.Queue = queue.Queue()
            record.subscribers.append(q)
            return q

    def unsubscribe(self, run_id: str, subscriber: queue.Queue) -> None:
        with self._lock:
            record = self._runs.get(run_id)
            if not record:
                return
            if subscriber in record.subscribers:
                record.subscribers.remove(subscriber)

    def get_events_since(self, run_id: str, last_seq: int = 0) -> List[RunEvent]:
        with self._lock:
            record = self._runs.get(run_id)
            if not record:
                return []
            return [event for event in record.events if event.seq > last_seq]

    def _persist_snapshot(self, snapshot: RunSnapshot) -> None:
        run_dir = self.runs_dir / snapshot.run_id
        run_dir.mkdir(parents=True, exist_ok=True)
        meta_path = run_dir / "meta.json"
        meta_path.write_text(
            json.dumps(snapshot.model_dump(mode="json"), indent=2),
            encoding="utf-8",
        )

    def _append_event_file(self, run_id: str, event: RunEvent) -> None:
        run_dir = self.runs_dir / run_id
        run_dir.mkdir(parents=True, exist_ok=True)
        event_path = run_dir / "events.jsonl"
        with event_path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(event.model_dump(mode="json"), ensure_ascii=False) + "\n")

