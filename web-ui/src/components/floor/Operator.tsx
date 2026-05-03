"use client";

import React from "react";
import { normalizeDeskStatus } from "../../lib/tradingFloorLayout";

type DeskMood = "idle" | "active" | "done" | "fail" | "warn" | "pending";

export function operatorMoodFromStatus(status: string): DeskMood {
  const s = normalizeDeskStatus(status);
  if (s === "in_progress") return "active";
  if (s === "completed") return "done";
  if (s === "failed") return "fail";
  if (s === "cancelled" || s === "interrupted") return "warn";
  if (s === "standby") return "idle";
  return "pending";
}

type Props = { mood: DeskMood };

/** Stylized trader at desk — compact for isometric scene */
export function Operator({ mood }: Props) {
  return (
    <g className={`tf-operator tf-operator--${mood}`} aria-hidden>
      <ellipse cx="0" cy="-28" rx="10" ry="11" className="tf-operator-head" />
      <path d="M-14 -8 Q0 -14 14 -8 L16 8 Q0 4 -16 8 Z" className="tf-operator-body" />
      <rect x="-18" y="8" width="36" height="6" rx="2" className="tf-operator-hands" />
    </g>
  );
}
