import { Suspense } from "react";
import { HistoryPageClient } from "./HistoryPageClient";

export default function HistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="dashboard history-page" style={{ padding: 24 }}>
          <p className="muted">Loading run history…</p>
        </div>
      }
    >
      <HistoryPageClient />
    </Suspense>
  );
}
