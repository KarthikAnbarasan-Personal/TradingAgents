# Mission Control (external) → Trader’s Hub mapping

We take **UX patterns** from the open [`builderz-labs/mission-control`](https://github.com/builderz-labs/mission-control) project (drawers, activity density, real-time feel, status colors). **We do not import** their code, SQL, auth, or Tailwind stack.

| MC concept            | Our implementation |
|-----------------------|--------------------|
| Live activity feed    | `runStreamReducer` ticker + `HudTopBar` tape |
| Run / job status      | `RunSnapshot.status` + HUD banner (LIVE / REPLAY) |
| Detail drawer         | `DeskDrawer` (`<dialog>`) on desk click |
| Dense metrics         | `HudStatsStrip` → `RunStatsFields` |
| Scrub / replay        | `ReplayBar` + `useReplayStreamState` + `GET …/events/all` |
| Start new work        | `MissionBrief` → `RunForm` + `createRun` |
| Picker of recent items| `RunPicker` + `listRuns` |

## Stack boundaries

- **Single source of truth** for stream-shaped UI: `applyEvent` / `streamStateFromSnapshotAndEvents` in `runStreamReducer.ts` (shared by SSE live + JSON replay).
- **Backend**: FastAPI, SSE `GET /api/runs/{id}/events`, bulk `GET /api/runs/{id}/events/all` for replay.
- **Styling**: plain CSS, `.tf-*` prefix in `globals.css` (no MC/Tailwind classes).

## When extending

- New agents: add to `tradingagents/agents/registry.py`, backend `state.py` / runner, graph `setup.py`, and `web-ui/src/lib/agentRegistry.ts` (plus `AGENT_TO_REPORT_SECTION` when a new report path exists).
- New event types: extend `applyEvent` and add a Vitest case in `runStreamReducer.test.ts`.
