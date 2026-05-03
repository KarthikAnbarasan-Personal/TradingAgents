"use client";

import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
  type Node
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import React, { useCallback, useEffect, useMemo } from "react";
import { AGENT_BY_ID } from "../../lib/agentRegistry";
import { MISSION_BAYS } from "../../lib/workflowMissionLayout";
import { OrgAgentNode, OrgRootNode, OrgWingNode, type OrgAgentNodeData, type OrgRootNodeData, type OrgWingNodeData } from "./orgChartNodes";

const WING_META: Record<
  string,
  { teamLabel: string; accent: string; border: string; bg: string }
> = {
  analysts: {
    teamLabel: "Team 1 · Insight",
    accent: "#38bdf8",
    border: "#0ea5e9",
    bg: "rgba(14, 165, 233, 0.1)"
  },
  research: {
    teamLabel: "Team 2 · Debate",
    accent: "#a78bfa",
    border: "#8b5cf6",
    bg: "rgba(139, 92, 246, 0.1)"
  },
  trading: {
    teamLabel: "Team 5 · Execution",
    accent: "#fbbf24",
    border: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.09)"
  },
  risk: {
    teamLabel: "Team 3 · Decision",
    accent: "#fb923c",
    border: "#ea580c",
    bg: "rgba(234, 88, 12, 0.09)"
  },
  portfolio: {
    teamLabel: "Team 4 · Allocation",
    accent: "#34d399",
    border: "#10b981",
    bg: "rgba(16, 185, 129, 0.1)"
  }
};

/** Match `.team-org-node--agent` width; vertical stride for compact multi-row stacks. */
const AGENT_W = 158;
const AGENT_ROW_H = 172;
const AGENT_H_GAP = 8;
const AGENT_V_GAP = 8;

const ROOT_W = 280;
/** Reserved vertical band for the root node (must ≥ rendered `.team-org-node--root` height). */
const ROOT_LAYOUT_H = 144;
const WING_W = 236;
/** Reserved band for wing cards (tag + title + wrapped subtitle). */
const WING_LAYOUT_H = 120;
const MARGIN_X = 18;
const COL_GAP = 10;
/** Clear gap between root (L1) and wing row (L2). */
const ROOT_TO_WING_GAP = 54;
/** Clear gap between wing row (L2) and agent grid (L3). */
const WING_TO_GRID = 32;

function agentGridWidth(agentCount: number): number {
  if (agentCount <= 1) return AGENT_W;
  return 2 * AGENT_W + AGENT_H_GAP;
}

/** 2-column grid under each wing; last short row centered. */
function agentCellPosition(
  idx: number,
  count: number,
  colLeft: number,
  colWidth: number,
  gridTop: number
): { x: number; y: number } {
  if (count === 1) {
    return { x: colLeft + (colWidth - AGENT_W) / 2, y: gridTop };
  }
  const cols = 2;
  const row = Math.floor(idx / cols);
  const rowStart = row * cols;
  const inRow = Math.min(cols, count - rowStart);
  const rowW = inRow * AGENT_W + (inRow - 1) * AGENT_H_GAP;
  const x0 = colLeft + (colWidth - rowW) / 2;
  const col = idx - rowStart;
  return {
    x: x0 + col * (AGENT_W + AGENT_H_GAP),
    y: gridTop + row * (AGENT_ROW_H + AGENT_V_GAP)
  };
}

const nodeTypes = {
  orgRoot: OrgRootNode,
  orgWing: OrgWingNode,
  orgAgent: OrgAgentNode
};

function buildGraph(): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const rootId = "org-root";

  const colStarts: number[] = [];
  const colWidths: number[] = [];
  let x = MARGIN_X;
  for (const bay of MISSION_BAYS) {
    const n = bay.agents.length;
    const cw = Math.max(WING_W, agentGridWidth(n));
    colStarts.push(x);
    colWidths.push(cw);
    x += cw + COL_GAP;
  }
  const innerW = x - MARGIN_X - COL_GAP;
  const rootX = MARGIN_X + innerW / 2 - ROOT_W / 2;
  const wingY = ROOT_LAYOUT_H + ROOT_TO_WING_GAP;
  const gridTopBase = wingY + WING_LAYOUT_H + WING_TO_GRID;

  nodes.push({
    id: rootId,
    type: "orgRoot",
    position: { x: rootX, y: 0 },
    targetPosition: Position.Top,
    sourcePosition: Position.Bottom,
    data: {
      title: "PatAlgo Trading Room",
      subtitle: "Analysts → Research → Trading → Risk → Portfolio"
    } satisfies OrgRootNodeData
  });

  MISSION_BAYS.forEach((bay, i) => {
    const wingId = `wing-${bay.id}`;
    const meta = WING_META[bay.id] ?? WING_META.analysts;
    const colLeft = colStarts[i]!;
    const colW = colWidths[i]!;
    const wingX = colLeft + (colW - WING_W) / 2;

    nodes.push({
      id: wingId,
      type: "orgWing",
      position: { x: wingX, y: wingY },
      targetPosition: Position.Top,
      sourcePosition: Position.Bottom,
      data: {
        label: bay.label,
        subtitle: bay.subtitle,
        teamLabel: meta.teamLabel,
        accent: meta.accent,
        border: meta.border,
        bg: meta.bg
      } satisfies OrgWingNodeData
    });

    edges.push({
      id: `e-${rootId}-${wingId}`,
      source: rootId,
      target: wingId,
      type: "smoothstep",
      style: { stroke: "#475569", strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: "#64748b", width: 16, height: 16 }
    });

    const members = bay.agents.map((id) => AGENT_BY_ID[id]).filter(Boolean);
    const count = members.length;

    members.forEach((profile, j) => {
      const nodeId = `agent-${profile.id}`;
      const pos = agentCellPosition(j, count, colLeft, colW, gridTopBase);
      nodes.push({
        id: nodeId,
        type: "orgAgent",
        position: pos,
        targetPosition: Position.Top,
        sourcePosition: Position.Bottom,
        data: { profile } satisfies OrgAgentNodeData
      });
      edges.push({
        id: `e-${wingId}-${nodeId}`,
        source: wingId,
        target: nodeId,
        type: "smoothstep",
        style: { stroke: meta.border, strokeWidth: 1.5, opacity: 0.9 }
      });
    });
  });

  return { nodes, edges };
}

function FitViewOnMount() {
  const { fitView } = useReactFlow();
  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      fitView({
        padding: { top: 0.02, right: 0.08, bottom: 0.12, left: 0.08 },
        duration: 280,
        maxZoom: 1.12,
        minZoom: 0.22
      });
    });
    return () => window.cancelAnimationFrame(id);
  }, [fitView]);
  return null;
}

export function TeamOrgChart() {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => buildGraph(), []);
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const nodeColor = useCallback((n: Node) => {
    if (n.type === "orgRoot") return "#1e293b";
    if (n.type === "orgWing") {
      const d = n.data as OrgWingNodeData;
      return d.border;
    }
    return "#334155";
  }, []);

  return (
    <div className="team-org-shell">
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          colorMode="dark"
          minZoom={0.2}
          maxZoom={1.35}
          proOptions={{ hideAttribution: true }}
          nodesDraggable
          nodesConnectable={false}
          elementsSelectable
          elevateEdgesOnSelect
          className="team-org-flow"
        >
          <FitViewOnMount />
          <Background gap={22} size={1.2} color="#1a2740" className="team-org-bg" />
          <Controls className="team-org-controls" showInteractive={false} />
          <MiniMap
            className="team-org-minimap"
            pannable
            zoomable
            nodeColor={nodeColor}
            maskColor="rgba(15, 23, 42, 0.88)"
            nodeStrokeWidth={2}
            nodeStrokeColor="#64748b"
          />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}
