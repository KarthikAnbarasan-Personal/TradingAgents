from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


RunStatus = Literal[
    "queued",
    "running",
    "completed",
    "failed",
    "cancel_requested",
    "cancelled",
    "interrupted",
]


class RunCreateRequest(BaseModel):
    ticker: str = Field(..., min_length=1, max_length=16)
    analysis_date: str = Field(..., description="YYYY-mm-dd")
    analysts: List[str] = Field(
        default_factory=lambda: ["market", "social", "news", "fundamentals"]
    )
    llm_provider: str = "openai"
    deep_model: Optional[str] = None
    quick_model: Optional[str] = None
    research_depth: int = 1
    output_language: str = "English"
    backend_url: Optional[str] = None
    checkpoint_enabled: bool = False


class RunStats(BaseModel):
    llm_calls: int = 0
    tool_calls: int = 0
    tokens_in: int = 0
    tokens_out: int = 0


class RunEvent(BaseModel):
    seq: int
    type: str
    timestamp: str
    data: Dict[str, Any] = Field(default_factory=dict)


class RunSnapshot(BaseModel):
    run_id: str
    status: RunStatus
    created_at: datetime
    updated_at: datetime
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    request: RunCreateRequest
    agent_status: Dict[str, str] = Field(default_factory=dict)
    report_sections: Dict[str, Any] = Field(default_factory=dict)
    stats: RunStats = Field(default_factory=RunStats)
    error: Optional[str] = None
    artifact_dir: Optional[str] = None
    complete_report_path: Optional[str] = None
    report_dir: Optional[str] = None
    legacy_report_dir: Optional[str] = None
    final_state: Dict[str, Any] = Field(default_factory=dict)

