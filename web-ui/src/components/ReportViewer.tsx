"use client";

import React, { useState } from "react";
import { downloadReportPdf } from "../lib/api";
import { RunReport } from "../lib/types";
import { ResearchPaperProse } from "./ResearchPaperProse";

type Props = {
  report: RunReport | null;
  /**
   * paper: serif “research paper” layout with rendered markdown.
   * pre: legacy monospace raw markdown.
   */
  presentation?: "paper" | "pre";
  /** Shown on the right of the Report heading (e.g. save action). */
  headerActions?: React.ReactNode;
  /** Called when server-side PDF export fails (e.g. API down). */
  onPdfExportError?: (message: string) => void;
};

export function ReportViewer({ report, presentation = "pre", headerActions, onPdfExportError }: Props) {
  const isPaper = presentation === "paper";
  const [pdfBusy, setPdfBusy] = useState(false);

  async function handleExportPdf() {
    if (!report?.complete_report_markdown?.trim()) return;
    setPdfBusy(true);
    try {
      const title = report.title?.trim() || report.run_id || "Report";
      const stem = `${title}_report`;
      await downloadReportPdf(report.complete_report_markdown, title, stem);
    } catch (err) {
      onPdfExportError?.(err instanceof Error ? err.message : String(err));
    } finally {
      setPdfBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="report-viewer-heading">
        <h3 className="section-title report-viewer-heading-title">Report</h3>
        {report || headerActions ? (
          <div className="report-viewer-heading-actions">
            {report ? (
              <button
                type="button"
                className="secondary"
                disabled={pdfBusy || !report.complete_report_markdown?.trim()}
                title="Download the full report as a PDF (built on the API from Markdown)"
                onClick={() => void handleExportPdf()}
              >
                {pdfBusy ? "Preparing PDF…" : "Export PDF"}
              </button>
            ) : null}
            {headerActions}
          </div>
        ) : null}
      </div>
      {!report ? (
        <div className="muted">Report will appear when the run completes.</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {report.title && (
            <div className={isPaper ? "report-viewer-meta paper-meta" : ""} style={{ fontWeight: 600 }}>
              {report.title}
            </div>
          )}
          <div className={`muted mono ${isPaper ? "report-path-paper" : ""}`}>{report.complete_report_path}</div>

          {isPaper ? (
            <div className="research-paper-sheet">
              <ResearchPaperProse markdown={report.complete_report_markdown} />
            </div>
          ) : (
            <pre style={{ whiteSpace: "pre-wrap", overflow: "auto", maxHeight: 380 }} className="mono">
              {report.complete_report_markdown}
            </pre>
          )}

          <details className="report-sections-details">
            <summary>Section files</summary>
            <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
              {Object.entries(report.sections).map(([name, content]) => (
                <div key={name} className="report-section-block">
                  <div className="muted mono report-section-name">{name}</div>
                  {isPaper ? (
                    <div className="research-paper-sheet research-paper-sheet--compact">
                      <ResearchPaperProse markdown={content} />
                    </div>
                  ) : (
                    <pre style={{ whiteSpace: "pre-wrap", maxHeight: 200, overflow: "auto" }} className="mono">
                      {content}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
