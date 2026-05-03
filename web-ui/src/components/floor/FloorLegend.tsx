"use client";

import React, { useMemo } from "react";
import { agentShortLabel, normalizeAgentStatusMap } from "../../lib/agentRegistry";
import { MISSION_BAYS } from "../../lib/workflowMissionLayout";
import { LEGEND_CARD_HEIGHT, LEGEND_TOP_Y, normalizeDeskStatus } from "../../lib/tradingFloorLayout";

function legendClass(status: string): string {
  const s = normalizeDeskStatus(status);
  if (s === "in_progress") return "tf-legend-dot tf-legend-dot--active";
  if (s === "completed") return "tf-legend-dot tf-legend-dot--done";
  if (s === "failed") return "tf-legend-dot tf-legend-dot--fail";
  if (s === "cancelled" || s === "interrupted") return "tf-legend-dot tf-legend-dot--warn";
  if (s === "standby") return "tf-legend-dot tf-legend-dot--idle";
  return "tf-legend-dot tf-legend-dot--pending";
}

type Props = {
  agentStatus: Record<string, string>;
  /** When true, card is anchored at y=0 for a small docked SVG below the floor. */
  docked?: boolean;
};

export function FloorLegend({ agentStatus, docked }: Props) {
  const agents = useMemo(() => MISSION_BAYS.flatMap((b) => b.agents), []);
  const row1 = agents.slice(0, 6);
  const row2 = agents.slice(6);
  const statusNorm = useMemo(() => normalizeAgentStatusMap(agentStatus), [agentStatus]);

  function pill(agent: string, i: number, rowY: number) {
    const st = statusNorm[agent] ?? "pending";
    const x = 28 + i * 188;
    return (
      <g key={agent} transform={`translate(${x},${rowY})`} className="tf-legend-pill">
        <circle cx="0" cy="0" r="5" className={legendClass(st)} />
        <text x="12" y="4" className="tf-legend-name">
          {agentShortLabel(agent)}
        </text>
      </g>
    );
  }

  const y0 = docked ? 0 : LEGEND_TOP_Y;
  return (
    <g className="tf-floor-legend" role="list" aria-label="Agent status strip">
      <rect x="12" y={y0} width="1176" height={LEGEND_CARD_HEIGHT} rx="12" className="tf-floor-legend-bg" />
      <text x="28" y={y0 + 20} className="tf-legend-heading">
        Team status
      </text>
      <g role="presentation">{row1.map((a, i) => pill(a, i, y0 + 38))}</g>
      <g role="presentation">{row2.map((a, i) => pill(a, i, y0 + 76))}</g>
    </g>
  );
}
