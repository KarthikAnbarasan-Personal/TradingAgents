"use client";

import React from "react";

/** Small role icons (SVG paths) — vector stand‑ins for a richer “office” read. */
export function ZoneDecor({ bayId, x, y }: { bayId: string; x: number; y: number }) {
  return (
    <g className={`tf-zone-decor tf-zone-decor--${bayId}`} transform={`translate(${x},${y})`} aria-hidden>
      {bayId === "analysts" && (
        <g className="tf-zone-icon">
          <polyline
            points="-4,12 4,4 12,8 20,-2"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line x1="-6" y1="14" x2="22" y2="14" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
        </g>
      )}
      {bayId === "research" && (
        <g className="tf-zone-icon">
          <path
            d="M-10,-2 L10,-2 L10,14 L-10,14 Z M-6,2 L6,2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path d="M-2,-2 L-2,14" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
        </g>
      )}
      {bayId === "risk" && (
        <g className="tf-zone-icon">
          <line x1="0" y1="-6" x2="0" y2="16" stroke="currentColor" strokeWidth="2" />
          <path d="M-14,4 Q-14,-2 -8,-2 Q-2,-2 -2,4 L-2,12 Q-2,16 -8,16 Q-14,16 -14,10 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M14,4 Q14,-2 8,-2 Q2,-2 2,4 L2,12 Q2,16 8,16 Q14,16 14,10 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </g>
      )}
      {bayId === "portfolio" && (
        <g className="tf-zone-icon">
          <rect x="-12" y="6" width="8" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" rx="1" />
          <rect x="-2" y="2" width="8" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" rx="1" />
          <rect x="8" y="-2" width="8" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" rx="1" />
        </g>
      )}
      {bayId === "trading" && (
        <g className="tf-zone-icon">
          <circle cx="0" cy="6" r="14" fill="none" stroke="currentColor" strokeWidth="1.8" opacity="0.45" />
          <path
            d="M-10,6 L-4,0 L2,6 L8,0 L14,6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}
    </g>
  );
}
