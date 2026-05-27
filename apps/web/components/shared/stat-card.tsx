"use client";

import { useEffect, useState } from "react";
interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;
  icon?: React.ReactNode;
}

export function StatCard({ label, value, suffix = "", icon }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.round(current * 10) / 10);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className="vc-panel p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        {icon}
      </div>
      <p className="mt-3 font-mono text-3xl font-bold text-foreground">
        {displayValue}
        <span className="ml-1 text-lg text-muted-foreground">{suffix}</span>
      </p>
    </div>
  );
}
