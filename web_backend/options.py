from __future__ import annotations

from typing import Any, Dict, List

from tradingagents.agents.registry import ANALYST_KEY_TO_ID, ANALYST_ORDER, display_name
from tradingagents.llm_clients.model_catalog import get_model_options


PROVIDERS = [
    {"label": "OpenAI", "value": "openai"},
    {"label": "Google", "value": "google"},
    {"label": "Anthropic", "value": "anthropic"},
    {"label": "xAI", "value": "xai"},
    {"label": "DeepSeek", "value": "deepseek"},
    {"label": "Qwen", "value": "qwen"},
    {"label": "GLM", "value": "glm"},
    {"label": "OpenRouter", "value": "openrouter"},
    {"label": "Azure OpenAI", "value": "azure"},
    {"label": "Ollama", "value": "ollama"},
]

RESEARCH_DEPTHS = [
    {
        "label": "Shallow - Quick research, few debate and strategy discussion rounds",
        "value": 1,
    },
    {
        "label": "Medium - Middle ground, moderate debate rounds and strategy discussion",
        "value": 3,
    },
    {
        "label": "Deep - Comprehensive research, in depth debate and strategy discussion",
        "value": 5,
    },
]

OUTPUT_LANGUAGES = [
    "English",
    "Chinese",
    "Japanese",
    "Korean",
    "Hindi",
    "Spanish",
    "Portuguese",
    "French",
    "German",
    "Arabic",
    "Russian",
]


def _fallback_model_options(provider: str, mode: str) -> List[Dict[str, str]]:
    if provider in {"openrouter", "azure"}:
        return [{"label": "Custom model ID", "value": "custom"}]
    return []


def build_frontend_options() -> Dict[str, Any]:
    models: Dict[str, Dict[str, List[Dict[str, str]]]] = {}
    for provider_info in PROVIDERS:
        provider = provider_info["value"]
        models[provider] = {"quick": [], "deep": []}
        for mode in ("quick", "deep"):
            try:
                options = get_model_options(provider, mode)
                models[provider][mode] = [
                    {"label": display, "value": value} for display, value in options
                ]
            except Exception:
                models[provider][mode] = _fallback_model_options(provider, mode)

    return {
        "providers": PROVIDERS,
        "research_depths": RESEARCH_DEPTHS,
        "output_languages": OUTPUT_LANGUAGES,
        "models": models,
        "analysts": [
            {"key": k, "label": display_name(ANALYST_KEY_TO_ID[k])} for k in ANALYST_ORDER
        ],
    }

