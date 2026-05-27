export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import {
  Activity,
  BadgeCheck,
  EyeOff,
  Flame,
  Gauge,
  GitBranch,
  KeyRound,
  Lock,
  Radio,
  Rocket,
  ShieldCheck,
  Sparkles,
  Terminal,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/shared/stat-card";
import { SessionList } from "@/components/dashboard/session-list";
import { ApiKeyDisplay } from "@/components/dashboard/api-key-display";
import { TrackerStatusCard } from "@/components/dashboard/tracker-status-card";
import { AppIcon } from "@/components/shared/app-icon";
import { ProofComposer } from "@/components/proof/proof-composer";
import { ProofList } from "@/components/proof/proof-list";
import { DashboardChartWrapper } from "./chart-wrapper";

function DashboardUnavailable() {
  return (
    <div className="vc-container py-12">
      <div className="vc-panel border-amber-400/20 bg-amber-400/[0.06] p-6">
        <div className="flex gap-4">
          <div className="grid size-11 shrink-0 place-items-center rounded-lg border border-amber-400/25 bg-amber-400/10 text-amber-200">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <h1 className="font-mono text-xl font-semibold text-amber-200">
              Dashboard temporarily unavailable
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              The app shell is running, but the database connection is not accepting
              requests right now. Once the Supabase project URL and credentials are
              valid, your sessions and proof objects will load here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDuration(secs: number): string {
  if (secs >= 3600) return `${Math.round((secs / 3600) * 10) / 10}h`;
  if (secs >= 60) return `${Math.round(secs / 60)}m`;
  return `${secs}s`;
}

function formatSource(source: string): string {
  return source
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

export default async function DashboardPage() {
  let user: Awaited<ReturnType<typeof getCurrentUser>> = null;
  try {
    user = await getCurrentUser();
  } catch (error) {
    console.error("Dashboard user lookup unavailable:", error);
    return <DashboardUnavailable />;
  }
  if (!user) redirect("/onboarding");

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);

  let todayRollup: Awaited<ReturnType<typeof prisma.dailyStat.findUnique>> = null;
  let weeklyRollups: Awaited<ReturnType<typeof prisma.dailyStat.findMany>> = [];
  let todaySessionSum: { _sum: { durationSecs: number | null } } = {
    _sum: { durationSecs: 0 },
  };
  let weeklySessionSum: { _sum: { durationSecs: number | null } } = {
    _sum: { durationSecs: 0 },
  };
  let sessions: Awaited<ReturnType<typeof prisma.session.findMany>> = [];
  let topAppResult: {
    appName: string;
    _sum: { durationSecs: number | null };
  }[] = [];
  let weeklyBreakdown: { day: string; hours: number }[] = [];
  let proofs: Awaited<ReturnType<typeof prisma.proofObject.findMany>> = [];
  let distinctDates: { date: Date }[] = [];

  try {
    [
      todayRollup,
      weeklyRollups,
      todaySessionSum,
      weeklySessionSum,
      sessions,
      topAppResult,
      weeklyBreakdown,
      proofs,
      distinctDates,
    ] = await Promise.all([
      prisma.dailyStat.findUnique({
        where: { userId_date: { userId: user.id, date: todayStart } },
      }),
      prisma.dailyStat.findMany({
        where: { userId: user.id, date: { gte: weekAgo } },
      }),
      prisma.session.aggregate({
        where: { userId: user.id, startTime: { gte: todayStart } },
        _sum: { durationSecs: true },
      }),
      prisma.session.aggregate({
        where: { userId: user.id, startTime: { gte: weekAgo } },
        _sum: { durationSecs: true },
      }),
      prisma.session.findMany({
        where: { userId: user.id },
        orderBy: { startTime: "desc" },
        take: 20,
      }),
      prisma.session.groupBy({
        by: ["appName"],
        where: { userId: user.id },
        _sum: { durationSecs: true },
        orderBy: { _sum: { durationSecs: "desc" } },
      }),
      Promise.all(
        Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
          const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
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
      prisma.proofObject.findMany({
        where: { userId: user.id },
        orderBy: { shippedAt: "desc" },
        take: 10,
      }),
      prisma.session.findMany({
        where: { userId: user.id },
        select: { date: true },
        distinct: ["date"],
        orderBy: { date: "desc" },
      }),
    ]);
  } catch (error) {
    console.error("Dashboard data unavailable:", error);
    return <DashboardUnavailable />;
  }

  const todayFromRollup = todayRollup?.totalSecs || 0;
  const todayFromSessions = todaySessionSum._sum.durationSecs || 0;
  const todaySecs = todayFromRollup > 0 ? todayFromRollup : todayFromSessions;

  const weeklyFromRollup = weeklyRollups.reduce((sum, d) => sum + d.totalSecs, 0);
  const weeklyFromSessions = weeklySessionSum._sum.durationSecs || 0;
  const weeklySecs = weeklyFromRollup > 0 ? weeklyFromRollup : weeklyFromSessions;
  const todayDisplay =
    todaySecs >= 3600
      ? { value: Math.round((todaySecs / 3600) * 10) / 10, suffix: "hrs" }
      : { value: Math.round(todaySecs / 60), suffix: "min" };
  const weeklyDisplay =
    weeklySecs >= 3600
      ? { value: Math.round((weeklySecs / 3600) * 10) / 10, suffix: "hrs" }
      : { value: Math.round(weeklySecs / 60), suffix: "min" };

  const topApp = topAppResult[0]?.appName || "No signal yet";
  const currentProject =
    user.currentProject || sessions[0]?.projectName || "No active project yet";
  const currentStack =
    topAppResult
      .slice(0, 3)
      .map((app) => app.appName)
      .join(" + ") || "Waiting for sessions";
  const publicProofs = proofs.filter((proof) => proof.isPublic).length;
  const averageConfidence =
    sessions.length > 0
      ? Math.round(
          (sessions.reduce((sum, session) => sum + (session.confidence || 0), 0) /
            sessions.length) *
            100
        )
      : 0;

  const appBreakdown = topAppResult.map((a) => {
    const secs = a._sum.durationSecs || 0;
    return {
      appName: a.appName,
      time: formatDuration(secs),
      secs,
    };
  });

  const sourceBreakdown = Object.entries(
    sessions.reduce<Record<string, { secs: number; count: number; confidence: number }>>(
      (acc, session) => {
        const source = session.source || "active_window";
        if (!acc[source]) acc[source] = { secs: 0, count: 0, confidence: 0 };
        acc[source].secs += session.durationSecs;
        acc[source].count += 1;
        acc[source].confidence += session.confidence || 0;
        return acc;
      },
      {}
    )
  )
    .map(([source, value]) => ({
      source,
      time: formatDuration(value.secs),
      confidence: Math.round((value.confidence / value.count) * 100),
    }))
    .slice(0, 4);

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
    projectName: s.projectName,
    windowTitle: s.windowTitle,
    startTime: s.startTime.toISOString(),
    durationSecs: s.durationSecs,
    source: s.source,
    confidence: s.confidence,
  }));

  const excludedApps = asStringArray(user.excludedApps);
  const privateProjects = asStringArray(user.privateProjects);
  const privacyRows = [
    {
      label: "Pause tracking",
      value: user.trackingPaused ? "Paused" : "Active",
      tone: user.trackingPaused ? "text-amber-200" : "text-emerald-200",
    },
    {
      label: "Window titles",
      value: user.redactWindowTitles ? "Redacted" : "Visible",
      tone: user.redactWindowTitles ? "text-emerald-200" : "text-amber-200",
    },
    {
      label: "Excluded apps",
      value: `${excludedApps.length}`,
      tone: "text-sky-200",
    },
    {
      label: "Private projects",
      value: `${privateProjects.length}`,
      tone: "text-sky-200",
    },
  ];

  return (
    <div className="vc-container py-8 md:py-10">
      <section className="mb-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="vc-panel overflow-hidden">
          <div className="relative p-6 md:p-8">
            <div className="absolute right-0 top-0 h-52 w-52 rounded-full bg-emerald-300/10 blur-3xl" />
            <div className="relative">
              <div className="vc-chip vc-chip-mint mb-5">
                <Gauge className="size-3.5" />
                Builder command center
              </div>
              <h1 className="max-w-3xl font-mono text-4xl font-bold tracking-normal md:text-5xl">
                Welcome back,{" "}
                <span className="text-emerald-200">{user.displayName}</span>
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
                Stay focused, publish stronger proof objects, and keep private
                work out of the public layer.
              </p>

              <div className="mt-7 grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Radio className="size-4 text-emerald-300" />
                    Currently building
                  </div>
                  <p className="mt-2 truncate font-mono text-lg font-semibold">
                    {currentProject}
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Terminal className="size-4 text-sky-300" />
                    Tool stack
                  </div>
                  <p className="mt-2 truncate font-mono text-lg font-semibold">
                    {currentStack}
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BadgeCheck className="size-4 text-amber-300" />
                    Signal confidence
                  </div>
                  <p className="mt-2 font-mono text-lg font-semibold">
                    {averageConfidence || 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <TrackerStatusCard
          trackingPaused={user.trackingPaused}
          lastSeenAt={user.lastSeenAt?.toISOString() ?? null}
          currentProject={user.currentProject}
        />
      </section>

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Today"
          value={todayDisplay.value}
          suffix={todayDisplay.suffix}
          icon={<Activity className="size-4 text-emerald-300" />}
        />
        <StatCard
          label="This Week"
          value={weeklyDisplay.value}
          suffix={weeklyDisplay.suffix}
          icon={<Flame className="size-4 text-amber-300" />}
        />
        <StatCard
          label="Build Streak"
          value={streak}
          suffix="days"
          icon={<Rocket className="size-4 text-sky-300" />}
        />
        <div className="vc-panel p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Top Tool</p>
            <Sparkles className="size-4 text-emerald-300" />
          </div>
          <p className="mt-3 truncate font-mono text-2xl font-bold text-foreground">
            {topApp}
          </p>
        </div>
      </section>

      {sessions.length === 0 && (
        <section className="vc-panel mb-6 border-emerald-400/20 bg-emerald-400/[0.055] p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="vc-chip vc-chip-mint mb-3">
                <Radio className="size-3.5" />
                Start tracking
              </div>
              <h2 className="font-mono text-xl font-semibold">
                Launch the desktop tracker to begin building proof.
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Sessions, tools, source confidence, and privacy controls will sync
                here once the tracker is connected.
              </p>
              <code className="mt-3 inline-block rounded-md border border-white/10 bg-black/30 px-3 py-1.5 font-mono text-xs text-emerald-200">
                cd apps/desktop && npx electron-vite dev
              </code>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <KeyRound className="size-3.5 text-emerald-300" />
                Your API key
              </div>
              <p className="mt-2 break-all font-mono text-sm text-emerald-200">
                {user.apiKey.slice(0, 12)}...
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="vc-panel p-5 lg:col-span-2">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="vc-section-title">Weekly summary</p>
              <h2 className="mt-1 font-mono text-xl font-semibold">
                Focus sessions by day
              </h2>
            </div>
            <span className="vc-chip vc-chip-sky">
              {formatDuration(weeklySecs)} captured
            </span>
          </div>
          <DashboardChartWrapper data={weeklyBreakdown} />
        </div>

        <div className="vc-panel p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="vc-section-title">Tool mix</p>
              <h2 className="mt-1 font-mono text-xl font-semibold">Top apps</h2>
            </div>
            <Terminal className="size-5 text-sky-300" />
          </div>
          <div className="mt-5 space-y-3">
            {(appBreakdown.length > 0
              ? appBreakdown.slice(0, 5)
              : [{ appName: "Waiting for sessions", time: "0m", secs: 0 }]
            ).map((app) => (
              <div
                key={app.appName}
                className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-3"
              >
                <AppIcon appName={app.appName} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {app.appName}
                  </p>
                  <div className="mt-2 h-1.5 rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-sky-300"
                      style={{
                        width: `${Math.max(
                          12,
                          Math.min(100, (app.secs / Math.max(weeklySecs, 1)) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="font-mono text-xs text-muted-foreground">
                  {app.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProofComposer />
        </div>
        <div className="space-y-6">
          <ApiKeyDisplay apiKey={user.apiKey} />
          <div className="vc-panel p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="vc-section-title">Privacy layer</p>
                <h2 className="mt-1 font-mono text-xl font-semibold">
                  Public controls
                </h2>
              </div>
              <Lock className="size-5 text-emerald-300" />
            </div>
            <div className="mt-5 space-y-3">
              {privacyRows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-sm"
                >
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className={`font-mono text-xs ${row.tone}`}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="vc-section-title">Proof objects</p>
              <h2 className="mt-1 font-mono text-xl font-semibold">
                Ship notes and artifacts
              </h2>
            </div>
            <span className="vc-chip vc-chip-mint">
              {publicProofs} public / {proofs.length} total
            </span>
          </div>
          <ProofList proofs={proofs} />
        </div>

        <div className="vc-panel p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="vc-section-title">Source confidence</p>
              <h2 className="mt-1 font-mono text-xl font-semibold">Signals</h2>
            </div>
            <GitBranch className="size-5 text-amber-300" />
          </div>
          <div className="mt-5 space-y-3">
            {(sourceBreakdown.length > 0
              ? sourceBreakdown
              : [{ source: "active_window", time: "0m", confidence: 40 }]
            ).map((source) => (
              <div
                key={source.source}
                className="rounded-lg border border-white/10 bg-white/[0.035] p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm text-foreground">
                    {formatSource(source.source)}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {source.time}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1.5 flex-1 rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-amber-300"
                      style={{ width: `${Math.max(8, source.confidence)}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs text-amber-200">
                    {source.confidence}%
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <EyeOff className="mt-0.5 size-4 shrink-0 text-amber-300" />
            <p className="text-xs leading-5 text-muted-foreground">
              Window detection is useful context. Editor plugins and manual proof
              links should carry stronger confidence over time.
            </p>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="vc-section-title">Recent sessions</p>
            <h2 className="mt-1 font-mono text-xl font-semibold">
              Raw-ish activity stream
            </h2>
          </div>
          <span className="vc-chip">Source: /api/sessions/batch</span>
        </div>
        <SessionList sessions={serializedSessions} showDelete />
      </section>
    </div>
  );
}
