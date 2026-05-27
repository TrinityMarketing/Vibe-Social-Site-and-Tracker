export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { Metadata } from "next";
import type { ReactNode } from "react";
import {
  Activity,
  BadgeCheck,
  Flame,
  Radio,
  Rocket,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { ProfileHeader } from "@/components/profile/profile-header";
import { AppBreakdown } from "@/components/profile/app-breakdown";
import { AppIcon } from "@/components/shared/app-icon";
import { SessionList } from "@/components/dashboard/session-list";
import { LiveIndicator } from "@/components/profile/live-indicator";
import { ActivityHeatmap } from "@/components/profile/activity-heatmap";
import { ProofList } from "@/components/proof/proof-list";
import { isPublicSession, publicWindowTitle } from "@/lib/privacy";

const RESERVED = [
  "dashboard",
  "settings",
  "onboarding",
  "sign-in",
  "sign-up",
  "api",
  "leaderboard",
  "explore",
  "feed",
  "_next",
];

interface Props {
  params: { username: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  let user: Awaited<ReturnType<typeof prisma.user.findUnique>> = null;

  try {
    user = await prisma.user.findUnique({
      where: { username: params.username },
    });
  } catch {
    return { title: "VibeClock" };
  }

  if (!user) return { title: "User Not Found - VibeClock" };

  return {
    title: `${user.displayName} (@${user.username}) - VibeClock`,
    description:
      user.bio || `Check out ${user.displayName}'s proof profile on VibeClock.`,
  };
}

function ProfileUnavailable() {
  return (
    <div className="vc-shell flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="vc-container py-12">
          <div className="vc-panel border-amber-400/20 bg-amber-400/[0.06] p-6">
            <div className="flex gap-4">
              <div className="grid size-11 shrink-0 place-items-center rounded-lg border border-amber-400/25 bg-amber-400/10 text-amber-200">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <h1 className="font-mono text-xl font-semibold text-amber-200">
                  Profile temporarily unavailable
                </h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  The app is running, but the database connection is not available
                  right now. This profile will load once Postgres is reachable again.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function StatTile({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  tone: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{label}</p>
        <span className={tone}>{icon}</span>
      </div>
      <p className="font-mono text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

export default async function PublicProfilePage({ params }: Props) {
  if (RESERVED.includes(params.username)) notFound();

  let user: Awaited<ReturnType<typeof prisma.user.findUnique>> = null;

  try {
    user = await prisma.user.findUnique({
      where: { username: params.username },
    });
  } catch (error) {
    console.error("Profile unavailable:", error);
    return <ProfileUnavailable />;
  }

  if (!user || !user.isPublic) notFound();

  let allSessions: Awaited<ReturnType<typeof prisma.session.findMany>> = [];
  let proofs: Awaited<ReturnType<typeof prisma.proofObject.findMany>> = [];

  try {
    [allSessions, proofs] = await Promise.all([
      prisma.session.findMany({
        where: { userId: user.id },
        orderBy: { startTime: "desc" },
        take: 200,
      }),
      prisma.proofObject.findMany({
        where: { userId: user.id, isPublic: true },
        orderBy: { shippedAt: "desc" },
        take: 10,
      }),
    ]);
  } catch (error) {
    console.error("Profile activity unavailable:", error);
  }

  const publicSessions = allSessions.filter((session) =>
    isPublicSession(session, user)
  );

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const weeklySecs = publicSessions
    .filter((session) => session.startTime >= weekAgo)
    .reduce((sum, session) => sum + session.durationSecs, 0);
  const weeklyDisplay =
    weeklySecs >= 3600
      ? `${Math.round((weeklySecs / 3600) * 10) / 10}h`
      : `${Math.round(weeklySecs / 60)}m`;

  const shippedThisWeek = proofs.filter(
    (proof) => proof.shippedAt >= weekAgo
  ).length;
  const sessionsThisWeek = publicSessions.filter(
    (session) => session.startTime >= weekAgo
  ).length;

  const appTotals = new Map<string, number>();
  for (const session of publicSessions) {
    appTotals.set(
      session.appName,
      (appTotals.get(session.appName) || 0) + session.durationSecs
    );
  }

  const appData = Array.from(appTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([appName, secs]) => ({
      appName,
      totalHours:
        secs >= 3600
          ? Math.round((secs / 3600) * 10) / 10
          : Math.round(secs / 60),
      suffix: secs >= 3600 ? "hrs" : "min",
    }));

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const streakDates = Array.from(
    new Set(
      publicSessions.map((session) => {
        const d = new Date(session.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })
    )
  ).sort((a, b) => b - a);
  for (let i = 0; i < streakDates.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    expected.setHours(0, 0, 0, 0);
    if (streakDates[i] === expected.getTime()) streak++;
    else break;
  }

  const serializedSessions = publicSessions.slice(0, 10).map((s) => ({
    id: s.id,
    appName: s.appName,
    projectName: s.projectName,
    windowTitle: publicWindowTitle(s.windowTitle, user.redactWindowTitles),
    startTime: s.startTime.toISOString(),
    durationSecs: s.durationSecs,
    source: s.source,
    confidence: s.confidence,
  }));

  return (
    <div className="vc-shell flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="border-b border-white/10 bg-white/[0.02]">
          <div className="vc-container grid gap-6 py-8 md:py-12 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="vc-panel p-6 md:p-8">
              <div className="vc-chip vc-chip-mint mb-5">
                <BadgeCheck className="size-3.5" />
                Verified builder profile
              </div>
              <ProfileHeader
                displayName={user.displayName}
                username={user.username}
                bio={user.bio}
                avatarUrl={user.avatarUrl}
                role={user.role}
                githubUrl={user.githubUrl}
                twitterUrl={user.twitterUrl}
                websiteUrl={user.websiteUrl}
              />
              <div className="mt-5">
                <LiveIndicator username={user.username} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatTile
                label="Build Streak"
                value={streak}
                icon={<Flame className="size-4" />}
                tone="text-amber-300"
              />
              <StatTile
                label="This Week"
                value={weeklyDisplay}
                icon={<Activity className="size-4" />}
                tone="text-sky-300"
              />
              <StatTile
                label="Shipped"
                value={shippedThisWeek}
                icon={<Rocket className="size-4" />}
                tone="text-emerald-300"
              />
              <StatTile
                label="Sessions"
                value={sessionsThisWeek}
                icon={<Radio className="size-4" />}
                tone="text-indigo-300"
              />
            </div>
          </div>
        </section>

        <div className="vc-container grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-8">
            <section className="vc-panel p-5">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="vc-section-title">Activity</p>
                  <h2 className="mt-1 font-mono text-xl font-semibold">
                    Public build heatmap
                  </h2>
                </div>
                <span className="vc-chip">Curated sessions</span>
              </div>
              <ActivityHeatmap username={user.username} />
            </section>

            <section>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="vc-section-title">Recent projects</p>
                  <h2 className="mt-1 font-mono text-xl font-semibold">
                    Proof objects
                  </h2>
                </div>
                <span className="vc-chip vc-chip-mint">
                  {proofs.length} public
                </span>
              </div>
              <ProofList proofs={proofs} emptyLabel="No public proof objects yet." />
            </section>
          </div>

          <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
            <section>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="vc-section-title">Top tools</p>
                  <h2 className="mt-1 font-mono text-xl font-semibold">
                    Build stack
                  </h2>
                </div>
                <Terminal className="size-5 text-sky-300" />
              </div>
              <div className="space-y-3">
                {appData.length > 0 ? (
                  appData.map((app) => (
                    <div
                      key={app.appName}
                      className="vc-panel vc-focus-ring flex items-center gap-4 p-4"
                    >
                      <AppIcon appName={app.appName} size="lg" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-foreground">
                          {app.appName}
                        </p>
                        <p className="font-mono text-lg font-bold text-emerald-200">
                          {app.totalHours}
                          <span className="ml-1 text-xs font-normal text-muted-foreground">
                            {app.suffix}
                          </span>
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="vc-panel p-5 text-sm text-muted-foreground">
                    No public tool data yet.
                  </div>
                )}
              </div>
            </section>

            {appData.length > 0 && (
              <section className="vc-panel p-5">
                <div className="mb-4">
                  <p className="vc-section-title">Tool mix</p>
                  <h2 className="mt-1 font-mono text-xl font-semibold">
                    Weekly share
                  </h2>
                </div>
                <AppBreakdown data={appData} />
              </section>
            )}

            <section>
              <div className="mb-4">
                <p className="vc-section-title">Recent sessions</p>
                <h2 className="mt-1 font-mono text-xl font-semibold">
                  Focus stream
                </h2>
              </div>
              <SessionList sessions={serializedSessions} />
            </section>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
