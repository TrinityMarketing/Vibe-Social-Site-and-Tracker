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
          <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
          <XAxis
            dataKey="day"
            tick={{ fill: "#a3a3a3", fontSize: 12 }}
            axisLine={{ stroke: "#262626" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#a3a3a3", fontSize: 12 }}
            axisLine={{ stroke: "#262626" }}
            tickLine={false}
            unit="h"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1a1a1a",
              border: "1px solid #262626",
              borderRadius: "8px",
              color: "#f5f5f5",
            }}
            formatter={(value) => [`${value}h`, "Hours"]}
          />
          <Bar dataKey="hours" fill="#00ff88" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
