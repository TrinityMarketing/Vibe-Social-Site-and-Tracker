import { prisma } from "@/lib/prisma";
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

    // Total hours
    const totalResult = await prisma.session.aggregate({
      where: { userId: user.id },
      _sum: { durationSecs: true },
    });
    const totalHours = Math.round((totalResult._sum.durationSecs || 0) / 3600 * 10) / 10;

    // Weekly hours (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weeklyResult = await prisma.session.aggregate({
      where: { userId: user.id, startTime: { gte: weekAgo } },
      _sum: { durationSecs: true },
    });
    const weeklyHours = Math.round((weeklyResult._sum.durationSecs || 0) / 3600 * 10) / 10;

    // Top apps
    const topAppsRaw = await prisma.session.groupBy({
      by: ["appName"],
      where: { userId: user.id },
      _sum: { durationSecs: true },
      orderBy: { _sum: { durationSecs: "desc" } },
      take: 5,
    });
    const topApps = topAppsRaw.map((a) => ({
      appName: a.appName,
      totalHours: Math.round((a._sum.durationSecs || 0) / 3600 * 10) / 10,
    }));

    // Streak calculation
    const sessions = await prisma.session.findMany({
      where: { userId: user.id },
      select: { date: true },
      distinct: ["date"],
      orderBy: { date: "desc" },
    });

    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dates = sessions.map((s) => {
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

      const dayResult = await prisma.session.aggregate({
        where: {
          userId: user.id,
          startTime: { gte: dayStart, lt: dayEnd },
        },
        _sum: { durationSecs: true },
      });

      weeklyBreakdown.push({
        day: dayStart.toLocaleDateString("en-US", { weekday: "short" }),
        hours: Math.round((dayResult._sum.durationSecs || 0) / 3600 * 10) / 10,
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
