"use client";

import React from "react";
import { RunSnapshot } from "../../lib/types";
import { RunStatsFields } from "../StatsBar";

type Props = {
  snapshot: RunSnapshot | null;
  layout?: "grid" | "inline";
};

export function HudStatsStrip({ snapshot, layout = "grid" }: Props) {
  if (layout === "inline") {
    return (
      <div className="tf-hud-stats tf-hud-stats--inline">
        <RunStatsFields run={snapshot} layout="inline" />
      </div>
    );
  }
  return (
    <div className="tf-hud-stats card">
      <RunStatsFields run={snapshot} layout="grid" />
    </div>
  );
}
