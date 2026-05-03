"use client";

import React from "react";
import { RunSnapshot } from "../../lib/types";

type Props = {
  runs: RunSnapshot[];
  value: string | null;
  onChange: (runId: string | null) => void;
  disabled?: boolean;
  /** Shorter option text for compact HUD (ticker + id only). */
  compactOptions?: boolean;
};

export function RunPicker({ runs, value, onChange, disabled, compactOptions }: Props) {
  return (
    <label className={`tf-run-picker${compactOptions ? " tf-run-picker--compact" : ""}`}>
      <span className="muted tf-run-picker-label">Run</span>
      <select
        className="tf-run-picker-select"
        aria-label="Select workflow run"
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value || null)}
      >
        <option value="">Select…</option>
        {runs.map((r) => (
          <option key={r.run_id} value={r.run_id}>
            {compactOptions
              ? `${r.run_id.slice(0, 8)} · ${r.request.ticker}`
              : `${r.run_id.slice(0, 8)} · ${r.request.ticker} · ${r.status}`}
          </option>
        ))}
      </select>
    </label>
  );
}
