"use client";

import React from "react";

type Props = {
  agentStatus: Record<string, string>;
};

function statusColor(status: string): string {
  if (status === "completed") return "#10b981";
  if (status === "in_progress") return "#3b82f6";
  if (status === "failed") return "#ef4444";
  if (status === "cancelled") return "#f59e0b";
  return "#64748b";
}

export function WorkflowBoard({ agentStatus }: Props) {
  const entries = Object.entries(agentStatus);
  return (
    <div className="card">
      <h3 className="section-title">Workflow Status</h3>
      {entries.length === 0 ? (
        <div className="muted">No workflow state yet.</div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {entries.map(([agent, status]) => (
            <div
              key={agent}
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}
            >
              <span>{agent}</span>
              <span className="status-pill mono" style={{ borderColor: statusColor(status), color: statusColor(status) }}>
                {status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

