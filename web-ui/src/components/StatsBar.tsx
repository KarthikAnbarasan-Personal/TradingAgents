"use client";

import React from "react";
import { RunSnapshot } from "../lib/types";

type Props = {
  run: RunSnapshot | null;
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

/** Shared grid of run metrics (used inline on Home and inside the history info dialog). */
export function RunStatsFields({ run }: Props) {
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

