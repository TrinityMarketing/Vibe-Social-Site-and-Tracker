"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#00ff88", "#6366f1", "#0ea5e9", "#f59e0b", "#ec4899"];

interface AppBreakdownProps {
  data: { appName: string; totalHours: number }[];
}

export function AppBreakdown({ data }: AppBreakdownProps) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">No data yet</p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="h-48 w-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="totalHours"
              nameKey="appName"
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              paddingAngle={3}
              strokeWidth={0}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#1a1a1a",
                border: "1px solid #262626",
                borderRadius: "8px",
                color: "#f5f5f5",
              }}
              formatter={(value) => [`${value}h`, "Hours"]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2">
        {data.map((app, i) => (
          <div key={app.appName} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="text-sm text-foreground">{app.appName}</span>
            <span className="font-mono text-sm text-muted-foreground">
              {app.totalHours}h
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
