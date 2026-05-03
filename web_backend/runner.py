from __future__ import annotations

import json
import threading
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from cli.stats_handler import StatsCallbackHandler
from tradingagents.default_config import DEFAULT_CONFIG
from tradingagents.graph.trading_graph import TradingAgentsGraph

from web_backend.run_manager import RunManager
from web_backend.schemas import RunCreateRequest
from tradingagents.agents.registry import ANALYST_KEY_TO_ID, ANALYST_ORDER, display_name, report_heading

from web_backend.state import WorkflowState, classify_message_type, update_analyst_statuses


def _copy_jsonable(value: Any) -> Any:
    return json.loads(json.dumps(value, default=str))


def _build_config(request: RunCreateRequest) -> Dict[str, Any]:
    config = DEFAULT_CONFIG.copy()
    config["max_debate_rounds"] = request.research_depth
    config["max_risk_discuss_rounds"] = request.research_depth
    if request.quick_model:
        config["quick_think_llm"] = request.quick_model
    if request.deep_model:
        config["deep_think_llm"] = request.deep_model
    config["backend_url"] = request.backend_url
    config["llm_provider"] = request.llm_provider.lower()
    config["output_language"] = request.output_language
    config["checkpoint_enabled"] = request.checkpoint_enabled
    return config


def _save_report_to_disk(final_state: Dict[str, Any], ticker: str, save_path: Path) -> Path:
    save_path.mkdir(parents=True, exist_ok=True)
    sections: List[str] = []

    analysts_dir = save_path / "1_analysts"
    analyst_parts = []
    if final_state.get("market_report"):
        analysts_dir.mkdir(exist_ok=True)
        (analysts_dir / "market.md").write_text(final_state["market_report"], encoding="utf-8")
        analyst_parts.append((display_name("arin"), final_state["market_report"]))
    if final_state.get("sentiment_report"):
        analysts_dir.mkdir(exist_ok=True)
        (analysts_dir / "sentiment.md").write_text(final_state["sentiment_report"], encoding="utf-8")
        analyst_parts.append((display_name("mira"), final_state["sentiment_report"]))
    if final_state.get("news_report"):
        analysts_dir.mkdir(exist_ok=True)
        (analysts_dir / "news.md").write_text(final_state["news_report"], encoding="utf-8")
        analyst_parts.append((display_name("rama"), final_state["news_report"]))
    if final_state.get("fundamentals_report"):
        analysts_dir.mkdir(exist_ok=True)
        (analysts_dir / "fundamentals.md").write_text(final_state["fundamentals_report"], encoding="utf-8")
        analyst_parts.append((display_name("neel"), final_state["fundamentals_report"]))
    if analyst_parts:
        content = "\n\n".join(f"### {name}\n{text}" for name, text in analyst_parts)
        sections.append(f"## I. Analyst Team Reports\n\n{content}")

    if final_state.get("investment_debate_state"):
        research_dir = save_path / "2_research"
        debate = final_state["investment_debate_state"]
        research_parts = []
        if debate.get("bull_history"):
            research_dir.mkdir(exist_ok=True)
            (research_dir / "bull.md").write_text(debate["bull_history"], encoding="utf-8")
            research_parts.append((display_name("ayan"), debate["bull_history"]))
        if debate.get("bear_history"):
            research_dir.mkdir(exist_ok=True)
            (research_dir / "bear.md").write_text(debate["bear_history"], encoding="utf-8")
            research_parts.append((display_name("kiran"), debate["bear_history"]))
        if debate.get("judge_decision"):
            research_dir.mkdir(exist_ok=True)
            (research_dir / "manager.md").write_text(debate["judge_decision"], encoding="utf-8")
            research_parts.append((display_name("tara"), debate["judge_decision"]))
        if research_parts:
            content = "\n\n".join(f"### {name}\n{text}" for name, text in research_parts)
            sections.append(f"## II. Research Team Decision\n\n{content}")

    if final_state.get("trader_investment_plan"):
        trading_dir = save_path / "3_trading"
        trading_dir.mkdir(exist_ok=True)
        (trading_dir / "trader.md").write_text(final_state["trader_investment_plan"], encoding="utf-8")
        sections.append(
            f"## III. Trading Team Plan\n\n### {report_heading('zian')}\n{final_state['trader_investment_plan']}"
        )

    if final_state.get("risk_debate_state"):
        risk_dir = save_path / "4_risk"
        risk = final_state["risk_debate_state"]
        risk_parts = []
        if risk.get("aggressive_history"):
            risk_dir.mkdir(exist_ok=True)
            (risk_dir / "aggressive.md").write_text(risk["aggressive_history"], encoding="utf-8")
            risk_parts.append((display_name("veer"), risk["aggressive_history"]))
        if risk.get("conservative_history"):
            risk_dir.mkdir(exist_ok=True)
            (risk_dir / "conservative.md").write_text(risk["conservative_history"], encoding="utf-8")
            risk_parts.append((display_name("shan"), risk["conservative_history"]))
        if risk.get("neutral_history"):
            risk_dir.mkdir(exist_ok=True)
            (risk_dir / "neutral.md").write_text(risk["neutral_history"], encoding="utf-8")
            risk_parts.append((display_name("rey"), risk["neutral_history"]))
        if risk_parts:
            content = "\n\n".join(f"### {name}\n{text}" for name, text in risk_parts)
            sections.append(f"## IV. Risk Management Team Decision\n\n{content}")
        if risk.get("judge_decision"):
            portfolio_dir = save_path / "5_portfolio"
            portfolio_dir.mkdir(exist_ok=True)
            (portfolio_dir / "decision.md").write_text(risk["judge_decision"], encoding="utf-8")
            sections.append(
                f"## V. Portfolio Decision\n\n### {report_heading('ira')}\n{risk['judge_decision']}"
            )

    header = f"# Trading Analysis Report: {ticker}\n\nGenerated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
    complete_report = save_path / "complete_report.md"
    complete_report.write_text(header + "\n\n".join(sections), encoding="utf-8")
    return complete_report


def _update_research_team_status(state: WorkflowState, status: str) -> None:
    for agent in ("ayan", "kiran", "tara"):
        state.update_agent_status(agent, status)


def _emit_agent_status_changes(manager: RunManager, run_id: str, before: Dict[str, str], after: Dict[str, str]) -> None:
    for agent, status in after.items():
        if before.get(agent) != status:
            manager.append_event(run_id, "agent_status_changed", {"agent": agent, "status": status})


def _emit_section_changes(manager: RunManager, run_id: str, before: Dict[str, Any], after: Dict[str, Any]) -> None:
    """Emit lightweight section signals — full text lives on the run snapshot (GET /api/runs)."""
    for section, content in after.items():
        if before.get(section) != content and content:
            text = content if isinstance(content, str) else str(content)
            manager.append_event(
                run_id,
                "section_updated",
                {"section": section, "chars": len(text)},
            )


_MAX_ACTIVITY_MESSAGE_CHARS = 14_000


def _maybe_truncate_for_activity_log(content: str) -> str:
    if len(content) <= _MAX_ACTIVITY_MESSAGE_CHARS:
        return content
    return (
        content[:_MAX_ACTIVITY_MESSAGE_CHARS]
        + f"\n\n… truncated for activity log ({len(content)} chars total)"
    )


def _persist_state_snapshot(artifact_dir: Path, state: Dict[str, Any]) -> None:
    (artifact_dir / "state.json").write_text(
        json.dumps(_copy_jsonable(state), indent=2),
        encoding="utf-8",
    )


def run_analysis_job(manager: RunManager, run_id: str) -> None:
    snapshot = manager.get_run(run_id)
    if snapshot is None:
        return

    request = snapshot.request
    config = _build_config(request)
    selected_set = {a.lower() for a in request.analysts}
    selected_analyst_keys = [a for a in ANALYST_ORDER if a in selected_set]
    state = WorkflowState()
    state.init_for_analysis(selected_analyst_keys)

    artifact_dir = Path(snapshot.artifact_dir or "")
    artifact_dir.mkdir(parents=True, exist_ok=True)
    report_dir = artifact_dir / "reports"
    report_dir.mkdir(parents=True, exist_ok=True)

    manager.set_status(run_id, "running")
    manager.append_event(
        run_id,
        "run_started",
        {
            "run_id": run_id,
            "ticker": request.ticker,
            "analysis_date": request.analysis_date,
            "selected_analysts": selected_analyst_keys,
        },
    )

    stats_handler = StatsCallbackHandler()
    graph = TradingAgentsGraph(
        selected_analyst_keys,
        config=config,
        debug=True,
        callbacks=[stats_handler],
    )

    first_analyst_id = ANALYST_KEY_TO_ID[selected_analyst_keys[0]] if selected_analyst_keys else None
    if first_analyst_id and first_analyst_id in state.agent_status:
        state.update_agent_status(first_analyst_id, "in_progress")
        manager.append_event(
            run_id, "agent_status_changed", {"agent": first_analyst_id, "status": "in_progress"}
        )

    trace: List[Dict[str, Any]] = []
    failed = False
    error_message = None
    last_stats_emitted: Optional[Dict[str, int]] = None

    try:
        init_agent_state = graph.propagator.create_initial_state(request.ticker, request.analysis_date)
        args = graph.propagator.get_graph_args(callbacks=[stats_handler])

        for chunk in graph.graph.stream(init_agent_state, **args):
            if manager.is_cancel_requested(run_id):
                manager.set_status(run_id, "cancelled")
                manager.append_event(run_id, "run_cancelled", {"run_id": run_id})
                _persist_state_snapshot(artifact_dir, trace[-1] if trace else {})
                return

            before_agents = dict(state.agent_status)
            before_sections = dict(state.report_sections)

            for message in chunk.get("messages", []):
                msg_id = getattr(message, "id", None)
                if msg_id is not None:
                    if msg_id in state._processed_message_ids:
                        continue
                    state._processed_message_ids.add(msg_id)

                msg_type, content = classify_message_type(message)
                if content and content.strip():
                    manager.append_event(
                        run_id,
                        "message_added",
                        {
                            "message_type": msg_type,
                            "content": _maybe_truncate_for_activity_log(content),
                        },
                    )

                if hasattr(message, "tool_calls") and message.tool_calls:
                    for tool_call in message.tool_calls:
                        if isinstance(tool_call, dict):
                            tool_name = tool_call.get("name", "unknown")
                            tool_args = tool_call.get("args", {})
                        else:
                            tool_name = getattr(tool_call, "name", "unknown")
                            tool_args = getattr(tool_call, "args", {})
                        manager.append_event(
                            run_id,
                            "tool_called",
                            {"tool_name": tool_name, "args": tool_args},
                        )

            update_analyst_statuses(state, chunk)

            if chunk.get("investment_debate_state"):
                debate_state = chunk["investment_debate_state"]
                bull_hist = debate_state.get("bull_history", "").strip()
                bear_hist = debate_state.get("bear_history", "").strip()
                judge = debate_state.get("judge_decision", "").strip()
                if bull_hist or bear_hist:
                    _update_research_team_status(state, "in_progress")
                if bull_hist:
                    state.update_report_section(
                        "investment_plan", f"### {report_heading('ayan')} — analysis\n{bull_hist}"
                    )
                if bear_hist:
                    state.update_report_section(
                        "investment_plan", f"### {report_heading('kiran')} — analysis\n{bear_hist}"
                    )
                if judge:
                    state.update_report_section(
                        "investment_plan", f"### {report_heading('tara')} — decision\n{judge}"
                    )
                    _update_research_team_status(state, "completed")
                    state.update_agent_status("zian", "in_progress")

            if chunk.get("trader_investment_plan"):
                state.update_report_section("trader_investment_plan", chunk["trader_investment_plan"])
                if state.agent_status.get("zian") != "completed":
                    state.update_agent_status("zian", "completed")
                    state.update_agent_status("veer", "in_progress")

            if chunk.get("risk_debate_state"):
                risk_state = chunk["risk_debate_state"]
                agg_hist = risk_state.get("aggressive_history", "").strip()
                con_hist = risk_state.get("conservative_history", "").strip()
                neu_hist = risk_state.get("neutral_history", "").strip()
                judge = risk_state.get("judge_decision", "").strip()
                if agg_hist:
                    if state.agent_status.get("veer") != "completed":
                        state.update_agent_status("veer", "in_progress")
                    state.update_report_section(
                        "final_trade_decision", f"### {report_heading('veer')} — analysis\n{agg_hist}"
                    )
                if con_hist:
                    if state.agent_status.get("shan") != "completed":
                        state.update_agent_status("shan", "in_progress")
                    state.update_report_section(
                        "final_trade_decision", f"### {report_heading('shan')} — analysis\n{con_hist}"
                    )
                if neu_hist:
                    if state.agent_status.get("rey") != "completed":
                        state.update_agent_status("rey", "in_progress")
                    state.update_report_section(
                        "final_trade_decision", f"### {report_heading('rey')} — analysis\n{neu_hist}"
                    )
                if judge:
                    if state.agent_status.get("ira") != "completed":
                        state.update_agent_status("ira", "in_progress")
                        state.update_report_section(
                            "final_trade_decision", f"### {report_heading('ira')} — decision\n{judge}"
                        )
                        state.update_agent_status("veer", "completed")
                        state.update_agent_status("shan", "completed")
                        state.update_agent_status("rey", "completed")
                        state.update_agent_status("ira", "completed")

            _emit_agent_status_changes(manager, run_id, before_agents, state.agent_status)
            _emit_section_changes(manager, run_id, before_sections, state.report_sections)

            stats = stats_handler.get_stats()
            manager.update_stats(run_id, stats)
            if stats != last_stats_emitted:
                last_stats_emitted = dict(stats)
                manager.append_event(run_id, "stats_updated", stats)

            manager.update_snapshot(
                run_id,
                agent_status=dict(state.agent_status),
                report_sections=dict(state.report_sections),
            )
            trace.append(chunk)

        if not trace:
            raise RuntimeError("No graph output produced.")

        final_state = trace[-1]
        decision = graph.process_signal(final_state["final_trade_decision"]) if final_state.get("final_trade_decision") else {}
        for agent in state.agent_status:
            state.update_agent_status(agent, "completed")
        complete_report_path = _save_report_to_disk(final_state, request.ticker, report_dir)
        legacy_root = Path.cwd() / "reports"
        legacy_target = legacy_root / f"{request.ticker}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        _save_report_to_disk(final_state, request.ticker, legacy_target)
        _persist_state_snapshot(artifact_dir, final_state)

        manager.update_snapshot(
            run_id,
            status="completed",
            finished_at=datetime.utcnow(),
            final_state=_copy_jsonable(final_state),
            agent_status=dict(state.agent_status),
            report_sections=dict(state.report_sections),
            complete_report_path=str(complete_report_path.resolve()),
            report_dir=str(report_dir.resolve()),
            legacy_report_dir=str(legacy_target.resolve()),
        )
        manager.append_event(
            run_id,
            "run_completed",
            {
                "run_id": run_id,
                "decision": _copy_jsonable(decision),
                "complete_report_path": str(complete_report_path.resolve()),
            },
        )
    except Exception as exc:
        failed = True
        error_message = str(exc)
    finally:
        if failed:
            manager.set_status(run_id, "failed", error=error_message)
            manager.append_event(run_id, "run_failed", {"run_id": run_id, "error": error_message})


def start_run_thread(manager: RunManager, run_id: str) -> threading.Thread:
    thread = threading.Thread(target=run_analysis_job, args=(manager, run_id), daemon=True)
    thread.start()
    return thread

