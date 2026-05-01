"use client";

import React, { useRef } from "react";
import { RunSnapshot } from "../lib/types";
import { RunStatsFields } from "./StatsBar";

type Props = {
  run: RunSnapshot | null;
};

function InfoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
    </svg>
  );
}

export function RunStatsInfoButton({ run }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        className="run-stats-info-btn"
        aria-label="Open run statistics"
        title="Run statistics"
        onClick={() => dialogRef.current?.showModal()}
      >
        <InfoIcon />
      </button>
      <dialog
        ref={dialogRef}
        className="run-stats-dialog"
        aria-labelledby="run-stats-dialog-title"
        onClick={(e) => {
          if (e.target === dialogRef.current) dialogRef.current.close();
        }}
      >
        <div className="run-stats-dialog-inner card" onClick={(e) => e.stopPropagation()}>
          <div className="run-stats-dialog-header">
            <h3 id="run-stats-dialog-title" className="section-title" style={{ margin: 0 }}>
              Run statistics
            </h3>
            <button type="button" className="secondary" onClick={() => dialogRef.current?.close()}>
              Close
            </button>
          </div>
          <RunStatsFields run={run} />
        </div>
      </dialog>
    </>
  );
}
