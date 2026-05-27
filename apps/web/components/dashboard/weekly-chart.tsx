"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface WeeklyChartProps {
  data: { day: string; hours: number }[];
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
          <XAxis
            dataKey="day"
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            tickLine={false}
            unit="h"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#071019",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "8px",
              color: "#f8fafc",
            }}
            formatter={(value) => [`${value}h`, "Hours"]}
          />
          <Bar dataKey="hours" fill="#6ee7b7" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
