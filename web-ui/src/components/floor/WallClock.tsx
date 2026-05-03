"use client";

import React, { useEffect, useState } from "react";

export function WallClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const t = now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return (
    <g className="tf-wall-clock" transform="translate(1050, 40)">
      <circle r="36" className="tf-clock-face" />
      <text textAnchor="middle" y="8" className="tf-clock-text mono">
        {t}
      </text>
    </g>
  );
}
