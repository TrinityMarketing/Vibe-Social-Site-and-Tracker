"use client";

import { useEffect, useState } from "react";

interface HeatmapDay {
  date: string;
  totalSecs: number;
  topApp: string | null;
}

interface Props {
  username: string;
}

function getIntensity(secs: number): number {
  if (secs === 0) return 0;
  if (secs < 1800) return 1;   // < 30min
  if (secs < 7200) return 2;   // < 2h
  if (secs < 18000) return 3;  // < 5h
  return 4;                     // 5h+
}

const COLORS = [
  "bg-zinc-800/50",              // 0 — empty
  "bg-emerald-900/60",           // 1
  "bg-emerald-700/70",           // 2
  "bg-emerald-500/80",           // 3
  "bg-[#00ff88]",                // 4 — full neon
];

function formatHours(secs: number): string {
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.round(secs / 60)}m`;
  return `${(secs / 3600).toFixed(1)}h`;
}

export function ActivityHeatmap({ username }: Props) {
  const [days, setDays] = useState<HeatmapDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<{
    day: HeatmapDay;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    fetch(`/api/users/${username}/heatmap`)
      .then((r) => r.json())
      .then((data) => {
        setDays(data.days || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [username]);

  if (loading) {
    return (
      <div className="h-[140px] animate-pulse rounded-lg bg-zinc-800/30" />
    );
  }

  // Build 53-week grid (371 days) ending today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dayMap = new Map<string, HeatmapDay>();
  for (const d of days) {
    dayMap.set(d.date, d);
  }

  // Start from the Sunday 52 weeks ago
  const start = new Date(today);
  start.setDate(start.getDate() - start.getDay() - 52 * 7);

  const weeks: (HeatmapDay | null)[][] = [];
  let currentWeek: (HeatmapDay | null)[] = [];

  const cursor = new Date(start);
  while (cursor <= today) {
    const key = cursor.toISOString().split("T")[0];
    const entry = dayMap.get(key) || { date: key, totalSecs: 0, topApp: null };

    if (cursor.getDay() === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }

    currentWeek.push(entry);
    cursor.setDate(cursor.getDate() + 1);
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);

  // Month labels
  const months: { label: string; col: number }[] = [];
  let lastMonth = -1;
  for (let w = 0; w < weeks.length; w++) {
    const firstDay = weeks[w][0];
    if (!firstDay) continue;
    const month = new Date(firstDay.date).getMonth();
    if (month !== lastMonth) {
      months.push({
        label: new Date(firstDay.date).toLocaleDateString("en-US", { month: "short" }),
        col: w,
      });
      lastMonth = month;
    }
  }

  return (
    <div className="relative">
      {/* Month labels */}
      <div className="mb-1 flex text-[10px] text-muted-foreground" style={{ paddingLeft: 28 }}>
        {months.map((m, i) => (
          <span
            key={i}
            className="absolute"
            style={{ left: 28 + m.col * 14 }}
          >
            {m.label}
          </span>
        ))}
      </div>

      <div className="mt-4 flex gap-0.5">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 pr-1 text-[10px] text-muted-foreground">
          <span className="h-[12px]" />
          <span className="flex h-[12px] items-center">Mon</span>
          <span className="h-[12px]" />
          <span className="flex h-[12px] items-center">Wed</span>
          <span className="h-[12px]" />
          <span className="flex h-[12px] items-center">Fri</span>
          <span className="h-[12px]" />
        </div>

        {/* Grid */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {Array.from({ length: 7 }).map((_, di) => {
              const day = week[di] || null;
              if (!day) return <div key={di} className="h-[12px] w-[12px]" />;

              const intensity = getIntensity(day.totalSecs);
              return (
                <div
                  key={di}
                  className={`h-[12px] w-[12px] rounded-[2px] ${COLORS[intensity]} transition-colors`}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setTooltip({ day, x: rect.left + rect.width / 2, y: rect.top });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
        <span>Less</span>
        {COLORS.map((c, i) => (
          <div key={i} className={`h-[10px] w-[10px] rounded-[2px] ${c}`} />
        ))}
        <span>More</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded-md border border-border bg-popover px-2 py-1 text-xs shadow-md"
          style={{
            left: tooltip.x,
            top: tooltip.y - 36,
            transform: "translateX(-50%)",
          }}
        >
          <span className="font-semibold">{formatHours(tooltip.day.totalSecs)}</span>
          {tooltip.day.topApp && (
            <span className="text-muted-foreground"> in {tooltip.day.topApp}</span>
          )}
          <span className="text-muted-foreground"> — {tooltip.day.date}</span>
        </div>
      )}
    </div>
  );
}
