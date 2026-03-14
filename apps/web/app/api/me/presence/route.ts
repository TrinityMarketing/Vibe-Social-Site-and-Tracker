import { prisma } from "@/lib/prisma";
import { getUserByApiKey } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing API key" }, { status: 401 });
    }

    const apiKey = authHeader.slice(7);
    const user = await getUserByApiKey(apiKey);
    if (!user) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    const body = await req.json();
    const appName = body.appName || null;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastSeenAt: new Date(),
        currentApp: appName,
        isLive: true,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Presence error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
