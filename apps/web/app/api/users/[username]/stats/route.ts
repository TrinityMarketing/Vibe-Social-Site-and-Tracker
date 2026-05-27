import { prisma } from "@/lib/prisma";
import { isPublicSession } from "@/lib/privacy";
import { NextResponse } from "next/server";
import type { UserStats } from "@vibeclock/shared";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { username: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { username: params.username },
    });

    if (!user || !user.isPublic) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const allSessions = await prisma.session.findMany({
      where: { userId: user.id },
      select: {
        appName: true,
        projectName: true,
        windowTitle: true,
        startTime: true,
        date: true,
        durationSecs: true,
      },
    });

    const publicSessions = allSessions.filter((session) =>
      isPublicSession(session, user)
    );

    const totalSecs = publicSessions.reduce(
      (sum, session) => sum + session.durationSecs,
      0
    );
    const totalHours = Math.round((totalSecs / 3600) * 10) / 10;

    // Weekly hours (last 7 days, wall-clock)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weeklySecs = publicSessions
      .filter((session) => session.startTime >= weekAgo)
      .reduce((sum, session) => sum + session.durationSecs, 0);
    const weeklyHours = Math.round((weeklySecs / 3600) * 10) / 10;

    // Top apps
    const appTotals = new Map<string, number>();
    for (const session of publicSessions) {
      appTotals.set(
        session.appName,
        (appTotals.get(session.appName) || 0) + session.durationSecs
      );
    }
    const topApps = Array.from(appTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([appName, secs]) => ({
        appName,
        totalHours: Math.round((secs / 3600) * 10) / 10,
      }));

    // Streak calculation
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dates = publicSessions.map((s) => {
      const d = new Date(s.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    });

    const uniqueDates = Array.from(new Set(dates)).sort((a, b) => b - a);

    for (let i = 0; i < uniqueDates.length; i++) {
      const expected = new Date(today);
      expected.setDate(expected.getDate() - i);
      expected.setHours(0, 0, 0, 0);

      if (uniqueDates[i] === expected.getTime()) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Weekly breakdown (last 7 days)
    const weeklyBreakdown: { day: string; hours: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStart = new Date(d.toISOString().split("T")[0]);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const daySecs = publicSessions
        .filter((session) => session.startTime >= dayStart && session.startTime < dayEnd)
        .reduce((sum, session) => sum + session.durationSecs, 0);

      weeklyBreakdown.push({
        day: dayStart.toLocaleDateString("en-US", { weekday: "short" }),
        hours: Math.round((daySecs / 3600) * 10) / 10,
      });
    }

    const stats: UserStats = {
      totalHours,
      currentStreak,
      longestStreak: currentStreak, // Simplified for MVP
      weeklyHours,
      topApps,
      weeklyBreakdown,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
