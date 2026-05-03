"use client";

import React, { useEffect, useMemo, useState } from "react";
import { SCENE_HEADER_PX } from "../../lib/tradingFloorLayout";

const ZONES = [
  { label: "IST", timeZone: "Asia/Kolkata" },
  { label: "Dubai", timeZone: "Asia/Dubai" },
  { label: "UK", timeZone: "Europe/London" },
  { label: "US", timeZone: "America/New_York" }
] as const;

function formatTime(d: Date, timeZone: string): string {
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone
  });
}

/** Hour (0–23), minute, second in `timeZone` for hand geometry. */
function getHmsInZone(now: Date, timeZone: string): { h: number; m: number; s: number } {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false
  });
  const parts = fmt.formatToParts(now);
  const n = (t: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return { h: n("hour"), m: n("minute"), s: n("second") };
}

/** Radians for SVG hands; 12 o’clock = −π/2. */
function handAngles(h: number, m: number, s: number) {
  const h12 = h % 12;
  const hour = ((h12 + m / 60 + s / 3600) / 12) * 2 * Math.PI - Math.PI / 2;
  const minute = ((m + s / 60) / 60) * 2 * Math.PI - Math.PI / 2;
  const second = (s / 60) * 2 * Math.PI - Math.PI / 2;
  return { hour, minute, second };
}

const DIAL_R = 36;
/** Zone label sits above the dial with clear vertical separation. */
const LABEL_BASELINE_Y = 16;
/** Center of analog face (below label). */
const DIAL_CY = 58;
const DIGITAL_Y = DIAL_CY + DIAL_R + 18;

function handLine(cx: number, cy: number, angle: number, len: number) {
  return {
    x2: cx + len * Math.cos(angle),
    y2: cy + len * Math.sin(angle)
  };
}

/** Analog face + hands; digital time on its own row below. */
function WorldClock({ label, timeZone, now }: { label: string; timeZone: string; now: Date }) {
  const { h, m, s } = useMemo(() => getHmsInZone(now, timeZone), [now, timeZone]);
  const { hour, minute, second } = useMemo(() => handAngles(h, m, s), [h, m, s]);
  const digital = formatTime(now, timeZone);
  const cx = 0;
  const cy = DIAL_CY;

  const ticks = Array.from({ length: 12 }, (_, i) => {
    const ang = (i / 12) * 2 * Math.PI - Math.PI / 2;
    const r0 = DIAL_R - 6;
    const r1 = DIAL_R - 1;
    return (
      <line
        key={i}
        x1={cx + r0 * Math.cos(ang)}
        y1={cy + r0 * Math.sin(ang)}
        x2={cx + r1 * Math.cos(ang)}
        y2={cy + r1 * Math.sin(ang)}
        className={i % 3 === 0 ? "tf-world-clock-tick tf-world-clock-tick--major" : "tf-world-clock-tick"}
      />
    );
  });

  const hh = handLine(cx, cy, hour, Math.round(DIAL_R * 0.38));
  const mh = handLine(cx, cy, minute, Math.round(DIAL_R * 0.62));
  const sh = handLine(cx, cy, second, Math.round(DIAL_R * 0.72));

  return (
    <g className="tf-world-clock" aria-label={`${label} ${digital}`}>
      <text x="0" y={LABEL_BASELINE_Y} textAnchor="middle" className="tf-world-clock-label">
        {label}
      </text>
      <circle cx={cx} cy={cy} r={DIAL_R} className="tf-world-clock-dial" />
      {ticks}
      <line x1={cx} y1={cy} x2={hh.x2} y2={hh.y2} className="tf-world-clock-hand tf-world-clock-hand--hour" />
      <line x1={cx} y1={cy} x2={mh.x2} y2={mh.y2} className="tf-world-clock-hand tf-world-clock-hand--minute" />
      <line x1={cx} y1={cy} x2={sh.x2} y2={sh.y2} className="tf-world-clock-hand tf-world-clock-hand--second" />
      <circle cx={cx} cy={cy} r={2.8} className="tf-world-clock-cap" />
      <text x="0" y={DIGITAL_Y} textAnchor="middle" className="tf-world-clock-time mono">
        {digital}
      </text>
    </g>
  );
}

const SCENE_W = 1200;

/** Top bar: four analog world clocks (height matches `SCENE_HEADER_PX` in layout). */
export function TradingRoomHeader() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const clockPitch = 176;
  const span = (ZONES.length - 1) * clockPitch;
  const firstClockCenterX = SCENE_W / 2 - span / 2;

  return (
    <g className="tf-room-header" aria-label="World clocks">
      <rect x="0" y="0" width={SCENE_W} height={SCENE_HEADER_PX} className="tf-room-header-bar" />
      {ZONES.map((z, i) => (
        <g key={z.timeZone} transform={`translate(${firstClockCenterX + i * clockPitch}, 4)`}>
          <WorldClock label={z.label} timeZone={z.timeZone} now={now} />
        </g>
      ))}
    </g>
  );
}
