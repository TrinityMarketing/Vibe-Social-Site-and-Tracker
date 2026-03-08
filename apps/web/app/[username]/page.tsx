export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { ProfileHeader } from "@/components/profile/profile-header";
import { HoursBadge } from "@/components/profile/hours-badge";
import { AppBreakdown } from "@/components/profile/app-breakdown";
import { SessionList } from "@/components/dashboard/session-list";
import { Separator } from "@/components/ui/separator";

// Reserved paths that should NOT be caught by the [username] route
const RESERVED = [
  "dashboard",
  "settings",
  "onboarding",
  "sign-in",
  "sign-up",
  "api",
  "leaderboard",
  "explore",
  "_next",
];

interface Props {
  params: { username: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const user = await prisma.user.findUnique({
    where: { username: params.username },
  });

  if (!user) return { title: "User Not Found — VibeClock" };

  return {
    title: `${user.displayName} (@${user.username}) — VibeClock`,
    description: user.bio || `Check out ${user.displayName}'s coding stats on VibeClock.`,
  };
}

export default async function PublicProfilePage({ params }: Props) {
  if (RESERVED.includes(params.username)) notFound();

  const user = await prisma.user.findUnique({
    where: { username: params.username },
  });

  if (!user || !user.isPublic) notFound();

  // Fetch stats
  const [totalResult, topApps, recentSessions, streakDates] = await Promise.all([
    prisma.session.aggregate({
      where: { userId: user.id },
      _sum: { durationSecs: true },
    }),
    prisma.session.groupBy({
      by: ["appName"],
      where: { userId: user.id },
      _sum: { durationSecs: true },
      orderBy: { _sum: { durationSecs: "desc" } },
      take: 5,
    }),
    prisma.session.findMany({
      where: { userId: user.id },
      orderBy: { startTime: "desc" },
      take: 10,
    }),
    prisma.session.findMany({
      where: { userId: user.id },
      select: { date: true },
      distinct: ["date"],
      orderBy: { date: "desc" },
    }),
  ]);

  const totalSecs = totalResult._sum.durationSecs || 0;
  const totalHours = totalSecs >= 3600
    ? Math.round((totalSecs / 3600) * 10) / 10
    : Math.round(totalSecs / 60);
  const totalSuffix = totalSecs >= 3600 ? "hours" : "min";

  const appData = topApps.map((a) => {
    const secs = a._sum.durationSecs || 0;
    return {
      appName: a.appName,
      totalHours: secs >= 3600
        ? Math.round((secs / 3600) * 10) / 10
        : Math.round(secs / 60),
      suffix: secs >= 3600 ? "hrs" : "min",
    };
  });

  // Streak
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < streakDates.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    expected.setHours(0, 0, 0, 0);
    const d = new Date(streakDates[i].date);
    d.setHours(0, 0, 0, 0);
    if (d.getTime() === expected.getTime()) streak++;
    else break;
  }

  const serializedSessions = recentSessions.map((s) => ({
    id: s.id,
    appName: s.appName,
    windowTitle: s.windowTitle,
    startTime: s.startTime.toISOString(),
    durationSecs: s.durationSecs,
  }));

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="flex flex-col items-center gap-8 md:flex-row md:items-start md:justify-between">
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
            <HoursBadge hours={totalHours} suffix={totalSuffix} />
          </div>

          <div className="mt-6 flex gap-6 text-center">
            <div>
              <p className="font-mono text-2xl font-bold text-neon">{streak}</p>
              <p className="text-sm text-muted-foreground">Day Streak</p>
            </div>
            <div>
              <p className="font-mono text-2xl font-bold">{totalHours}</p>
              <p className="text-sm text-muted-foreground">Total Hours</p>
            </div>
          </div>

          <Separator className="my-8" />

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div>
              <h2 className="mb-4 font-mono text-lg font-semibold">App Breakdown</h2>
              <AppBreakdown data={appData} />
            </div>
            <div>
              <h2 className="mb-4 font-mono text-lg font-semibold">Recent Sessions</h2>
              <SessionList sessions={serializedSessions} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
