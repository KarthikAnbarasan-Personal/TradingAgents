from __future__ import annotations

import ast
from collections import deque
from typing import Dict, Iterable, Optional, Tuple


ANALYST_ORDER = ["market", "social", "news", "fundamentals"]
ANALYST_AGENT_NAMES = {
    "market": "Market Analyst",
    "social": "Social Analyst",
    "news": "News Analyst",
    "fundamentals": "Fundamentals Analyst",
}
ANALYST_REPORT_MAP = {
    "market": "market_report",
    "social": "sentiment_report",
    "news": "news_report",
    "fundamentals": "fundamentals_report",
}


class WorkflowState:
    FIXED_AGENTS = {
        "Research Team": ["Bull Researcher", "Bear Researcher", "Research Manager"],
        "Trading Team": ["Trader"],
        "Risk Management": ["Aggressive Analyst", "Neutral Analyst", "Conservative Analyst"],
        "Portfolio Management": ["Portfolio Manager"],
    }
    ANALYST_MAPPING = ANALYST_AGENT_NAMES
    REPORT_SECTIONS = {
        "market_report": ("market", "Market Analyst"),
        "sentiment_report": ("social", "Social Analyst"),
        "news_report": ("news", "News Analyst"),
        "fundamentals_report": ("fundamentals", "Fundamentals Analyst"),
        "investment_plan": (None, "Research Manager"),
        "trader_investment_plan": (None, "Trader"),
        "final_trade_decision": (None, "Portfolio Manager"),
    }

    def __init__(self, max_length: int = 300) -> None:
        self.messages = deque(maxlen=max_length)
        self.tool_calls = deque(maxlen=max_length)
        self.agent_status: Dict[str, str] = {}
        self.report_sections: Dict[str, Optional[str]] = {}
        self.selected_analysts: list[str] = []
        self._processed_message_ids: set[str] = set()

    def init_for_analysis(self, selected_analysts: Iterable[str]) -> None:
        selected = [a.lower() for a in selected_analysts]
        self.selected_analysts = selected
        self.agent_status = {}
        for analyst_key in selected:
            if analyst_key in self.ANALYST_MAPPING:
                self.agent_status[self.ANALYST_MAPPING[analyst_key]] = "pending"
        for team_agents in self.FIXED_AGENTS.values():
            for agent in team_agents:
                self.agent_status[agent] = "pending"
        self.report_sections = {}
        for section, (analyst_key, _) in self.REPORT_SECTIONS.items():
            if analyst_key is None or analyst_key in selected:
                self.report_sections[section] = None
        self.messages.clear()
        self.tool_calls.clear()
        self._processed_message_ids.clear()

    def update_agent_status(self, agent: str, status: str) -> bool:
        if agent not in self.agent_status:
            return False
        prev = self.agent_status[agent]
        self.agent_status[agent] = status
        return prev != status

    def update_report_section(self, section_name: str, content: str) -> bool:
        if section_name not in self.report_sections:
            return False
        prev = self.report_sections[section_name]
        self.report_sections[section_name] = content
        return prev != content


def update_analyst_statuses(state: WorkflowState, chunk: Dict) -> Dict[str, str]:
    selected = state.selected_analysts
    found_active = False
    changed: Dict[str, str] = {}

    for analyst_key in ANALYST_ORDER:
        if analyst_key not in selected:
            continue

        agent_name = ANALYST_AGENT_NAMES[analyst_key]
        report_key = ANALYST_REPORT_MAP[analyst_key]
        if chunk.get(report_key):
            state.update_report_section(report_key, chunk[report_key])

        has_report = bool(state.report_sections.get(report_key))
        if has_report:
            if state.update_agent_status(agent_name, "completed"):
                changed[agent_name] = "completed"
        elif not found_active:
            if state.update_agent_status(agent_name, "in_progress"):
                changed[agent_name] = "in_progress"
            found_active = True
        else:
            if state.update_agent_status(agent_name, "pending"):
                changed[agent_name] = "pending"

    if not found_active and selected:
        if state.agent_status.get("Bull Researcher") == "pending":
            if state.update_agent_status("Bull Researcher", "in_progress"):
                changed["Bull Researcher"] = "in_progress"

    return changed


def extract_content_string(content) -> Optional[str]:
    def is_empty(val) -> bool:
        if val is None or val == "":
            return True
        if isinstance(val, str):
            stripped = val.strip()
            if not stripped:
                return True
            try:
                return not bool(ast.literal_eval(stripped))
            except (ValueError, SyntaxError):
                return False
        return not bool(val)

    if is_empty(content):
        return None
    if isinstance(content, str):
        return content.strip()
    if isinstance(content, dict):
        text = content.get("text", "")
        return text.strip() if not is_empty(text) else None
    if isinstance(content, list):
        text_parts = [
            item.get("text", "").strip()
            if isinstance(item, dict) and item.get("type") == "text"
            else (item.strip() if isinstance(item, str) else "")
            for item in content
        ]
        result = " ".join(t for t in text_parts if t and not is_empty(t))
        return result if result else None
    return str(content).strip() if not is_empty(content) else None


def classify_message_type(message) -> Tuple[str, Optional[str]]:
    from langchain_core.messages import AIMessage, HumanMessage, ToolMessage

    content = extract_content_string(getattr(message, "content", None))
    if isinstance(message, HumanMessage):
        if content and content.strip() == "Continue":
            return ("Control", content)
        return ("User", content)
    if isinstance(message, ToolMessage):
        return ("Data", content)
    if isinstance(message, AIMessage):
        return ("Agent", content)
    return ("System", content)

