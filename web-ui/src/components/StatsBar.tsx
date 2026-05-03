"use client";

import React from "react";
import { RunSnapshot } from "../lib/types";

type Props = {
  run: RunSnapshot | null;
  /** Single horizontal row (trading floor HUD). Default: 5-column grid for home/history. */
  layout?: "grid" | "inline";
};

function formatElapsed(run: RunSnapshot | null): string {
  if (!run?.started_at) return "-";
  const start = new Date(run.started_at).getTime();
  const end = run.finished_at ? new Date(run.finished_at).getTime() : Date.now();
  const sec = Math.max(0, Math.floor((end - start) / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

/** Shared run metrics (grid on Home/history dialog; single row on trading floor). */
export function RunStatsFields({ run, layout = "grid" }: Props) {
  if (layout === "inline") {
    const tokIn = (run?.stats?.tokens_in ?? 0).toLocaleString();
    const tokOut = (run?.stats?.tokens_out ?? 0).toLocaleString();
    return (
      <div className="run-stats-fields run-stats-fields--inline" role="group" aria-label="Run metrics">
        <div className="run-stat-inline">
          <span className="muted">Status</span>
          <span className="mono">{run?.status ?? "—"}</span>
        </div>
        <div className="run-stat-inline">
          <span className="muted">LLM</span>
          <span className="mono">{run?.stats?.llm_calls ?? 0}</span>
        </div>
        <div className="run-stat-inline">
          <span className="muted">Tools</span>
          <span className="mono">{run?.stats?.tool_calls ?? 0}</span>
        </div>
        <div className="run-stat-inline">
          <span className="muted">Tokens</span>
          <span className="mono">
            {tokIn}/{tokOut}
          </span>
        </div>
        <div className="run-stat-inline">
          <span className="muted">Elapsed</span>
          <span className="mono">{formatElapsed(run)}</span>
        </div>
      </div>
    );
  }
  return (
    <div
      className="run-stats-fields"
      style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 8 }}
    >
      <div>
        <div className="muted">Status</div>
        <div className="mono">{run?.status ?? "-"}</div>
      </div>
      <div>
        <div className="muted">LLM Calls</div>
        <div className="mono">{run?.stats?.llm_calls ?? 0}</div>
      </div>
      <div>
        <div className="muted">Tool Calls</div>
        <div className="mono">{run?.stats?.tool_calls ?? 0}</div>
      </div>
      <div>
        <div className="muted">Tokens (in/out)</div>
        <div className="mono">
          {(run?.stats?.tokens_in ?? 0).toLocaleString()} / {(run?.stats?.tokens_out ?? 0).toLocaleString()}
        </div>
      </div>
      <div>
        <div className="muted">Elapsed</div>
        <div className="mono">{formatElapsed(run)}</div>
      </div>
    </div>
  );
}

export function StatsBar({ run }: Props) {
  return (
    <div className="card">
      <RunStatsFields run={run} />
    </div>
  );
}

