export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/shared/stat-card";
import { SessionList } from "@/components/dashboard/session-list";
import { ApiKeyDisplay } from "@/components/dashboard/api-key-display";
import { DashboardChartWrapper } from "./chart-wrapper";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/onboarding");

  // Fetch stats
  const now = new Date();
  const todayStart = new Date(now.toISOString().split("T")[0]);
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [todayResult, weeklyResult, sessions, topAppResult, weeklyBreakdown] =
    await Promise.all([
      // Today's time
      prisma.session.aggregate({
        where: { userId: user.id, startTime: { gte: todayStart } },
        _sum: { durationSecs: true },
      }),
      // Weekly hours
      prisma.session.aggregate({
        where: { userId: user.id, startTime: { gte: weekAgo } },
        _sum: { durationSecs: true },
      }),
      // Recent sessions
      prisma.session.findMany({
        where: { userId: user.id },
        orderBy: { startTime: "desc" },
        take: 20,
      }),
      // Top app
      prisma.session.groupBy({
        by: ["appName"],
        where: { userId: user.id },
        _sum: { durationSecs: true },
        orderBy: { _sum: { durationSecs: "desc" } },
        take: 1,
      }),
      // Weekly breakdown for chart
      Promise.all(
        Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          const dayStart = new Date(d.toISOString().split("T")[0]);
          const dayEnd = new Date(dayStart);
          dayEnd.setDate(dayEnd.getDate() + 1);
          return prisma.session
            .aggregate({
              where: {
                userId: user.id,
                startTime: { gte: dayStart, lt: dayEnd },
              },
              _sum: { durationSecs: true },
            })
            .then((r) => ({
              day: dayStart.toLocaleDateString("en-US", { weekday: "short" }),
              hours:
                Math.round(((r._sum.durationSecs || 0) / 3600) * 10) / 10,
            }));
        })
      ),
    ]);

  const todaySecs = todayResult._sum.durationSecs || 0;
  const weeklySecs = weeklyResult._sum.durationSecs || 0;
  const todayDisplay = todaySecs >= 3600
    ? { value: Math.round((todaySecs / 3600) * 10) / 10, suffix: "hrs" }
    : { value: Math.round(todaySecs / 60), suffix: "min" };
  const weeklyDisplay = weeklySecs >= 3600
    ? { value: Math.round((weeklySecs / 3600) * 10) / 10, suffix: "hrs" }
    : { value: Math.round(weeklySecs / 60), suffix: "min" };
  const topApp = topAppResult[0]?.appName || "—";

  // Streak
  const distinctDates = await prisma.session.findMany({
    where: { userId: user.id },
    select: { date: true },
    distinct: ["date"],
    orderBy: { date: "desc" },
  });

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < distinctDates.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    expected.setHours(0, 0, 0, 0);
    const sessionDate = new Date(distinctDates[i].date);
    sessionDate.setHours(0, 0, 0, 0);
    if (sessionDate.getTime() === expected.getTime()) {
      streak++;
    } else {
      break;
    }
  }

  const serializedSessions = sessions.map((s) => ({
    id: s.id,
    appName: s.appName,
    windowTitle: s.windowTitle,
    startTime: s.startTime.toISOString(),
    durationSecs: s.durationSecs,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="font-mono text-3xl font-bold">
          Welcome back, <span className="text-neon">{user.displayName}</span>
        </h1>
        <p className="mt-1 text-muted-foreground">
          Here&apos;s your coding activity overview.
        </p>
      </div>

      {/* Stats Row */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Today" value={todayDisplay.value} suffix={todayDisplay.suffix} />
        <StatCard label="This Week" value={weeklyDisplay.value} suffix={weeklyDisplay.suffix} />
        <StatCard label="Streak" value={streak} suffix="days" />
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Top App</p>
          <p className="mt-2 font-mono text-2xl font-bold text-foreground">{topApp}</p>
        </div>
      </div>

      {/* Get Started Banner (show when no sessions) */}
      {sessions.length === 0 && (
        <div className="mb-8 rounded-xl border border-neon/30 bg-neon/5 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-mono text-lg font-semibold text-neon">
                Start Tracking
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Launch the desktop tracker to automatically log your coding sessions.
              </p>
              <code className="mt-2 inline-block rounded bg-muted px-3 py-1.5 font-mono text-xs text-foreground">
                cd apps/desktop && npx electron-vite dev
              </code>
            </div>
            <div className="shrink-0 rounded-lg border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground">Your API Key</p>
              <p className="mt-1 font-mono text-sm text-neon break-all">
                {user.apiKey.slice(0, 12)}...
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Paste this in the tracker when prompted
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Chart + API Key */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="mb-4 font-mono text-lg font-semibold">Weekly Activity</h2>
            <DashboardChartWrapper data={weeklyBreakdown} />
          </div>
        </div>
        <ApiKeyDisplay apiKey={user.apiKey} />
      </div>

      {/* Recent Sessions */}
      <div>
        <h2 className="mb-4 font-mono text-lg font-semibold">Recent Sessions</h2>
        <SessionList sessions={serializedSessions} />
      </div>
    </div>
  );
}
