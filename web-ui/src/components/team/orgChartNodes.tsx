"use client";

import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import React, { memo } from "react";
import { agentCardNameAndDesignation, type AgentProfile } from "../../lib/agentRegistry";

export type OrgRootNodeData = Record<string, unknown> & {
  title: string;
  subtitle: string;
};

export type OrgWingNodeData = Record<string, unknown> & {
  label: string;
  subtitle: string;
  teamLabel: string;
  accent: string;
  border: string;
  bg: string;
};

export type OrgAgentNodeData = Record<string, unknown> & {
  profile: AgentProfile;
};

export type OrgRootNodeType = Node<OrgRootNodeData, "orgRoot">;
export type OrgWingNodeType = Node<OrgWingNodeData, "orgWing">;
export type OrgAgentNodeType = Node<OrgAgentNodeData, "orgAgent">;

export const OrgRootNode = memo(function OrgRootNode({ data }: NodeProps<OrgRootNodeType>) {
  return (
    <div className="team-org-node team-org-node--root">
      <div className="team-org-node-root-inner">
        <div className="team-org-node-root-badge">Organization</div>
        <div className="team-org-node-root-title">{data.title}</div>
        <div className="team-org-node-root-sub">{data.subtitle}</div>
      </div>
      <Handle type="source" position={Position.Bottom} className="team-org-handle" />
    </div>
  );
});

export const OrgWingNode = memo(function OrgWingNode({ data }: NodeProps<OrgWingNodeType>) {
  return (
    <div
      className="team-org-node team-org-node--wing"
      style={{
        borderColor: data.border,
        background: data.bg,
        boxShadow: `0 0 0 1px ${data.border}33, 0 12px 40px -12px ${data.accent}44`
      }}
    >
      <Handle type="target" position={Position.Top} className="team-org-handle" />
      <div className="team-org-node-wing-accent" style={{ background: `linear-gradient(90deg, ${data.accent}, transparent)` }} />
      <div className="team-org-node-wing-tag mono">{data.teamLabel}</div>
      <div className="team-org-node-wing-title">{data.label}</div>
      <div className="team-org-node-wing-sub">{data.subtitle}</div>
      <Handle type="source" position={Position.Bottom} className="team-org-handle" />
    </div>
  );
});

export const OrgAgentNode = memo(function OrgAgentNode({ data }: NodeProps<OrgAgentNodeType>) {
  const { profile } = data;
  const { name, designation } = agentCardNameAndDesignation(profile.displayName);
  return (
    <div className="team-org-node team-org-node--agent">
      <Handle type="target" position={Position.Top} className="team-org-handle" />
      <div className="mono team-org-node-agent-id">{profile.id}</div>
      <div className="team-org-node-agent-name">{name}</div>
      {designation ? (
        <div className="team-org-node-agent-role">
          <span className="team-org-node-agent-k">Designation</span>
          {designation}
        </div>
      ) : null}
      <div className="team-org-node-agent-role">
        <span className="team-org-node-agent-k">Role</span>
        {profile.roleDescription}
      </div>
    </div>
  );
});
