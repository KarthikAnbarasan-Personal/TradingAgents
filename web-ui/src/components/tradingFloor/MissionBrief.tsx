"use client";

import React from "react";
import { cancelRun, createRun } from "../../lib/api";
import { FrontendOptions, RunCreateRequest } from "../../lib/types";
import { RunForm } from "../RunForm";

type Props = {
  options: FrontendOptions | null;
  activeRunId: string | null;
  canCancelRun: boolean;
  busy: boolean;
  onBusy: (v: boolean) => void;
  onError: (msg: string | null) => void;
  onRunStarted: (runId: string) => void;
};

export function MissionBrief({
  options,
  activeRunId,
  canCancelRun,
  busy,
  onBusy,
  onError,
  onRunStarted
}: Props) {
  async function handleStart(payload: RunCreateRequest) {
    onBusy(true);
    onError(null);
    try {
      const { run_id } = await createRun(payload);
      onRunStarted(run_id);
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    } finally {
      onBusy(false);
    }
  }

  async function handleCancel() {
    if (!activeRunId) return;
    onBusy(true);
    onError(null);
    try {
      await cancelRun(activeRunId);
    } catch (e) {
      onError(e instanceof Error ? e.message : String(e));
    } finally {
      onBusy(false);
    }
  }

  return (
    <details className="tf-mission card" open>
      <summary className="tf-mission-summary">
        <span className="section-title" style={{ display: "inline", margin: 0 }}>
          Mission brief
        </span>
        <span className="muted" style={{ fontSize: 12, fontWeight: 400 }}>
          Start or cancel a workflow from the floor
        </span>
      </summary>
      <div className="tf-mission-body">
        <RunForm options={options} onStart={handleStart} disabled={busy} />
        <div className="tf-mission-actions">
          <button
            type="button"
            className="secondary"
            disabled={!canCancelRun || !activeRunId || busy}
            onClick={() => void handleCancel()}
            title={canCancelRun ? "Request cancellation" : "Run is not cancellable"}
          >
            Cancel current run
          </button>
        </div>
      </div>
    </details>
  );
}
