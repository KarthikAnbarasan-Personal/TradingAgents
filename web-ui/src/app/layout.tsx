import "./globals.css";
import type { Metadata } from "next";
import React from "react";
import { AppHeader } from "../components/AppHeader";

export const metadata: Metadata = {
  title: "TradingAgents Local UI",
  description: "Local dashboard for TradingAgents workflow"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <AppHeader />
          <div className="app-main">{children}</div>
        </div>
      </body>
    </html>
  );
}

