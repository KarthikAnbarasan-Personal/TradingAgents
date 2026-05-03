from __future__ import annotations

import json
import queue
import shutil
from datetime import datetime
from pathlib import Path
from typing import Iterator

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse

from web_backend.events import to_sse
from web_backend.options import build_frontend_options
from web_backend.run_manager import RunManager
from web_backend.runner import start_run_thread
from web_backend.schemas import RunCreateRequest, RunEvent


load_dotenv()
load_dotenv(".env.enterprise", override=False)

app = FastAPI(title="TradingAgents Local API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

RUNS_DIR = Path.cwd() / "runs"
run_manager = RunManager(RUNS_DIR)


@app.get("/api/health")
def health() -> dict:
    return {"ok": True}


@app.get("/api/options")
def get_options() -> dict:
    return build_frontend_options()


@app.post("/api/runs")
def create_run(request: RunCreateRequest) -> dict:
    snapshot = run_manager.create_run(request)
    start_run_thread(run_manager, snapshot.run_id)
    return {"run_id": snapshot.run_id, "status": snapshot.status}


@app.get("/api/runs")
def list_runs() -> list:
    return [item.model_dump(mode="json") for item in run_manager.list_runs()]


@app.get("/api/runs/{run_id}")
def get_run(run_id: str) -> dict:
    snapshot = run_manager.get_run(run_id)
    if snapshot is None:
        raise HTTPException(status_code=404, detail="Run not found")
    return snapshot.model_dump(mode="json")


@app.post("/api/runs/{run_id}/save-report")
def save_run_report_copy(run_id: str) -> dict:
    """Copy this run's report bundle into the workspace `reports/` folder (for history / sharing)."""
    snapshot = run_manager.get_run(run_id)
    if snapshot is None:
        raise HTTPException(status_code=404, detail="Run not found")
    if not snapshot.complete_report_path or not snapshot.report_dir:
        raise HTTPException(status_code=400, detail="Report is not ready yet")
    report_dir = Path(snapshot.report_dir)
    if not report_dir.is_dir():
        raise HTTPException(status_code=404, detail="Report directory missing")
    complete = report_dir / "complete_report.md"
    if not complete.is_file():
        raise HTTPException(status_code=404, detail="Report export is incomplete")

    reports_root = Path.cwd() / "reports"
    reports_root.mkdir(parents=True, exist_ok=True)
    safe_ticker = snapshot.request.ticker.replace("/", "_").replace("\\", "_")
    dest_name = f"{safe_ticker}_{datetime.now().strftime('%Y%m%d_%H%M%S')}_saved"
    dest = reports_root / dest_name
    shutil.copytree(report_dir, dest)
    return {"report_id": dest_name, "path": str(dest.resolve())}


@app.post("/api/runs/{run_id}/cancel")
def cancel_run(run_id: str) -> dict:
    ok = run_manager.request_cancel(run_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Run not found")
    run_manager.append_event(run_id, "run_cancel_requested", {"run_id": run_id})
    return {"run_id": run_id, "status": "cancel_requested"}


@app.get("/api/runs/{run_id}/events")
def stream_events(run_id: str, last_seq: int = Query(0, ge=0)) -> StreamingResponse:
    snapshot = run_manager.get_run(run_id)
    if snapshot is None:
        raise HTTPException(status_code=404, detail="Run not found")

    def event_generator() -> Iterator[str]:
        subscriber = run_manager.subscribe(run_id)
        if subscriber is None:
            return
        try:
            backlog = run_manager.get_events_since(run_id, last_seq=last_seq)
            for event in backlog:
                yield to_sse(event)

            while True:
                current = run_manager.get_run(run_id)
                if current is None:
                    break
                if current.status in {"completed", "failed", "cancelled", "interrupted"} and subscriber.empty():
                    break
                try:
                    event = subscriber.get(timeout=2.0)
                    yield to_sse(event)
                except queue.Empty:
                    yield ": heartbeat\n\n"
        finally:
            run_manager.unsubscribe(run_id, subscriber)

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.get("/api/runs/{run_id}/events/all")
def get_all_persisted_events(run_id: str) -> list:
    """Return all events from `runs/{run_id}/events.jsonl` for replay / trading floor."""
    if run_manager.get_run(run_id) is None:
        raise HTTPException(status_code=404, detail="Run not found")
    event_path = RUNS_DIR / run_id / "events.jsonl"
    if not event_path.is_file():
        return []
    out: list[dict] = []
    for line in event_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            data = json.loads(line)
            out.append(RunEvent.model_validate(data).model_dump(mode="json"))
        except Exception:
            continue
    return out


@app.get("/api/runs/{run_id}/report")
def get_report(run_id: str) -> JSONResponse:
    snapshot = run_manager.get_run(run_id)
    if snapshot is None:
        raise HTTPException(status_code=404, detail="Run not found")
    if not snapshot.complete_report_path:
        raise HTTPException(status_code=404, detail="Report not available yet")

    report_path = Path(snapshot.complete_report_path)
    if not report_path.exists():
        raise HTTPException(status_code=404, detail="Report file not found")

    report_sections = {}
    report_dir = Path(snapshot.report_dir) if snapshot.report_dir else None
    if report_dir and report_dir.exists():
        for section_file in report_dir.rglob("*.md"):
            report_sections[str(section_file.relative_to(report_dir))] = section_file.read_text(
                encoding="utf-8"
            )

    payload = {
        "run_id": run_id,
        "complete_report_markdown": report_path.read_text(encoding="utf-8"),
        "complete_report_path": str(report_path.resolve()),
        "sections": report_sections,
        "title": report_path.parent.parent.name,
    }
    return JSONResponse(content=json.loads(json.dumps(payload, ensure_ascii=False)))


@app.get("/api/runs/{run_id}/report/download")
def download_complete_report(run_id: str) -> FileResponse:
    snapshot = run_manager.get_run(run_id)
    if snapshot is None or not snapshot.complete_report_path:
        raise HTTPException(status_code=404, detail="Report not available yet")
    report_path = Path(snapshot.complete_report_path)
    if not report_path.exists():
        raise HTTPException(status_code=404, detail="Report file not found")
    return FileResponse(
        path=report_path,
        media_type="text/markdown",
        filename=f"{run_id}_complete_report.md",
    )


@app.get("/api/runs/{run_id}/report/section")
def download_report_section(run_id: str, file: str = Query(...)) -> FileResponse:
    snapshot = run_manager.get_run(run_id)
    if snapshot is None or not snapshot.report_dir:
        raise HTTPException(status_code=404, detail="Report sections not available")
    report_dir = Path(snapshot.report_dir).resolve()
    target = (report_dir / file).resolve()
    if not str(target).startswith(str(report_dir)):
        raise HTTPException(status_code=400, detail="Invalid section path")
    if not target.exists() or not target.is_file():
        raise HTTPException(status_code=404, detail="Section file not found")
    return FileResponse(path=target, media_type="text/markdown", filename=target.name)


def _read_report_bundle(report_root: Path) -> dict:
    complete_path = report_root / "complete_report.md"
    if not complete_path.exists():
        raise FileNotFoundError("complete_report.md not found")

    sections = {}
    for section_file in report_root.rglob("*.md"):
        rel = section_file.relative_to(report_root)
        if rel.as_posix() == "complete_report.md":
            continue
        sections[rel.as_posix()] = section_file.read_text(encoding="utf-8")

    return {
        "title": report_root.name,
        "complete_report_markdown": complete_path.read_text(encoding="utf-8"),
        "complete_report_path": str(complete_path.resolve()),
        "sections": sections,
    }


@app.get("/api/reports")
def list_saved_reports() -> list:
    reports_root = Path.cwd() / "reports"
    if not reports_root.exists():
        return []
    items = []
    for report_dir in reports_root.iterdir():
        if not report_dir.is_dir():
            continue
        complete = report_dir / "complete_report.md"
        if not complete.exists():
            continue
        stat = complete.stat()
        items.append(
            {
                "report_id": report_dir.name,
                "title": report_dir.name,
                "path": str(report_dir.resolve()),
                "updated_at": stat.st_mtime,
            }
        )
    items.sort(key=lambda item: item["updated_at"], reverse=True)
    return items


@app.get("/api/reports/{report_id}")
def get_saved_report(report_id: str) -> JSONResponse:
    reports_root = (Path.cwd() / "reports").resolve()
    target = (reports_root / report_id).resolve()
    if not str(target).startswith(str(reports_root)):
        raise HTTPException(status_code=400, detail="Invalid report id")
    if not target.exists() or not target.is_dir():
        raise HTTPException(status_code=404, detail="Saved report not found")
    try:
        payload = _read_report_bundle(target)
        payload["run_id"] = report_id
        return JSONResponse(content=json.loads(json.dumps(payload, ensure_ascii=False)))
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Saved report is incomplete")

