"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export function AppHeader() {
  const pathname = usePathname() ?? "/";

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link href="/" className="app-header-logo-link" aria-label="PatAlgo — Pro traders choice, home">
          <Image
            src="/Patalgologo.png"
            alt="PatAlgo — PRO TRADERS CHOICE"
            width={1414}
            height={319}
            className="app-header-logo"
            priority
          />
        </Link>
        <nav className="app-header-nav" aria-label="Main">
          <Link href="/" className={pathname === "/" ? "active" : undefined}>
            Home
          </Link>
          <Link href="/trading-floor" className={pathname === "/trading-floor" ? "active" : undefined}>
            Trading Floor
          </Link>
          <Link href="/team" className={pathname === "/team" ? "active" : undefined}>
            Team
          </Link>
          <Link href="/history" className={pathname === "/history" ? "active" : undefined}>
            Run history
          </Link>
        </nav>
      </div>
    </header>
  );
}
