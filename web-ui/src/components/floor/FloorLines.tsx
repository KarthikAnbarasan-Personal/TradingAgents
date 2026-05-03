"use client";

import React from "react";
import { FLOOR_GRID_HEIGHT, FLOOR_GRID_TOP_Y } from "../../lib/tradingFloorLayout";

export function FloorLines() {
  return (
    <g className="tf-floor-grid" aria-hidden>
      <defs>
        <pattern id="tf-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0 L0 0 0 40" fill="none" className="tf-grid-line" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect x="0" y={FLOOR_GRID_TOP_Y} width="1200" height={FLOOR_GRID_HEIGHT} fill="url(#tf-grid)" opacity="0.32" />
    </g>
  );
}
