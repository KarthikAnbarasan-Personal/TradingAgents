from web_backend.state import WorkflowState, update_analyst_statuses


def test_update_analyst_status_transitions():
    state = WorkflowState()
    state.init_for_analysis(["market", "news"])

    changed = update_analyst_statuses(state, {})
    assert changed["arin"] == "in_progress"
    assert state.agent_status["rama"] == "pending"

    changed = update_analyst_statuses(state, {"market_report": "market content"})
    assert state.agent_status["arin"] == "completed"
    assert state.agent_status["rama"] == "in_progress"

    changed = update_analyst_statuses(state, {"news_report": "news content"})
    assert state.agent_status["rama"] == "completed"
    assert state.agent_status["ayan"] == "in_progress"
