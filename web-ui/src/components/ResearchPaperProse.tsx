"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const markdownComponents: Partial<Components> = {
  a: ({ children, ...props }) => (
    <a {...props} target="_blank" rel="noopener noreferrer" className="rp-a">
      {children}
    </a>
  ),
  table: ({ children, ...props }) => (
    <div className="rp-table-wrap">
      <table {...props}>{children}</table>
    </div>
  )
};

type Props = {
  markdown: string;
  /** Optional class on inner prose wrapper */
  className?: string;
};

export function ResearchPaperProse({ markdown, className }: Props) {
  return (
    <div className={`research-paper-prose ${className ?? ""}`.trim()}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
