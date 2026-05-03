"use client";

import React, { useMemo } from "react";
import { agentDisplayName } from "../lib/agentRegistry";
import { MISSION_BAYS, normalizeAgentStatus } from "../lib/workflowMissionLayout";

type Props = {
  agentStatus: Record<string, string>;
};

function statusLedClass(status: string): string {
  const s = status.toLowerCase();
  if (s === "completed") return "mc-led--ok";
  if (s === "in_progress") return "mc-led--active";
  if (s === "failed") return "mc-led--fail";
  if (s === "cancelled" || s === "interrupted") return "mc-led--warn";
  if (s === "standby") return "mc-led--standby";
  return "mc-led--idle";
}

function stationModClass(status: string): string {
  const s = status.toLowerCase();
  if (s === "completed") return "mc-station--completed";
  if (s === "in_progress") return "mc-station--active";
  if (s === "failed") return "mc-station--failed";
  if (s === "cancelled" || s === "interrupted") return "mc-station--warn";
  if (s === "standby") return "mc-station--standby";
  return "mc-station--pending";
}

/** Minimal “operator at console” glyph — reads at small sizes in dark UI. */
function OperatorGlyph({ active }: { active: boolean }) {
  return (
    <svg
      className={`mc-operator ${active ? "mc-operator--active" : ""}`}
      viewBox="0 0 48 56"
      width="40"
      height="46"
      aria-hidden
    >
      <ellipse cx="24" cy="12" rx="9" ry="10" className="mc-operator-head" />
      <path
        d="M12 28 Q24 22 36 28 L38 40 Q24 36 10 40 Z"
        className="mc-operator-torso"
      />
      <rect x="8" y="38" width="32" height="14" rx="2" className="mc-operator-console" />
      <rect x="12" y="42" width="24" height="4" rx="1" className="mc-operator-screen" />
      {active ? (
        <g className="mc-operator-pulse-ring">
          <circle cx="24" cy="26" r="16" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.35" />
        </g>
      ) : null}
    </svg>
  );
}

export function WorkflowMissionControl({ agentStatus }: Props) {
  const hasAny = useMemo(() => Object.keys(agentStatus).length > 0, [agentStatus]);

  return (
    <div className="card mc-shell">
      <div className="mc-shell-header">
        <div>
          <h3 className="section-title mc-shell-title">Workflow · Mission control</h3>
          <p className="muted mc-shell-sub">Live station status · analysts through portfolio</p>
        </div>
        <div className="mc-clock" aria-hidden>
          <span className="mc-clock-dot" />
          <span className="mono mc-clock-label">LIVE</span>
        </div>
      </div>

      {!hasAny ? (
        <div className="muted mc-empty">No workflow telemetry yet. Start a run to bring stations online.</div>
      ) : (
        <div className="mc-bays">
          {MISSION_BAYS.map((bay) => {
            const visible = bay.agents.filter((a) => a in agentStatus);
            if (visible.length === 0) return null;
            return (
              <section key={bay.id} className="mc-bay" aria-label={bay.label}>
                <header className="mc-bay-head">
                  <div className="mc-bay-titles">
                    <span className="mc-bay-label mono">{bay.label}</span>
                    <span className="mc-bay-sub muted">{bay.subtitle}</span>
                  </div>
                  <span className="mc-bay-tag mono">BAY · {bay.id.toUpperCase().slice(0, 3)}</span>
                </header>
                <div className="mc-stations">
                  {bay.agents.map((agent) => {
                    if (!(agent in agentStatus)) return null;
                    const raw = agentStatus[agent];
                    const status = normalizeAgentStatus(raw);
                    const active = status.toLowerCase() === "in_progress";
                    return (
                      <div
                        key={agent}
                        className={`mc-station ${stationModClass(status)}`}
                        role="group"
                        aria-label={`${agentDisplayName(agent)}, ${status}`}
                      >
                        <div className="mc-station-bezel">
                          <div className="mc-station-screen-wrap">
                            {active ? <div className="mc-scanline" aria-hidden /> : null}
                            <OperatorGlyph active={active} />
                          </div>
                          <div className="mc-station-meta">
                            <div className="mc-station-name">{agentDisplayName(agent)}</div>
                            <div className="mc-station-footer">
                              <span className={`mc-led ${statusLedClass(status)}`} aria-hidden />
                              <span className="mono mc-station-status">{status.replace(/_/g, " ")}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
