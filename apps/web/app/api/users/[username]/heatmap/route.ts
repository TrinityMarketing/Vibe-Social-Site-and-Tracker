import { prisma } from "@/lib/prisma";
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
      select: { id: true, isPublic: true },
    });

    if (!user || !user.isPublic) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const yearAgo = new Date();
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);

    const stats = await prisma.dailyStat.findMany({
      where: { userId: user.id, date: { gte: yearAgo } },
      orderBy: { date: "asc" },
      select: { date: true, totalSecs: true, topApp: true },
    });

    const response: HeatmapResponse = {
      days: stats.map((s) => ({
        date: s.date.toISOString().split("T")[0],
        totalSecs: s.totalSecs,
        topApp: s.topApp,
      })),
    };

    return NextResponse.json(response, {
      headers: { "Cache-Control": "public, max-age=300" },
    });
  } catch (error) {
    console.error("Heatmap error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
