"use client";

import React, { useEffect, useRef, useState } from "react";
import { ActivityPanel } from "../components/ActivityPanel";
import { ReportViewer } from "../components/ReportViewer";
import { RunForm } from "../components/RunForm";
import { StatsBar } from "../components/StatsBar";
import { WorkflowMissionControl } from "../components/WorkflowMissionControl";
import {
  cancelRun,
  createRun,
  getOptions,
  getRun,
  getRunReport,
  openRunEvents,
  saveRunReportCopy
} from "../lib/api";
import { resolveAgentId } from "../lib/agentRegistry";
import { FrontendOptions, RunEvent, RunReport, RunSnapshot } from "../lib/types";

export default function HomePage() {
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [selectedRun, setSelectedRun] = useState<RunSnapshot | null>(null);
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [report, setReport] = useState<RunReport | null>(null);
  const [options, setOptions] = useState<FrontendOptions | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveBusy, setSaveBusy] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  async function loadRun(runId: string) {
    const run = await getRun(runId);
    setSelectedRun(run);
    if (run.complete_report_path) {
      try {
        const loadedReport = await getRunReport(runId);
        setReport(loadedReport);
      } catch {
        setReport(null);
      }
    } else {
      setReport(null);
    }
  }

  function connectEvents(runId: string) {
    eventSourceRef.current?.close();
    const eventSource = openRunEvents(
      runId,
      (event) => {
        setEvents((prev) => [...prev, event].slice(-400));
        if (event.type === "stats_updated") {
          setSelectedRun((prev) => {
            if (!prev) return prev;
            return { ...prev, stats: { ...prev.stats, ...event.data } };
          });
        }
        if (event.type === "agent_status_changed") {
          setSelectedRun((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              agent_status: {
                ...prev.agent_status,
                [resolveAgentId(String(event.data.agent))]: String(event.data.status)
              }
            };
          });
        }
        if (event.type === "run_completed") {
          void loadRun(runId);
        }
      },
      () => {
        // Keep snapshot polling as fallback if SSE reconnect fails.
      }
    );
    eventSourceRef.current = eventSource;
  }

  useEffect(() => {
    void getOptions()
      .then(setOptions)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  useEffect(() => {
    setSaveMessage(null);
  }, [selectedRunId]);

  useEffect(() => {
    if (!selectedRunId) return;
    const id = setInterval(() => {
      void loadRun(selectedRunId).catch(() => undefined);
    }, 4000);
    return () => clearInterval(id);
  }, [selectedRunId]);

  useEffect(() => {
    if (!selectedRunId) {
      eventSourceRef.current?.close();
      return;
    }
    setEvents([]);
    void loadRun(selectedRunId).catch((err) => setError(err instanceof Error ? err.message : String(err)));
    connectEvents(selectedRunId);
    return () => eventSourceRef.current?.close();
  }, [selectedRunId]);

  return (
    <div className="dashboard">
      <aside className="dashboard-left" aria-label="Analysis controls">
        {error && (
          <div className="card" style={{ borderColor: "#ef4444", color: "#fecaca", fontSize: 13 }}>
            {error}
          </div>
        )}
        <div className="dashboard-left-body">
          <RunForm
            options={options}
            disabled={busy}
            onStart={async (payload) => {
              try {
                setBusy(true);
                setError(null);
                const result = await createRun(payload);
                setSelectedRunId(result.run_id);
              } catch (err) {
                setError(err instanceof Error ? err.message : String(err));
              } finally {
                setBusy(false);
              }
            }}
          />
          <div className="card">
            <h3 className="section-title">Run controls</h3>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                className="secondary"
                disabled={!selectedRunId}
                onClick={() => {
                  if (!selectedRunId) return;
                  void cancelRun(selectedRunId).catch((err) => setError(err instanceof Error ? err.message : String(err)));
                }}
              >
                Cancel run
              </button>
              <button
                className="secondary"
                disabled={!selectedRunId}
                onClick={() => {
                  if (!selectedRunId) return;
                  void loadRun(selectedRunId).catch((err) => setError(err instanceof Error ? err.message : String(err)));
                }}
              >
                Refresh status
              </button>
            </div>
          </div>
        </div>
      </aside>

      <section className="dashboard-right dashboard-right--home" aria-label="Live run and reports">
        <header className="dashboard-right-header">
          <div>
            <h2>Live run &amp; reports</h2>
            <p className="muted">
              {selectedRunId
                ? "Workflow, activity stream, and report for the run you started on this page."
                : "Start an analysis to see live progress here."}
            </p>
          </div>
          <StatsBar run={selectedRun} />
        </header>
        <div className="dashboard-right-body dashboard-right-body--home">
          <WorkflowMissionControl agentStatus={selectedRun?.agent_status ?? {}} />
          <ActivityPanel events={events} />
          {saveMessage && (
            <div className="card" style={{ borderColor: "#22c55e", color: "#bbf7d0", fontSize: 13 }}>
              {saveMessage}
            </div>
          )}
          <ReportViewer
            report={report}
            onPdfExportError={(msg) => setError(msg)}
            headerActions={
              <button
                type="button"
                className="secondary"
                disabled={!selectedRun?.complete_report_path || saveBusy}
                title={
                  selectedRun?.complete_report_path
                    ? "Copy this run’s report files into the workspace reports/ folder"
                    : "Available when the run finishes"
                }
                onClick={() => {
                  if (!selectedRunId || !selectedRun?.complete_report_path) return;
                  setSaveMessage(null);
                  setSaveBusy(true);
                  void saveRunReportCopy(selectedRunId)
                    .then((res) => {
                      setSaveMessage(`Report saved to reports/${res.report_id} — ${res.path}`);
                    })
                    .catch((err) => setError(err instanceof Error ? err.message : String(err)))
                    .finally(() => setSaveBusy(false));
                }}
              >
                {saveBusy ? "Saving…" : "Save to reports folder"}
              </button>
            }
          />
          <p className="muted" style={{ margin: "-4px 0 0", fontSize: 12 }}>
            Finished runs already write under <span className="mono">reports/</span> automatically; use Save to make an
            extra copy with a new timestamp (e.g. for sharing).
          </p>
        </div>
      </section>
    </div>
  );
}
