"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { RunEvent } from "../lib/types";

type Props = {
  events: RunEvent[];
};

const ACTIVITY_TYPES = new Set([
  "message_added",
  "tool_called",
  "agent_status_changed",
  "run_started",
  "run_completed",
  "run_failed",
  "section_updated",
  "run_cancel_requested"
]);

const DISPLAY_MSG_CAP = 4_000;

function truncateDisplay(text: string, max: number): { text: string; truncated: boolean } {
  if (text.length <= max) return { text, truncated: false };
  return { text: text.slice(0, max) + `… (${text.length} chars)`, truncated: true };
}

export function ActivityPanel({ events }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  const display = useMemo(() => {
    const filtered = events.filter((e) => ACTIVITY_TYPES.has(e.type));
    const sorted = [...filtered].sort((a, b) => a.seq - b.seq);
    return sorted.slice(-250);
  }, [events]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [display.length, display[display.length - 1]?.seq]);

  return (
    <div className="card">
      <h3 className="section-title">Live Activity</h3>
      <p className="muted" style={{ margin: "0 0 10px" }}>
        Streamed events (newest at bottom). Large tool outputs are truncated in the log.
      </p>
      {display.length === 0 ? (
        <div className="muted">Waiting for events…</div>
      ) : (
        <div className="activity-panel-scroll">
          {display.map((event) => (
            <div key={event.seq} className="activity-panel-row">
              <div className="muted mono activity-panel-meta">
                #{event.seq} · {event.type}
              </div>
              {event.type === "message_added" && (
                <div>
                  <span className="muted">{String(event.data.message_type ?? "")}: </span>
                  <span className="activity-panel-body">
                    {truncateDisplay(String(event.data.content ?? ""), DISPLAY_MSG_CAP).text}
                  </span>
                </div>
              )}
              {event.type === "tool_called" && (
                <div>
                  <span className="muted">{String(event.data.tool_name ?? "")}</span>
                  <pre className="mono activity-panel-pre">
                    {JSON.stringify(event.data.args ?? {}, null, 2)}
                  </pre>
                </div>
              )}
              {event.type === "agent_status_changed" && (
                <div>
                  <strong>{String(event.data.agent ?? "")}</strong>
                  <span className="muted"> → {String(event.data.status ?? "")}</span>
                </div>
              )}
              {event.type === "section_updated" && (
                <div className="muted">
                  Section <span className="mono">{String(event.data.section ?? "")}</span> updated
                  {typeof event.data.chars === "number"
                    ? ` (${event.data.chars.toLocaleString()} chars)`
                    : event.data.content != null
                      ? ` (${String(event.data.content).length.toLocaleString()} chars)`
                      : ""}
                </div>
              )}
              {event.type === "run_started" && (
                <div className="muted">
                  Run started · {String(event.data.ticker ?? "")} · {String(event.data.analysis_date ?? "")}
                </div>
              )}
              {event.type === "run_completed" && (
                <div style={{ color: "#86efac" }}>Run completed</div>
              )}
              {event.type === "run_failed" && (
                <div style={{ color: "#ef4444" }}>{String(event.data.error ?? "Run failed")}</div>
              )}
              {event.type === "run_cancel_requested" && (
                <div className="muted">Cancel requested</div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
