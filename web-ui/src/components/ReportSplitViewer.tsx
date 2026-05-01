"use client";

import React, { useEffect, useMemo, useState } from "react";
import { formatSectionFileLabel, groupSectionPaths } from "../lib/reportSections";
import { RunReport } from "../lib/types";
import { ResearchPaperProse } from "./ResearchPaperProse";

const FULL_REPORT_KEY = "__full__";

function IconCompleteReport() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round" />
    </svg>
  );
}

/** Indicates agent-generated outputs for a section group. */
function IconAgentOutputs() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 3l1.5 3 3.5.5-2.5 2.5.6 3.5L12 11.5 8.9 12.5l.6-3.5L7 6.5l3.5-.5L12 3z" strokeLinejoin="round" />
      <path d="M6 20h12M9 16v4M15 16v4M10 14h4" strokeLinecap="round" />
    </svg>
  );
}

type Props = {
  report: RunReport | null;
};

export function ReportSplitViewer({ report }: Props) {
  const sectionGroups = useMemo(
    () => groupSectionPaths(Object.keys(report?.sections ?? {})),
    [report?.sections]
  );

  const [activeKey, setActiveKey] = useState<string>(FULL_REPORT_KEY);

  useEffect(() => {
    if (!report) {
      setActiveKey(FULL_REPORT_KEY);
      return;
    }
    setActiveKey(FULL_REPORT_KEY);
  }, [report?.run_id, report?.complete_report_path, report?.title]);

  const activeMarkdown = useMemo(() => {
    if (!report) return "";
    if (activeKey === FULL_REPORT_KEY) return report.complete_report_markdown;
    return report.sections[activeKey] ?? "";
  }, [report, activeKey]);

  if (!report) {
    return (
      <div className="card report-split-card">
        <h3 className="section-title">Report</h3>
        <div className="muted">Select a run or saved report to view sections.</div>
      </div>
    );
  }

  return (
    <div className="card report-split-card">
      <div className="report-split">
        <nav className="report-split-nav" aria-label="Report sections">
          <div className="report-split-nav-title">Sections</div>
          <ul className="report-split-nav-list">
            <li>
              <button
                type="button"
                className={`report-split-nav-item report-split-nav-item--complete ${activeKey === FULL_REPORT_KEY ? "is-active" : ""}`}
                onClick={() => setActiveKey(FULL_REPORT_KEY)}
              >
                <span className="report-split-nav-item-leading" aria-hidden>
                  <IconCompleteReport />
                </span>
                <span className="report-split-nav-item-text">
                  <span className="report-split-nav-item-label">Complete report</span>
                  <span className="report-split-nav-item-hint">All sections combined</span>
                </span>
              </button>
            </li>
            {sectionGroups.map((group) => (
              <li key={group.folderKey} className="report-split-nav-group" role="group" aria-label={group.title}>
                <div className="report-split-nav-group-head">
                  <span className="report-split-nav-group-icon" title="Agent-generated">
                    <IconAgentOutputs />
                  </span>
                  <span className="report-split-nav-group-title">{group.title}</span>
                  <span className="report-split-nav-group-badge muted">Agents</span>
                </div>
                <ul className="report-split-nav-group-list">
                  {group.paths.map((key) => (
                    <li key={key}>
                      <button
                        type="button"
                        className={`report-split-nav-item report-split-nav-item--nested ${activeKey === key ? "is-active" : ""}`}
                        onClick={() => setActiveKey(key)}
                      >
                        <span className="report-split-nav-item-text">
                          <span className="report-split-nav-item-label">{formatSectionFileLabel(key)}</span>
                          <span className="report-split-nav-item-hint mono">{key}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </nav>

        <div className="report-split-main">
          {activeMarkdown.trim() ? (
            <div className="research-paper-sheet research-paper-sheet--split">
              <ResearchPaperProse markdown={activeMarkdown} />
            </div>
          ) : (
            <div className="report-split-empty muted">No content for this section.</div>
          )}
        </div>
      </div>
    </div>
  );
}
