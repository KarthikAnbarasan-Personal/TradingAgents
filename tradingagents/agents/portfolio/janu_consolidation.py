"""On-demand Janu: synthesise an existing report into highlights and next actions.

Not part of the LangGraph workflow; invoked via API with report markdown only.
"""

from __future__ import annotations

from typing import Any, Dict, List, Mapping, Optional

from langchain_core.messages import HumanMessage, SystemMessage

from tradingagents.dataflows.config import set_config
from tradingagents.default_config import DEFAULT_CONFIG
from tradingagents.llm_clients import create_llm_client

from tradingagents.agents.utils.agent_utils import build_instrument_context, get_language_instruction

MAX_CORPUS_CHARS = 120_000

JANU_SYSTEM = """You are Janu (Portfolio Analyst), a synthesis specialist on the portfolio wing.

You receive an already-completed trading research report. Your job is to CONSOLIDATE and ADVISE — not to fetch new data or contradict the workflow's factual claims.

Rules:
- Ground every bullet in themes or claims that appear in the report; do not invent figures, dates, or catalysts not stated there.
- If the report is thin or contradictory, say so explicitly.
- Use clear markdown with the exact section headings requested in the user message.
- Be concise: busy portfolio readers want skimmable output."""


def _provider_extras(config: Mapping[str, Any]) -> Dict[str, Any]:
    kwargs: Dict[str, Any] = {}
    provider = str(config.get("llm_provider", "")).lower()
    if provider == "google":
        tl = config.get("google_thinking_level")
        if tl:
            kwargs["thinking_level"] = tl
    elif provider == "openai":
        reff = config.get("openai_reasoning_effort")
        if reff:
            kwargs["reasoning_effort"] = reff
    elif provider == "anthropic":
        effort = config.get("anthropic_effort")
        if effort:
            kwargs["effort"] = effort
    return kwargs


def _build_corpus(
    sections: Mapping[str, str],
    complete_report_markdown: Optional[str],
) -> str:
    if complete_report_markdown and complete_report_markdown.strip():
        text = complete_report_markdown.strip()
    else:
        parts: List[str] = []
        paths = sorted(sections.keys(), key=lambda p: str(p).replace("\\", "/"))
        for path in paths:
            norm = str(path).replace("\\", "/")
            if "janu_consolidation" in norm.lower():
                continue
            parts.append(f"## Source file: `{norm}`\n\n{sections[path]}")
        text = "\n\n---\n\n".join(parts) if parts else ""
    if len(text) > MAX_CORPUS_CHARS:
        text = (
            text[:MAX_CORPUS_CHARS]
            + "\n\n[… corpus truncated for model context; prioritise sections already shown …]\n"
        )
    return text


def _content_to_str(content: Any) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        chunks: List[str] = []
        for block in content:
            if isinstance(block, dict) and block.get("type") == "text":
                chunks.append(str(block.get("text", "")))
            elif isinstance(block, str):
                chunks.append(block)
        return "".join(chunks).strip()
    return str(content or "").strip()


def run_janu_consolidation(
    *,
    config: Mapping[str, Any],
    ticker: str,
    sections: Mapping[str, str],
    complete_report_markdown: Optional[str] = None,
    callbacks: Optional[List[Any]] = None,
) -> str:
    """Run a single deep-LLM pass; returns markdown for storage and display."""
    cfg = {**DEFAULT_CONFIG, **dict(config)}
    set_config(cfg)

    corpus = _build_corpus(sections, complete_report_markdown)
    if not corpus.strip():
        return "### Janu (Portfolio Analyst)\n\n_Report corpus was empty; nothing to consolidate._\n"

    extras = _provider_extras(cfg)
    llm_kwargs: Dict[str, Any] = {**extras}
    if callbacks:
        llm_kwargs["callbacks"] = callbacks

    deep_client = create_llm_client(
        provider=cfg["llm_provider"],
        model=cfg["deep_think_llm"],
        base_url=cfg.get("backend_url"),
        **llm_kwargs,
    )
    llm = deep_client.get_llm()

    user = f"""{build_instrument_context(ticker)}

Below is the full report corpus to consolidate.

---

# Report corpus

{corpus}

---

Produce markdown with **exactly** these top-level sections (use `##` for each):

## Executive highlights
- 5–8 bullets: the most decision-relevant takeaways (mix of opportunity, risk, and timing if present).

## Core thesis (one paragraph)
- Single tight paragraph stating what the report collectively implies for the instrument.

## Risks and gaps
- 3–6 bullets: key risks, uncertainties, or missing evidence called out or implied in the report.

## Next actions
- Numbered checklist of 4–8 concrete next steps (data to pull, events to watch, position sizing follow-ups, debate to resolve). Each step should be actionable in plain language.

Tone: professional, direct, suitable for a portfolio committee readout.{get_language_instruction()}"""

    messages = [
        SystemMessage(content=JANU_SYSTEM),
        HumanMessage(content=user),
    ]
    response = llm.invoke(messages)
    raw = getattr(response, "content", response)
    out = _content_to_str(raw)
    if not out:
        return "### Janu (Portfolio Analyst)\n\n_Model returned empty output._\n"
    if not out.lstrip().startswith("#"):
        return f"### Janu (Portfolio Analyst)\n\n{out}"
    return out
