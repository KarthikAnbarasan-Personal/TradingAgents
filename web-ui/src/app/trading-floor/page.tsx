"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { OfficeScene } from "../../components/floor/OfficeScene";
import { DeskDrawer } from "../../components/tradingFloor/DeskDrawer";
import { FloorEventLog } from "../../components/tradingFloor/FloorEventLog";
import { HudStatsStrip } from "../../components/tradingFloor/HudStatsStrip";
import { HudTopBar } from "../../components/tradingFloor/HudTopBar";
import { MissionBrief } from "../../components/tradingFloor/MissionBrief";
import { ReplayBar } from "../../components/tradingFloor/ReplayBar";
import { RunPicker } from "../../components/tradingFloor/RunPicker";
import { getOptions, getRun, getRunEventsAll, listRuns } from "../../lib/api";
import { useHydratedLiveStream, useReplayStreamState } from "../../lib/hooks/useRunStream";
import { StreamDerivedState } from "../../lib/runStreamReducer";
import { FrontendOptions, RunEvent, RunSnapshot } from "../../lib/types";
import { normalizeAgentStatusMap } from "../../lib/agentRegistry";
import { normalizeDeskStatus } from "../../lib/tradingFloorLayout";
import { normalizeAgentStatus } from "../../lib/workflowMissionLayout";

function terminalStatus(st: RunSnapshot["status"]): boolean {
  return st === "completed" || st === "failed" || st === "cancelled" || st === "interrupted";
}

function mergeHudSnapshot(snapshot: RunSnapshot | null, stream: StreamDerivedState): RunSnapshot | null {
  if (!snapshot) return null;
  return {
    ...snapshot,
    stats: stream.stats,
    agent_status: { ...snapshot.agent_status, ...stream.agentStatus }
  };
}

export default function TradingFloorPage() {
  const [runs, setRuns] = useState<RunSnapshot[]>([]);
  const [runId, setRunId] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<RunSnapshot | null>(null);
  const [eventsAll, setEventsAll] = useState<RunEvent[]>([]);
  const [options, setOptions] = useState<FrontendOptions | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [drawerAgent, setDrawerAgent] = useState<string | null>(null);
  const [replayIndex, setReplayIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const bootstrapped = useRef(false);

  const isTerminal = snapshot ? terminalStatus(snapshot.status) : false;

  const sortedEvents = useMemo(
    () => [...eventsAll].sort((a, b) => a.seq - b.seq),
    [eventsAll]
  );

  const maxReplayIdx = Math.max(0, sortedEvents.length - 1);

  /** When persisted events load or grow after completion, jump scrubber to the latest event. */
  const replayTailKey = useMemo(() => {
    if (!sortedEvents.length) return "";
    const e = sortedEvents[sortedEvents.length - 1];
    return `${sortedEvents.length}:${e.seq}:${e.type}`;
  }, [sortedEvents]);

  useEffect(() => {
    void getOptions()
      .then(setOptions)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  useEffect(() => {
    void listRuns()
      .then((r) => {
        setRuns(r);
        if (!bootstrapped.current && r.length) {
          bootstrapped.current = true;
          const active = r.find((x) => x.status === "running" || x.status === "queued");
          setRunId(active?.run_id ?? r[0].run_id);
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
    const id = setInterval(() => {
      void listRuns().then(setRuns).catch(() => undefined);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setPlaying(false);
    setReplayIndex(0);
  }, [runId]);

  useEffect(() => {
    if (!runId) {
      setSnapshot(null);
      setEventsAll([]);
      return;
    }
    void getRun(runId)
      .then(setSnapshot)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
    void getRunEventsAll(runId)
      .then(setEventsAll)
      .catch(() => setEventsAll([]));
    const id = setInterval(() => {
      void getRun(runId).then(setSnapshot).catch(() => undefined);
    }, 4000);
    return () => clearInterval(id);
  }, [runId]);

  /** `events/all` is often empty or short mid-run; after completion the file fills. Refetch so replay + log match reality. */
  useEffect(() => {
    if (!runId || !snapshot || !terminalStatus(snapshot.status)) return;
    void getRunEventsAll(runId).then(setEventsAll).catch(() => undefined);
    const t = window.setTimeout(() => {
      void getRunEventsAll(runId).then(setEventsAll).catch(() => undefined);
    }, 1600);
    return () => clearTimeout(t);
  }, [runId, snapshot?.status]);

  useEffect(() => {
    if (!isTerminal || !sortedEvents.length || !runId) return;
    setReplayIndex(sortedEvents.length - 1);
  }, [isTerminal, runId, replayTailKey]);

  const replayUpToSeq = sortedEvents.length
    ? sortedEvents[Math.min(replayIndex, maxReplayIdx)]?.seq
    : undefined;

  const liveStream = useHydratedLiveStream(
    isTerminal ? null : runId,
    isTerminal ? null : snapshot,
    isTerminal ? null : eventsAll
  );

  const replayStream = useReplayStreamState(
    isTerminal ? snapshot : null,
    isTerminal ? eventsAll : [],
    isTerminal ? replayUpToSeq : undefined
  );

  const stream = isTerminal ? replayStream : liveStream;

  const hudSnapshot = mergeHudSnapshot(snapshot, stream);

  const agentStatus = useMemo(() => {
    const merged = { ...snapshot?.agent_status, ...stream.agentStatus };
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(merged)) {
      const canon = normalizeDeskStatus(String(v)) || String(v);
      out[k] = normalizeAgentStatus(canon);
    }
    return normalizeAgentStatusMap(out);
  }, [snapshot, stream.agentStatus]);

  useEffect(() => {
    if (!playing || !isTerminal || sortedEvents.length < 2) return;
    const base = 450;
    const t = setInterval(() => {
      setReplayIndex((i) => {
        if (i >= maxReplayIdx) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, base / speed);
    return () => clearInterval(t);
  }, [playing, isTerminal, sortedEvents.length, maxReplayIdx, speed]);

  const canCancel =
    !!snapshot &&
    !!runId &&
    (snapshot.status === "running" ||
      snapshot.status === "queued" ||
      snapshot.status === "cancel_requested");

  return (
    <div className="tf-page">
      {error && (
        <div className="card tf-alert" role="alert">
          {error}
        </div>
      )}
      <div className="tf-layout">
        <aside className="tf-rail" aria-label="Mission brief">
          <MissionBrief
            options={options}
            activeRunId={runId}
            canCancelRun={canCancel}
            busy={busy}
            onBusy={setBusy}
            onError={setError}
            onRunStarted={(id) => {
              bootstrapped.current = true;
              setRunId(id);
              void listRuns().then(setRuns).catch(() => undefined);
            }}
          />
        </aside>
        <div className="tf-main">
          <div className="tf-hud-row tf-hud-row--run-metrics">
            <div className="card tf-hud-run-card">
              <RunPicker runs={runs} value={runId} onChange={setRunId} compactOptions />
            </div>
            <div className="card tf-hud-metrics-card">
              <HudStatsStrip snapshot={hudSnapshot} layout="inline" />
            </div>
          </div>
          <HudTopBar
            snapshot={snapshot}
            mode={isTerminal ? "replay" : "live"}
            tickerLines={stream.ticker}
            showInlineTicker={false}
          />
          <div className="tf-body-split">
            <div className="tf-body-split-visual">
              <div className="tf-scene-host">
                <OfficeScene
                  agentStatus={agentStatus}
                  onDeskSelect={(agent) => {
                    setDrawerAgent(agent);
                  }}
                />
              </div>
            </div>
            <aside className="tf-body-split-rail" aria-label="Activity and controls">
              <FloorEventLog lines={stream.ticker} />
              {isTerminal && sortedEvents.length > 0 ? (
                <ReplayBar
                  compact
                  disabled={false}
                  eventCount={sortedEvents.length}
                  index={Math.min(replayIndex, maxReplayIdx)}
                  maxIndex={maxReplayIdx}
                  playing={playing}
                  speed={speed}
                  runId={runId}
                  onIndexChange={(i) => {
                    setReplayIndex(i);
                    setPlaying(false);
                  }}
                  onTogglePlay={() => setPlaying((p) => !p)}
                  onSpeedChange={setSpeed}
                />
              ) : (
                <div className="card tf-replay-placeholder muted" role="note">
                  Replay controls (play, step, scrub) appear when the run has finished and events are loaded.
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
      <DeskDrawer
        agent={drawerAgent}
        open={drawerAgent !== null}
        onClose={() => setDrawerAgent(null)}
        runId={runId}
        snapshot={snapshot}
        streamState={stream}
      />
    </div>
  );
}
