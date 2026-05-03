"use client";

import React, { useMemo, useState } from "react";
import { ANALYST_SELECT_OPTIONS } from "../lib/agentRegistry";
import { FrontendOptions, RunCreateRequest } from "../lib/types";

type Props = {
  options: FrontendOptions | null;
  onStart: (payload: RunCreateRequest) => Promise<void> | void;
  disabled?: boolean;
};

const ANALYST_ICONS: Record<string, string> = {
  market: "📈",
  social: "💬",
  news: "📰",
  fundamentals: "🏦"
};

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function RunForm({ options, onStart, disabled }: Props) {
  const [ticker, setTicker] = useState("MSFT");
  const [analysisDate, setAnalysisDate] = useState(todayIsoDate());
  const [llmProvider, setLlmProvider] = useState("openai");
  const [deepModel, setDeepModel] = useState("gpt-5.4");
  const [quickModel, setQuickModel] = useState("gpt-5.4-mini");
  const [customDeepModel, setCustomDeepModel] = useState("");
  const [customQuickModel, setCustomQuickModel] = useState("");
  const [researchDepth, setResearchDepth] = useState(1);
  const [outputLanguage, setOutputLanguage] = useState("English");
  const [checkpointEnabled, setCheckpointEnabled] = useState(false);
  const [analysts, setAnalysts] = useState<string[]>(["market", "social", "news", "fundamentals"]);

  const providerModels = options?.models?.[llmProvider] ?? { quick: [], deep: [] };
  const quickUsesCustom = quickModel === "custom";
  const deepUsesCustom = deepModel === "custom";

  const resolvedQuickModel = quickUsesCustom ? customQuickModel.trim() : quickModel;
  const resolvedDeepModel = deepUsesCustom ? customDeepModel.trim() : deepModel;

  const payload = useMemo<RunCreateRequest>(
    () => ({
      ticker: ticker.trim().toUpperCase(),
      analysis_date: analysisDate,
      analysts,
      llm_provider: llmProvider,
      deep_model: resolvedDeepModel || undefined,
      quick_model: resolvedQuickModel || undefined,
      research_depth: researchDepth,
      output_language: outputLanguage,
      checkpoint_enabled: checkpointEnabled
    }),
    [ticker, analysisDate, analysts, llmProvider, resolvedDeepModel, resolvedQuickModel, researchDepth, outputLanguage, checkpointEnabled]
  );

  const allAnalystOptions = options?.analysts ?? ANALYST_SELECT_OPTIONS;

  return (
    <div className="card">
      <h3 className="section-title">Start Analysis</h3>
      <div style={{ display: "grid", gap: 8 }}>
        <label>
          <div className="muted">Ticker</div>
          <input value={ticker} onChange={(e) => setTicker(e.target.value)} />
        </label>
        <label>
          <div className="muted">Analysis Date</div>
          <input type="date" value={analysisDate} onChange={(e) => setAnalysisDate(e.target.value)} />
        </label>
        <label>
          <div className="muted">Provider</div>
          <select
            value={llmProvider}
            onChange={(e) => {
              const nextProvider = e.target.value;
              setLlmProvider(nextProvider);
              const nextModels = options?.models?.[nextProvider];
              setQuickModel(nextModels?.quick?.[0]?.value ?? "");
              setDeepModel(nextModels?.deep?.[0]?.value ?? "");
              setCustomQuickModel("");
              setCustomDeepModel("");
            }}
          >
            {(options?.providers ?? [{ label: "OpenAI", value: "openai" }]).map((provider) => (
              <option key={provider.value} value={provider.value}>
                {provider.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <div className="muted">Deep Model</div>
          {providerModels.deep.length > 0 ? (
            <select value={deepModel} onChange={(e) => setDeepModel(e.target.value)}>
              {providerModels.deep.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
          ) : (
            <input value={deepModel} onChange={(e) => setDeepModel(e.target.value)} placeholder="model id" />
          )}
        </label>
        {deepUsesCustom && (
          <label>
            <div className="muted">Custom Deep Model ID</div>
            <input value={customDeepModel} onChange={(e) => setCustomDeepModel(e.target.value)} placeholder="provider/model-id" />
          </label>
        )}
        <label>
          <div className="muted">Quick Model</div>
          {providerModels.quick.length > 0 ? (
            <select value={quickModel} onChange={(e) => setQuickModel(e.target.value)}>
              {providerModels.quick.map((model) => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
          ) : (
            <input value={quickModel} onChange={(e) => setQuickModel(e.target.value)} placeholder="model id" />
          )}
        </label>
        {quickUsesCustom && (
          <label>
            <div className="muted">Custom Quick Model ID</div>
            <input value={customQuickModel} onChange={(e) => setCustomQuickModel(e.target.value)} placeholder="provider/model-id" />
          </label>
        )}
        <label>
          <div className="muted">Research Depth</div>
          <select value={researchDepth} onChange={(e) => setResearchDepth(Number(e.target.value))}>
            {(options?.research_depths ?? [{ label: "Shallow", value: 1 }]).map((depth) => (
              <option key={depth.value} value={depth.value}>
                {depth.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <div className="muted">Output Language</div>
          <select value={outputLanguage} onChange={(e) => setOutputLanguage(e.target.value)}>
            {(options?.output_languages ?? ["English"]).map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={checkpointEnabled}
            onChange={(e) => setCheckpointEnabled(e.target.checked)}
            style={{ width: "auto" }}
          />
          <span className="muted">Enable checkpointing</span>
        </label>

        <div>
          <div className="muted">Analysts</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 4 }}>
            {allAnalystOptions.map((item) => {
              const selected = analysts.includes(item.key);
              return (
                <button
                  key={item.key}
                  type="button"
                  className={selected ? "" : "secondary"}
                  style={{
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 8px",
                    minHeight: 0,
                    borderColor: selected ? "#3b82f6" : "#475569",
                    background: selected ? "#1d4ed8" : "#0b1220"
                  }}
                  onClick={() => {
                    setAnalysts((prev) => {
                      if (prev.includes(item.key)) {
                        const next = prev.filter((x) => x !== item.key);
                        return next.length > 0 ? next : prev;
                      }
                      return [...prev, item.key];
                    });
                  }}
                >
                  <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }} aria-hidden>
                    {ANALYST_ICONS[item.key] ?? "🤖"}
                  </span>
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: 12,
                      lineHeight: 1.25,
                      textAlign: "left"
                    }}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
          {analysts.length === 0 && <div className="muted">Select at least one analyst.</div>}
        </div>

        <button
          disabled={disabled || analysts.length === 0 || !resolvedDeepModel || !resolvedQuickModel}
          onClick={() => onStart(payload)}
        >
          Start Run
        </button>
      </div>
    </div>
  );
}

