import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { PresenceStatus } from "@vibeclock/shared";

export const dynamic = "force-dynamic";

const STALE_THRESHOLD_MS = 45_000; // 45 seconds

export async function GET(
  _req: Request,
  { params }: { params: { username: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { username: params.username },
      select: { isPublic: true, lastSeenAt: true, currentApp: true, isLive: true },
    });

    if (!user || !user.isPublic) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isLive =
      user.isLive &&
      user.lastSeenAt !== null &&
      Date.now() - user.lastSeenAt.getTime() < STALE_THRESHOLD_MS;

    const status: PresenceStatus = {
      isLive,
      currentApp: isLive ? user.currentApp : null,
      lastSeenAt: user.lastSeenAt?.toISOString() ?? null,
    };

    return NextResponse.json(status);
  } catch (error) {
    console.error("Presence status error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
