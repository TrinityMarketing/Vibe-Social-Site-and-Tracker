import { prisma } from "./prisma";

export async function updateDailyRollup(userId: string, date: Date) {
  const grouped = await prisma.session.groupBy({
    by: ["appName"],
    where: { userId, date },
    _sum: { durationSecs: true },
  });

  if (grouped.length === 0) return;

  const appBreakdown: Record<string, number> = {};
  let totalSecs = 0;
  let topApp: string | null = null;
  let topSecs = 0;

  for (const g of grouped) {
    const secs = g._sum.durationSecs || 0;
    appBreakdown[g.appName] = secs;
    totalSecs += secs;
    if (secs > topSecs) {
      topSecs = secs;
      topApp = g.appName;
    }
  }

  await prisma.dailyStat.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date, totalSecs, topApp, appBreakdown },
    update: { totalSecs, topApp, appBreakdown },
  });
}
