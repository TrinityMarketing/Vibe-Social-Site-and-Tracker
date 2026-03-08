"use client";

import { useEffect, useState } from "react";

export function HoursBadge({ hours, suffix = "hours" }: { hours: number; suffix?: string }) {
  const [displayHours, setDisplayHours] = useState(0);

  useEffect(() => {
    const duration = 1500;
    const steps = 40;
    const increment = hours / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= hours) {
        setDisplayHours(hours);
        clearInterval(timer);
      } else {
        setDisplayHours(Math.round(current * 10) / 10);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [hours]);

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative flex h-40 w-40 items-center justify-center rounded-full border-2 border-neon/30 bg-neon/5">
        <div className="absolute inset-0 animate-pulse rounded-full bg-neon/10" />
        <div className="text-center">
          <p className="font-mono text-4xl font-bold text-neon">{displayHours}</p>
          <p className="text-sm text-muted-foreground">{suffix}</p>
        </div>
      </div>
      <p className="mt-2 text-xs font-medium text-neon">Verified Build Time</p>
    </div>
  );
}
