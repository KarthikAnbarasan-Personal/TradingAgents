"use client";

import React from "react";
import { agentDisplayName, agentShortLabel } from "../../lib/agentRegistry";
import { deskStatusClass } from "../../lib/tradingFloorLayout";
import { Operator, operatorMoodFromStatus } from "./Operator";

type Props = {
  agent: string;
  status: string;
  /** True when any agent in this bay is in_progress — ambient bay pulse */
  bayHot?: boolean;
  x: number;
  y: number;
  onSelect: (agent: string) => void;
};

export function Desk({ agent, status, bayHot, x, y, onSelect }: Props) {
  const mood = operatorMoodFromStatus(status);
  const cls = deskStatusClass(status);
  const label = agentShortLabel(agent);
  const active = cls === "tf-desk--active";
  const groupClass = ["tf-desk", cls, bayHot ? "tf-desk-bay-hot" : "", active ? "tf-desk-running" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`${agentDisplayName(agent)} desk, status ${status}`}
      className={groupClass}
      transform={`translate(${x},${y})`}
      onClick={() => onSelect(agent)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(agent);
        }
      }}
    >
      {/* Isometric desk block */}
      <polygon points="-42,8 -8,-12 38,8 38,28 -42,28" className="tf-desk-top" />
      <polygon points="-42,28 -42,48 -8,58 38,48 38,28" className="tf-desk-front" />
      <polygon points="-42,28 -8,58 -8,-12 -42,8" className="tf-desk-side" />
      {active && (
        <circle cx="0" cy="-24" r="46" className="tf-desk-activity-ring" fill="none" aria-hidden />
      )}
      {/* Monitor */}
      <rect x="-22" y="-38" width="44" height="28" rx="3" className="tf-desk-monitor" />
      <rect x="-18" y="-34" width="36" height="18" rx="1" className="tf-desk-monitor-screen" />
      <Operator mood={mood} />
      <text x="0" y="72" textAnchor="middle" className="tf-desk-label">
        {label}
      </text>
    </g>
  );
}
