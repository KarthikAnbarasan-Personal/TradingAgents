from fastapi.testclient import TestClient

import web_backend.app as backend_app
from web_backend.run_manager import RunManager


def test_create_list_cancel_run(tmp_path, monkeypatch):
    local_manager = RunManager(tmp_path / "runs")
    monkeypatch.setattr(backend_app, "run_manager", local_manager)
    monkeypatch.setattr(backend_app, "start_run_thread", lambda manager, run_id: None)

    client = TestClient(backend_app.app)

    payload = {
        "ticker": "MSFT",
        "analysis_date": "2026-05-01",
        "analysts": ["market", "news"],
        "llm_provider": "openai",
        "research_depth": 1,
        "output_language": "English",
        "checkpoint_enabled": False,
    }
    created = client.post("/api/runs", json=payload)
    assert created.status_code == 200
    run_id = created.json()["run_id"]

    listed = client.get("/api/runs")
    assert listed.status_code == 200
    assert any(item["run_id"] == run_id for item in listed.json())

    cancelled = client.post(f"/api/runs/{run_id}/cancel")
    assert cancelled.status_code == 200
    assert cancelled.json()["status"] == "cancel_requested"

    fetched = client.get(f"/api/runs/{run_id}")
    assert fetched.status_code == 200
    assert fetched.json()["status"] == "cancel_requested"


def test_export_report_pdf():
    client = TestClient(backend_app.app)
    res = client.post(
        "/api/export-report-pdf",
        json={"markdown": "# Hello\n\n**Bold** text.", "title": "Unit test", "filename_stem": "ut_export"},
    )
    assert res.status_code == 200
    assert "application/pdf" in res.headers.get("content-type", "")
    assert res.content[:4] == b"%PDF"

