"use client";

import React, { useMemo } from "react";
import { buildFloorDeskSlots, hotBayIdsFromAgentStatus } from "../../lib/tradingFloorLayout";
import { BayBackdrop } from "./BayBackdrop";
import { Desk } from "./Desk";
import { FloorLegend } from "./FloorLegend";
import { FloorLines } from "./FloorLines";
import { LEGEND_BOTTOM_GAP, LEGEND_CARD_HEIGHT, OFFICE_FLOOR_SVG_HEIGHT } from "../../lib/tradingFloorLayout";
import { TradingRoomHeader } from "./TradingRoomHeader";

type Props = {
  agentStatus: Record<string, string>;
  onDeskSelect: (agent: string) => void;
};

export function OfficeScene({ agentStatus, onDeskSelect }: Props) {
  const slots = useMemo(() => buildFloorDeskSlots(), []);
  const hotBayIds = useMemo(() => hotBayIdsFromAgentStatus(agentStatus), [agentStatus]);
  const hotBaySet = useMemo(() => new Set(hotBayIds), [hotBayIds]);

  return (
    <div className="tf-scene-wrap">
      <svg
        className="tf-scene-svg"
        viewBox={`0 0 1200 ${OFFICE_FLOOR_SVG_HEIGHT}`}
        preserveAspectRatio="xMidYMin meet"
        role="img"
        aria-label="Trader hub office floor with agent desks"
      >
        <TradingRoomHeader />
        <FloorLines />
        <BayBackdrop hotBayIds={hotBayIds} />
        <g className="tf-desks-layer">
          {[...slots]
            .sort((a, b) => a.z - b.z)
            .map((slot) => {
              const st = agentStatus[slot.agent] ?? "pending";
              return (
                <Desk
                  key={slot.id}
                  agent={slot.agent}
                  status={st}
                  bayHot={hotBaySet.has(slot.bayId)}
                  x={slot.x}
                  y={slot.y}
                  onSelect={onDeskSelect}
                />
              );
            })}
        </g>
      </svg>
      <div className="tf-scene-legend-dock" style={{ paddingBottom: LEGEND_BOTTOM_GAP }}>
        <svg
          className="tf-scene-legend-svg"
          viewBox={`0 0 1200 ${LEGEND_CARD_HEIGHT}`}
          preserveAspectRatio="xMidYMid meet"
          width="100%"
          height={LEGEND_CARD_HEIGHT}
          role="img"
          aria-label="Agent team status"
        >
          <FloorLegend agentStatus={agentStatus} docked />
        </svg>
      </div>
    </div>
  );
}
