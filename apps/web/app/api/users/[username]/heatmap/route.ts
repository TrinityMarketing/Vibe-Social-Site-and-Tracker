import { prisma } from "@/lib/prisma";
import { isPublicSession } from "@/lib/privacy";
import { NextResponse } from "next/server";
import type { HeatmapResponse } from "@vibeclock/shared";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { username: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { username: params.username },
    });

    if (!user || !user.isPublic) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const yearAgo = new Date();
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);

    const sessions = await prisma.session.findMany({
      where: { userId: user.id, date: { gte: yearAgo } },
      orderBy: { date: "asc" },
      select: {
        appName: true,
        projectName: true,
        windowTitle: true,
        date: true,
        durationSecs: true,
      },
    });

    const dayMap = new Map<string, { totalSecs: number; appTotals: Map<string, number> }>();
    for (const session of sessions.filter((s) => isPublicSession(s, user))) {
      const key = session.date.toISOString().split("T")[0];
      const entry = dayMap.get(key) || { totalSecs: 0, appTotals: new Map<string, number>() };
      entry.totalSecs += session.durationSecs;
      entry.appTotals.set(
        session.appName,
        (entry.appTotals.get(session.appName) || 0) + session.durationSecs
      );
      dayMap.set(key, entry);
    }

    const response: HeatmapResponse = {
      days: Array.from(dayMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, entry]) => {
          const topApp =
            Array.from(entry.appTotals.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ||
            null;
          return { date, totalSecs: entry.totalSecs, topApp };
        }),
    };

    return NextResponse.json(response, {
      headers: { "Cache-Control": "public, max-age=300" },
    });
  } catch (error) {
    console.error("Heatmap error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
