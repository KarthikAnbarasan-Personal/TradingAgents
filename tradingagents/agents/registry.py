"""Canonical agent IDs (graph nodes, API `agent_status` keys) and display metadata."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Final, List, Mapping, Tuple

__all__ = [
    "AgentSpec",
    "AGENT_SPECS",
    "AGENTS_BY_ID",
    "ALL_AGENT_IDS",
    "ANALYST_KEY_TO_ID",
    "ANALYST_ORDER",
    "FIXED_AGENT_GROUPS",
    "LEGACY_AGENT_ID",
    "REPORT_SECTION_KEYS",
    "display_name",
    "report_heading",
    "resolve_agent_id",
]


@dataclass(frozen=True)
class AgentSpec:
    id: str
    display_name: str
    meaning: str
    role_description: str


AGENT_SPECS: Tuple[AgentSpec, ...] = (
    AgentSpec(
        id="arin",
        display_name="Arin (Marketing Analyst)",
        meaning="Mountain of strength / adaptability",
        role_description="Tracks market demand and sector momentum.",
    ),
    AgentSpec(
        id="mira",
        display_name="Mira (Social Media Analyst)",
        meaning="Ocean / reflection",
        role_description="Reads sentiment, trends, and crowd psychology.",
    ),
    AgentSpec(
        id="rama",
        display_name="Rama (News Analyst)",
        meaning="Sun / illumination",
        role_description="Brings clarity from news and macro events.",
    ),
    AgentSpec(
        id="neel",
        display_name="Neel (Fundamentals Analyst)",
        meaning="Blue / depth",
        role_description="Deep-dive into fundamentals and intrinsic value.",
    ),
    AgentSpec(
        id="ayan",
        display_name="Ayan (Bull Analyst)",
        meaning="Path / forward movement",
        role_description="Identifies growth and upside potential.",
    ),
    AgentSpec(
        id="kiran",
        display_name="Kiran (Bear Analyst)",
        meaning="Ray of light (sharp, piercing insight)",
        role_description="Spots risks, weaknesses, and overvaluation.",
    ),
    AgentSpec(
        id="tara",
        display_name="Tara (Neutral Analyst)",
        meaning="Star / guide",
        role_description="Balances perspectives and finds truth in the research debate.",
    ),
    AgentSpec(
        id="zian",
        display_name="Zian (Trader)",
        meaning="Self-peace / focused energy",
        role_description="Executes trades with precision.",
    ),
    AgentSpec(
        id="veer",
        display_name="Veer (Aggressive Risk)",
        meaning="Brave / bold",
        role_description="Pushes high-risk, high-reward strategies.",
    ),
    AgentSpec(
        id="shan",
        display_name="Shan (Conservative Risk)",
        meaning="Calm / composed",
        role_description="Focuses on capital preservation.",
    ),
    AgentSpec(
        id="rey",
        display_name="Rey (Neutral Risk)",
        meaning="Balance / flow",
        role_description="Maintains equilibrium in decisions.",
    ),
    AgentSpec(
        id="ira",
        display_name="Ira (Portfolio Analyst)",
        meaning="Earth / wealth",
        role_description="Builds and manages portfolio allocation.",
    ),
)

AGENTS_BY_ID: Final[Dict[str, AgentSpec]] = {s.id: s for s in AGENT_SPECS}
ALL_AGENT_IDS: List[str] = [s.id for s in AGENT_SPECS]

ANALYST_ORDER: Final[Tuple[str, ...]] = ("market", "social", "news", "fundamentals")

ANALYST_KEY_TO_ID: Final[Dict[str, str]] = {
    "market": "arin",
    "social": "mira",
    "news": "rama",
    "fundamentals": "neel",
}

FIXED_AGENT_GROUPS: Final[Dict[str, List[str]]] = {
    "Research Team": ["ayan", "kiran", "tara"],
    "Trading Team": ["zian"],
    "Risk Management": ["veer", "shan", "rey"],
    "Portfolio Management": ["ira"],
}

LEGACY_AGENT_ID: Final[Dict[str, str]] = {
    "Market Analyst": "arin",
    "Social Analyst": "mira",
    "News Analyst": "rama",
    "Fundamentals Analyst": "neel",
    "Bull Researcher": "ayan",
    "Bear Researcher": "kiran",
    "Research Manager": "tara",
    "Trader": "zian",
    "Aggressive Analyst": "veer",
    "Neutral Analyst": "rey",
    "Conservative Analyst": "shan",
    "Portfolio Manager": "ira",
}

REPORT_SECTION_KEYS: Final[Tuple[str, ...]] = (
    "market_report",
    "sentiment_report",
    "news_report",
    "fundamentals_report",
    "investment_plan",
    "trader_investment_plan",
    "final_trade_decision",
)


def resolve_agent_id(agent_key: str) -> str:
    """Map legacy display names to canonical ids; pass through if already canonical."""
    if agent_key in AGENTS_BY_ID:
        return agent_key
    return LEGACY_AGENT_ID.get(agent_key, agent_key)


def display_name(agent_id: str) -> str:
    rid = resolve_agent_id(agent_id)
    return AGENTS_BY_ID[rid].display_name


def report_heading(agent_id: str) -> str:
    """Markdown `###` heading line body (no hashes)."""
    return display_name(agent_id)
