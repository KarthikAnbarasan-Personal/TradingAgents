from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, Tuple

from cli.stats_handler import StatsCallbackHandler
from tradingagents.agents.portfolio.janu_consolidation import run_janu_consolidation
from tradingagents.default_config import DEFAULT_CONFIG

from web_backend.run_manager import RunManager
from web_backend.runner import _build_config
from web_backend.schemas import RunSnapshot, RunStats


def _append_janu_section_to_complete_report(report_root: Path, markdown: str) -> None:
    complete = report_root / "complete_report.md"
    if not complete.is_file():
        return
    existing = complete.read_text(encoding="utf-8").rstrip()
    block = (
        "\n\n## VI. Janu consolidation\n\n"
        "### Janu (Portfolio Analyst) — synthesis\n\n"
        f"{markdown.strip()}\n"
    )
    complete.write_text(existing + block, encoding="utf-8")


def _persist_janu_markdown(report_root: Path, markdown: str) -> str:
    portfolio_dir = report_root / "5_portfolio"
    portfolio_dir.mkdir(parents=True, exist_ok=True)
    rel = "5_portfolio/janu_consolidation.md"
    target = report_root / rel
    file_body = "### Janu (Portfolio Analyst) — synthesis\n\n" + markdown.strip() + "\n"
    target.write_text(file_body, encoding="utf-8")
    _append_janu_section_to_complete_report(report_root, markdown)
    return rel


def _merge_run_stats(snapshot: RunSnapshot, delta: Dict[str, int]) -> RunStats:
    s = snapshot.stats
    return RunStats(
        llm_calls=s.llm_calls + int(delta.get("llm_calls", 0)),
        tool_calls=s.tool_calls + int(delta.get("tool_calls", 0)),
        tokens_in=s.tokens_in + int(delta.get("tokens_in", 0)),
        tokens_out=s.tokens_out + int(delta.get("tokens_out", 0)),
    )


def execute_janu_for_run(
    manager: RunManager,
    run_id: str,
) -> Tuple[str, str]:
    snapshot = manager.get_run(run_id)
    if snapshot is None:
        raise FileNotFoundError("run not found")
    if not snapshot.complete_report_path or not snapshot.report_dir:
        raise ValueError("report not ready")
    report_root = Path(snapshot.report_dir)
    if not report_root.is_dir():
        raise FileNotFoundError("report directory missing")

    complete_path = Path(snapshot.complete_report_path)
    if not complete_path.is_file():
        raise FileNotFoundError("complete_report.md missing")

    sections: Dict[str, str] = {}
    for section_file in report_root.rglob("*.md"):
        rel = section_file.relative_to(report_root).as_posix()
        if rel == "complete_report.md":
            continue
        sections[rel] = section_file.read_text(encoding="utf-8")

    complete_markdown = complete_path.read_text(encoding="utf-8")
    config = _build_config(snapshot.request)

    stats_handler = StatsCallbackHandler()
    markdown = run_janu_consolidation(
        config=config,
        ticker=snapshot.request.ticker,
        sections=sections,
        complete_report_markdown=complete_markdown,
        callbacks=[stats_handler],
    )
    rel = _persist_janu_markdown(report_root, markdown)

    merged = _merge_run_stats(snapshot, stats_handler.get_stats())
    ag = dict(snapshot.agent_status)
    ag["janu"] = "completed"
    manager.update_snapshot(run_id, stats=merged, agent_status=ag)

    manager.append_event(
        run_id,
        "janu_consolidation_complete",
        {"path": rel, "chars": len(markdown)},
    )
    return markdown, rel


def execute_janu_for_saved_report(report_id: str) -> Tuple[str, str]:
    reports_root = (Path.cwd() / "reports").resolve()
    target = (reports_root / report_id).resolve()
    if not str(target).startswith(str(reports_root)):
        raise ValueError("invalid report id")
    if not target.is_dir():
        raise FileNotFoundError("saved report not found")

    complete = target / "complete_report.md"
    if not complete.is_file():
        raise FileNotFoundError("complete_report.md missing")

    sections: Dict[str, str] = {}
    for section_file in target.rglob("*.md"):
        rel = section_file.relative_to(target).as_posix()
        if rel == "complete_report.md":
            continue
        sections[rel] = section_file.read_text(encoding="utf-8")

    complete_markdown = complete.read_text(encoding="utf-8")
    ticker = report_id.split("_")[0] if report_id else "UNKNOWN"

    config: Dict[str, Any] = {**DEFAULT_CONFIG}
    markdown = run_janu_consolidation(
        config=config,
        ticker=ticker,
        sections=sections,
        complete_report_markdown=complete_markdown,
        callbacks=None,
    )
    rel = _persist_janu_markdown(target, markdown)
    return markdown, rel
