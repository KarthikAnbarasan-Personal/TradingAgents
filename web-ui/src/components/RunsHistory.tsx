"use client";

import React from "react";
import { RunSnapshot, SavedReportListItem } from "../lib/types";

type Props = {
  runs: RunSnapshot[];
  savedReports: SavedReportListItem[];
  selectedRunId: string | null;
  selectedSavedReportId: string | null;
  /** When true, lists use available height (e.g. Run history page) instead of capped scroll areas. */
  expandLists?: boolean;
  onSelect: (runId: string) => void;
  onSelectSavedReport: (reportId: string) => void;
};

export function RunsHistory({
  runs,
  savedReports,
  selectedRunId,
  selectedSavedReportId,
  expandLists = false,
  onSelect,
  onSelectSavedReport
}: Props) {
  const listStyle = expandLists
    ? { display: "grid" as const, gap: 6, flex: 1, minHeight: 0, overflow: "auto" as const }
    : { display: "grid" as const, gap: 6, maxHeight: 250, overflow: "auto" as const };
  const savedStyle = expandLists
    ? { display: "grid" as const, gap: 6, flex: 1, minHeight: 0, overflow: "auto" as const }
    : { display: "grid" as const, gap: 6, maxHeight: 220, overflow: "auto" as const };
  return (
    <div
      className="card"
      style={
        expandLists
          ? { flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }
          : undefined
      }
    >
      <h3 className="section-title" style={{ flexShrink: 0 }}>
        Run History
      </h3>
      {runs.length === 0 ? (
        <div className="muted">No runs yet.</div>
      ) : (
        <div className="runs-history-scroll" style={listStyle}>
          {runs.map((run) => (
            <button
              key={run.run_id}
              className={selectedRunId === run.run_id ? "" : "secondary"}
              style={{ textAlign: "left" }}
              onClick={() => onSelect(run.run_id)}
            >
              <div className="mono">{run.run_id.slice(0, 8)}</div>
              <div className="muted">
                {run.request.ticker} • {run.status}
              </div>
            </button>
          ))}
        </div>
      )}

      <h3 className="section-title" style={{ marginTop: expandLists ? 12 : 16, flexShrink: 0 }}>
        Saved Reports
      </h3>
      {savedReports.length === 0 ? (
        <div className="muted">No saved reports in `reports/` yet.</div>
      ) : (
        <div className="runs-history-scroll" style={savedStyle}>
          {savedReports.map((item) => (
            <button
              key={item.report_id}
              className={selectedSavedReportId === item.report_id ? "" : "secondary"}
              style={{ textAlign: "left" }}
              onClick={() => onSelectSavedReport(item.report_id)}
            >
              <div className="mono">{item.report_id}</div>
              <div className="muted">{new Date(item.updated_at * 1000).toLocaleString()}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

