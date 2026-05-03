"use client";

import dynamic from "next/dynamic";
import React from "react";

const TeamOrgChart = dynamic(
  () => import("../../components/team/TeamOrgChart").then((m) => ({ default: m.TeamOrgChart })),
  {
    ssr: false,
    loading: () => (
      <div
        className="team-org-shell"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: 0
        }}
      >
        <p className="muted">Loading organization chart…</p>
      </div>
    )
  }
);

export default function TeamPage() {
  return (
    <div className="tf-page tf-page--team-full">
      <TeamOrgChart />
    </div>
  );
}
