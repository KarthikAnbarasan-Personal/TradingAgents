"use client";

import React from "react";
import { BAY_ROOM_RECTS, BayRoomRect } from "../../lib/tradingFloorLayout";
import { ZoneDecor } from "./ZoneDecor";

const BAY_TITLE: Record<string, string> = {
  analysts: "Analyst wing · NW",
  research: "Research wing · SW",
  trading: "Trading pit · hub",
  risk: "Risk wing · NE",
  portfolio: "Portfolio wing · SE"
};

type Props = {
  hotBayIds: string[];
};

function innerFloorRect(r: BayRoomRect, id: string): BayRoomRect {
  const padX = 10;
  const padBot = 12;
  let padTop = 30;
  if (id === "research") padTop = 40;
  else if (id === "analysts") padTop = 38;
  else if (id === "trading") padTop = 30;
  return {
    x: r.x + padX,
    y: r.y + padTop,
    w: r.w - padX * 2,
    h: r.h - padTop - padBot
  };
}

export function BayBackdrop({ hotBayIds }: Props) {
  const hot = new Set(hotBayIds);

  return (
    <g className="tf-bays" aria-hidden>
      {(Object.entries(BAY_ROOM_RECTS) as [string, BayRoomRect][]).map(([id, r]) => {
        const isHot = hot.has(id);
        const inner = innerFloorRect(r, id);
        const title = BAY_TITLE[id] ?? id;
        return (
          <g key={id} className={isHot ? "tf-bay-group tf-bay-group--hot" : "tf-bay-group"}>
            <rect
              x={r.x}
              y={r.y}
              width={r.w}
              height={r.h}
              rx={14}
              ry={14}
              className={`tf-bay-room tf-bay-room--${id}${isHot ? " tf-bay-room--hot" : ""}`}
            />
            <rect
              x={inner.x}
              y={inner.y}
              width={inner.w}
              height={inner.h}
              rx={10}
              ry={10}
              className={`tf-bay-floor tf-bay-floor--${id}`}
            />
            <text x={r.x + r.w / 2} y={r.y + 22} textAnchor="middle" className="tf-bay-title">
              {title}
            </text>
            <ZoneDecor bayId={id} x={inner.x + 22} y={inner.y + 18} />
          </g>
        );
      })}
    </g>
  );
}
