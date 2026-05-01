"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { ReportSplitViewer } from "../../components/ReportSplitViewer";
import { RunsHistory } from "../../components/RunsHistory";
import { RunStatsInfoButton } from "../../components/RunStatsInfoButton";
import { cancelRun, getRun, getRunReport, getSavedReport, listRuns, listSavedReports } from "../../lib/api";
import { RunReport, RunSnapshot, SavedReportListItem } from "../../lib/types";

export default function HistoryPage() {
  const [runs, setRuns] = useState<RunSnapshot[]>([]);
  const [savedReports, setSavedReports] = useState<SavedReportListItem[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [selectedSavedReportId, setSelectedSavedReportId] = useState<string | null>(null);
  const [selectedRun, setSelectedRun] = useState<RunSnapshot | null>(null);
  const [report, setReport] = useState<RunReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refreshRuns() {
    const data = await listRuns();
    setRuns(data);
  }

  async function refreshSavedReports() {
    const data = await listSavedReports();
    setSavedReports(data);
  }

  async function loadRun(runId: string) {
    const run = await getRun(runId);
    setSelectedRun(run);
    if (run.complete_report_path) {
      try {
        setReport(await getRunReport(runId));
      } catch {
        setReport(null);
      }
    } else {
      setReport(null);
    }
  }

  useEffect(() => {
    void Promise.all([refreshRuns(), refreshSavedReports()]).catch((err) =>
      setError(err instanceof Error ? err.message : String(err))
    );
    const id = setInterval(() => {
      void refreshRuns().catch(() => undefined);
      if (selectedRunId) {
        void loadRun(selectedRunId).catch(() => undefined);
      }
    }, 5000);
    return () => clearInterval(id);
  }, [selectedRunId]);

  return (
    <div className="dashboard history-page">
      <aside className="dashboard-left" aria-label="Run history lists">
        <header className="dashboard-left-header">
          <h1>Run history</h1>
          <p className="muted">
            Browse API runs and reports saved under <span className="mono">reports/</span>.{" "}
            <Link href="/" style={{ color: "#93c5fd" }}>
              Home
            </Link>{" "}
            for live analysis and streaming.
          </p>
        </header>
        {error && (
          <div className="card" style={{ borderColor: "#ef4444", color: "#fecaca", fontSize: 13 }}>
            {error}
          </div>
        )}
        <div className="dashboard-left-body history-left-body">
          <RunsHistory
            runs={runs}
            savedReports={savedReports}
            selectedRunId={selectedRunId}
            selectedSavedReportId={selectedSavedReportId}
            expandLists
            onSelect={(runId) => {
              setSelectedRunId(runId);
              setSelectedSavedReportId(null);
              void loadRun(runId).catch((err) => setError(err instanceof Error ? err.message : String(err)));
            }}
            onSelectSavedReport={(reportId) => {
              setSelectedSavedReportId(reportId);
              setSelectedRunId(null);
              setSelectedRun(null);
              void getSavedReport(reportId)
                .then((loaded) => setReport(loaded))
                .catch((err) => setError(err instanceof Error ? err.message : String(err)));
            }}
          />
          <div className="card">
            <h3 className="section-title">Actions</h3>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                className="secondary"
                disabled={!selectedRunId}
                onClick={() => {
                  if (!selectedRunId) return;
                  void cancelRun(selectedRunId)
                    .then(() => refreshRuns())
                    .catch((err) => setError(err instanceof Error ? err.message : String(err)));
                }}
              >
                Cancel selected run
              </button>
              <button
                className="secondary"
                onClick={() => {
                  void refreshRuns();
                  void refreshSavedReports();
                }}
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </aside>

      <section className="dashboard-right" aria-label="Selected report">
        <header className="dashboard-right-header history-report-header">
          <div className="history-report-header-row">
            <div>
              <h2>Report detail</h2>
              <p className="muted">Choose a section in the report panel to render only that part, or open the complete report.</p>
            </div>
            <RunStatsInfoButton run={selectedRun} />
          </div>
        </header>
        <div className="dashboard-right-body">
          <ReportSplitViewer report={report} />
        </div>
      </section>
    </div>
  );
}
