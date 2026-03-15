import { prisma } from "./prisma";

// Compute wall-clock time from overlapping session time ranges
function computeWallClockSecs(
  sessions: { startTime: Date; endTime: Date | null; durationSecs: number }[]
): number {
  // Build time ranges: [start, end] in ms
  const ranges: [number, number][] = sessions.map((s) => {
    const start = s.startTime.getTime();
    const end = s.endTime
      ? s.endTime.getTime()
      : start + s.durationSecs * 1000;
    return [start, end];
  });

  if (ranges.length === 0) return 0;

  // Sort by start time
  ranges.sort((a, b) => a[0] - b[0]);

  // Merge overlapping ranges
  const merged: [number, number][] = [ranges[0]];
  for (let i = 1; i < ranges.length; i++) {
    const prev = merged[merged.length - 1];
    const curr = ranges[i];
    if (curr[0] <= prev[1]) {
      // Overlapping — extend the end
      prev[1] = Math.max(prev[1], curr[1]);
    } else {
      merged.push(curr);
    }
  }

  // Sum merged range durations
  let totalMs = 0;
  for (const [start, end] of merged) {
    totalMs += end - start;
  }

  return Math.round(totalMs / 1000);
}

export async function updateDailyRollup(userId: string, date: Date) {
  // Get all sessions for this day (for per-app breakdown)
  const grouped = await prisma.session.groupBy({
    by: ["appName"],
    where: { userId, date },
    _sum: { durationSecs: true },
  });

  if (grouped.length === 0) return;

  const appBreakdown: Record<string, number> = {};
  let topApp: string | null = null;
  let topSecs = 0;

  for (const g of grouped) {
    const secs = g._sum.durationSecs || 0;
    appBreakdown[g.appName] = secs;
    if (secs > topSecs) {
      topSecs = secs;
      topApp = g.appName;
    }
  }

  // Get all sessions with time ranges to compute wall-clock total
  const sessions = await prisma.session.findMany({
    where: { userId, date },
    select: { startTime: true, endTime: true, durationSecs: true },
  });

  const totalSecs = computeWallClockSecs(sessions);

  await prisma.dailyStat.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date, totalSecs, topApp, appBreakdown },
    update: { totalSecs, topApp, appBreakdown },
  });
}
