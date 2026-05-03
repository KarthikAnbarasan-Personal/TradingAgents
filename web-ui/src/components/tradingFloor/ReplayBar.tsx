"use client";

import Link from "next/link";
import React from "react";

type Props = {
  /** Narrow column: 2×3 control grid + speed row */
  compact?: boolean;
  disabled?: boolean;
  eventCount: number;
  index: number;
  maxIndex: number;
  playing: boolean;
  speed: number;
  onIndexChange: (index: number) => void;
  onTogglePlay: () => void;
  onSpeedChange: (speed: number) => void;
  /** When set, shows highlighted “Report” → run history with full report. */
  runId?: string | null;
};

export function ReplayBar({
  compact,
  disabled,
  eventCount,
  index,
  maxIndex,
  playing,
  speed,
  onIndexChange,
  onTogglePlay,
  onSpeedChange,
  runId
}: Props) {
  if (disabled || eventCount === 0) {
    return null;
  }

  const reportHref = runId ? `/history?run=${encodeURIComponent(runId)}` : null;

  if (compact) {
    return (
      <div className="tf-replay card tf-replay--compact" role="region" aria-label="Replay controls">
        <div className="tf-replay-grid">
          <button
            type="button"
            className="secondary"
            aria-label="Jump to first event"
            onClick={() => onIndexChange(0)}
            disabled={index <= 0}
          >
            ⏮
          </button>
          <button type="button" onClick={onTogglePlay} className={playing ? "tf-replay-pause" : "tf-replay-play"}>
            {playing ? "Pause" : "Play"}
          </button>
          <button
            type="button"
            className="secondary"
            aria-label="Jump to last event"
            onClick={() => onIndexChange(maxIndex)}
            disabled={index >= maxIndex}
          >
            ⏭
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => onIndexChange(Math.max(0, index - 1))}
            disabled={index <= 0}
          >
            Step −
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => onIndexChange(Math.min(maxIndex, index + 1))}
            disabled={index >= maxIndex}
          >
            Step +
          </button>
          {reportHref ? (
            <Link
              href={reportHref}
              className="tf-replay-open-report"
              prefetch={false}
              aria-label="View full report in run history"
            >
              Report
            </Link>
          ) : (
            <button type="button" className="tf-replay-open-report tf-replay-open-report--disabled" disabled>
              Report
            </button>
          )}
        </div>
        <label className="tf-replay-speed">
          <span className="muted">Speed</span>
          <select value={String(speed)} onChange={(e) => onSpeedChange(Number(e.target.value))} aria-label="Playback speed">
            <option value="0.5">0.5×</option>
            <option value="1">1×</option>
            <option value="2">2×</option>
            <option value="4">4×</option>
          </select>
        </label>
        <span className="mono muted tf-replay-pos">
          Event {index + 1} / {maxIndex + 1}
        </span>
        <input
          type="range"
          className="tf-replay-scrub"
          min={0}
          max={maxIndex}
          value={index}
          onChange={(e) => onIndexChange(Number(e.target.value))}
          aria-label="Scrub through run events"
        />
      </div>
    );
  }

  return (
    <div className="tf-replay card" role="region" aria-label="Replay controls">
      <div className="tf-replay-row">
        <button type="button" className="secondary" onClick={() => onIndexChange(0)} disabled={index <= 0}>
          ⏮
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => onIndexChange(Math.max(0, index - 1))}
          disabled={index <= 0}
        >
          Step −
        </button>
        <button type="button" onClick={onTogglePlay} className={playing ? "tf-replay-pause" : "tf-replay-play"}>
          {playing ? "Pause" : "Play"}
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => onIndexChange(Math.min(maxIndex, index + 1))}
          disabled={index >= maxIndex}
        >
          Step +
        </button>
        <button type="button" className="secondary" onClick={() => onIndexChange(maxIndex)} disabled={index >= maxIndex}>
          ⏭
        </button>
        {reportHref ? (
          <Link
            href={reportHref}
            className="tf-replay-open-report"
            prefetch={false}
            aria-label="View full report in run history"
          >
            Report
          </Link>
        ) : null}
        <label className="tf-replay-speed">
          <span className="muted">Speed</span>
          <select value={String(speed)} onChange={(e) => onSpeedChange(Number(e.target.value))} aria-label="Playback speed">
            <option value="0.5">0.5×</option>
            <option value="1">1×</option>
            <option value="2">2×</option>
            <option value="4">4×</option>
          </select>
        </label>
        <span className="mono muted tf-replay-pos">
          Event {index + 1} / {maxIndex + 1}
        </span>
      </div>
      <input
        type="range"
        className="tf-replay-scrub"
        min={0}
        max={maxIndex}
        value={index}
        onChange={(e) => onIndexChange(Number(e.target.value))}
        aria-label="Scrub through run events"
      />
    </div>
  );
}
