"use client";

import Link from "next/link";
import React, { useMemo, useRef, useEffect } from "react";
import { agentDisplayName, reportSectionForAgent, resolveAgentId } from "../../lib/agentRegistry";
import { StreamDerivedState } from "../../lib/runStreamReducer";
import { RunSnapshot } from "../../lib/types";

type Props = {
  agent: string | null;
  open: boolean;
  onClose: () => void;
  runId: string | null;
  snapshot: RunSnapshot | null;
  streamState: StreamDerivedState;
};

function sliceAgentEvents(state: StreamDerivedState, agent: string) {
  const hist = state.agentHistory[agent] ?? [];
  const inProg = [...hist].reverse().find((h) => h.status === "in_progress");
  if (!inProg) {
    return state.eventLog.slice(-24);
  }
  const done = hist.find((h) => h.status === "completed" || h.status === "failed");
  const startSeq = inProg.seq;
  const endSeq = done?.seq ?? Number.MAX_SAFE_INTEGER;
  return state.eventLog.filter((e) => e.seq >= startSeq && e.seq <= endSeq + 100).slice(-40);
}

export function DeskDrawer({ agent, open, onClose, runId, snapshot, streamState }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && agent) d.showModal();
    else d.close();
  }, [open, agent]);

  const rid = agent ? resolveAgentId(agent) : "";
  const sectionPath = rid ? reportSectionForAgent(rid) : undefined;
  const sectionMarkdown =
    sectionPath && snapshot?.report_sections?.[sectionPath]
      ? String(snapshot.report_sections[sectionPath]).slice(0, 1200)
      : null;

  const rows = useMemo(
    () => (rid ? sliceAgentEvents(streamState, rid) : []),
    [rid, streamState.eventLog, streamState.agentHistory]
  );

  const hist = rid ? streamState.agentHistory[rid] ?? [] : [];

  if (!agent) return null;

  return (
    <dialog ref={ref} className="tf-drawer" onClose={onClose} onClick={(e) => e.target === ref.current && onClose()}>
      <div className="tf-drawer-panel card" onClick={(e) => e.stopPropagation()}>
        <header className="tf-drawer-head">
          <h3 className="section-title">{agent}</h3>
          <button type="button" className="secondary" onClick={onClose}>
            Close
          </button>
        </header>
        <div className="muted mono tf-drawer-status">
          Current:{" "}
          {streamState.agentStatus[rid] ??
            snapshot?.agent_status?.[rid] ??
            snapshot?.agent_status?.[agent ?? ""] ??
            "—"}
        </div>
        {runId && (
          <div style={{ marginBottom: 12 }}>
            <Link href={`/history?run=${encodeURIComponent(runId)}`} className="muted" style={{ fontSize: 13 }}>
              Open in Run history
            </Link>
          </div>
        )}
        <h4 className="tf-drawer-sub">Status history</h4>
        <ul className="tf-drawer-list">
          {hist.map((h) => (
            <li key={`${h.seq}-${h.status}`} className="mono tf-drawer-li">
              #{h.seq} · {h.status} · {h.at}
            </li>
          ))}
        </ul>
        <h4 className="tf-drawer-sub">Activity near this station</h4>
        <ul className="tf-drawer-events">
          {rows.map((e) => (
            <li key={e.seq} className="tf-drawer-ev">
              <span className="muted mono">#{e.seq}</span> {e.type}
              <pre className="mono tf-drawer-pre">{JSON.stringify(e.data, null, 2).slice(0, 800)}</pre>
            </li>
          ))}
        </ul>
        {sectionPath && (
          <div className="muted" style={{ fontSize: 12 }}>
            Report file: <span className="mono">{sectionPath}</span>
          </div>
        )}
        {sectionMarkdown && (
          <details className="tf-drawer-details">
            <summary>Section preview</summary>
            <pre className="mono tf-drawer-preview">{sectionMarkdown}…</pre>
          </details>
        )}
      </div>
    </dialog>
  );
}
