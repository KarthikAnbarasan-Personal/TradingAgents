"use client";

import React from "react";
import { RunSnapshot } from "../../lib/types";

type Props = {
  snapshot: RunSnapshot | null;
  mode: "live" | "replay";
  tickerLines: string[];
  /** When false, banner only (ticker shown elsewhere, e.g. floor side rail). */
  showInlineTicker?: boolean;
};

function bannerLabel(snapshot: RunSnapshot | null, mode: "live" | "replay"): string {
  const st = snapshot?.status;
  if (mode === "live") {
    if (st === "running") return "LIVE";
    if (st === "queued") return "QUEUED";
    return st ? String(st).replace(/_/g, " ").toUpperCase() : "LIVE";
  }
  const tail = st ? ` · ${String(st).replace(/_/g, " ").toUpperCase()}` : "";
  return `REPLAY${tail}`;
}

export function HudTopBar({ snapshot, mode, tickerLines, showInlineTicker = true }: Props) {
  const status = snapshot?.status ?? "—";
  const tickerText = tickerLines.slice(-12).join(" · ") || "Awaiting activity…";
  const led = bannerLabel(snapshot, mode);

  return (
    <div className="tf-hud-top">
      <div className="tf-hud-banner">
        <span className={`tf-hud-mode tf-hud-mode--${mode}`}>{led}</span>
        <span className="tf-hud-run mono">{snapshot?.run_id?.slice(0, 8) ?? "—"}</span>
        <span className="tf-hud-ticker">{snapshot?.request?.ticker ?? "—"}</span>
        <span className="tf-hud-status muted">Run: {status}</span>
      </div>
      {showInlineTicker && (
        <div className="tf-hud-ticker-wrap" aria-live="polite">
          <div className="tf-hud-ticker-track">
            <div className="tf-hud-ticker-inner">
              <span>{tickerText}</span>
              <span className="tf-hud-ticker-dup" aria-hidden>
                {" "}
                · {tickerText}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
