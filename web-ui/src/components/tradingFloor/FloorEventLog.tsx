"use client";

import React, { useEffect, useRef } from "react";

type Props = {
  lines: string[];
};

/** Vertical activity log (same lines as HUD ticker); auto-scrolls to latest at bottom. */
export function FloorEventLog({ lines }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [lines]);

  const rows = lines.length ? lines.slice(-120) : [];

  return (
    <section className="tf-event-log card" aria-label="Run activity log">
      <header className="tf-event-log-head muted">Event log</header>
      <div
        ref={scrollRef}
        className="tf-event-log-body"
        tabIndex={0}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        {rows.length === 0 ? (
          <div className="muted tf-event-log-empty">No activity yet.</div>
        ) : (
          rows.map((line, i) => (
            <div key={`${i}-${line.slice(0, 24)}`} className="tf-event-log-line mono">
              {line}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
