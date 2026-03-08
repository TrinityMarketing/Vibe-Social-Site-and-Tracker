"use client";

import { WeeklyChart } from "@/components/dashboard/weekly-chart";

export function DashboardChartWrapper({
  data,
}: {
  data: { day: string; hours: number }[];
}) {
  return <WeeklyChart data={data} />;
}
