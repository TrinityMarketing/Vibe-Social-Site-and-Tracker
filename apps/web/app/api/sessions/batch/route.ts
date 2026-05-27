import { prisma } from "@/lib/prisma";
import { getUserByApiKey } from "@/lib/auth";
import {
  asStringArray,
  inferProjectName,
  normalizeConfidence,
  normalizeSource,
} from "@/lib/privacy";
import { updateDailyRollup } from "@/lib/rollup";
import { NextResponse } from "next/server";
import type { BatchSyncRequest, BatchSyncResponse } from "@vibeclock/shared";

export async function POST(req: Request) {
  try {
    // API key auth (NOT Clerk — this is for the desktop app)
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing API key" }, { status: 401 });
    }

    const apiKey = authHeader.slice(7);
    const user = await getUserByApiKey(apiKey);
    if (!user) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    const body: BatchSyncRequest = await req.json();
    const { sessions } = body;

    if (!Array.isArray(sessions) || sessions.length === 0) {
      return NextResponse.json({ error: "No sessions provided" }, { status: 400 });
    }

    // Cap batch size
    if (sessions.length > 100) {
      return NextResponse.json(
        { error: "Max 100 sessions per batch" },
        { status: 400 }
      );
    }

    const errors: string[] = [];
    let synced = 0;
    const excludedApps = asStringArray(user.excludedApps).map((app) =>
      app.toLowerCase()
    );

    for (const session of sessions) {
      try {
        if (user.trackingPaused) {
          continue;
        }

        // Validate required fields
        if (!session.appName || !session.startTime || !session.durationSecs) {
          errors.push(`Invalid session: missing required fields`);
          continue;
        }

        if (excludedApps.includes(session.appName.toLowerCase())) {
          continue;
        }

        const startTime = new Date(session.startTime);
        const endTime = session.endTime ? new Date(session.endTime) : null;
        const source = normalizeSource(session.source);
        const confidence = normalizeConfidence(source, session.confidence);
        const windowTitle = user.redactWindowTitles
          ? null
          : session.windowTitle || null;
        const projectName =
          session.projectName ||
          (!user.redactWindowTitles ? inferProjectName(session.windowTitle) : null) ||
          user.currentProject ||
          null;

        if (isNaN(startTime.getTime())) {
          errors.push(`Invalid startTime: ${session.startTime}`);
          continue;
        }

        // Upsert: if a session with the same startTime + app already exists for this user,
        // update its duration instead of creating a duplicate.
        // This handles active sessions that sync repeatedly before closing.
        const existing = await prisma.session.findFirst({
          where: {
            userId: user.id,
            appName: session.appName,
            startTime,
          },
        });

        if (existing) {
          await prisma.session.update({
            where: { id: existing.id },
            data: {
              durationSecs: session.durationSecs,
              endTime,
              windowTitle: windowTitle || existing.windowTitle,
              projectName,
              source,
              confidence,
              isActive: !endTime,
            },
          });
        } else {
          await prisma.session.create({
            data: {
              userId: user.id,
              appName: session.appName,
              windowTitle,
              projectName,
              startTime,
              endTime,
              durationSecs: session.durationSecs,
              source,
              confidence,
              isActive: !endTime,
              date: new Date(startTime.toISOString().split("T")[0]),
            },
          });
        }

        synced++;
      } catch (err) {
        errors.push(`Failed to sync session: ${(err as Error).message}`);
      }
    }

    // Update daily rollups for affected dates
    const datesToRollup = new Set<string>();
    for (const session of sessions) {
      if (session.startTime) {
        const date = new Date(session.startTime);
        if (!Number.isNaN(date.getTime())) {
          datesToRollup.add(date.toISOString().split("T")[0]);
        }
      }
    }
    for (const dateStr of Array.from(datesToRollup)) {
      try {
        await updateDailyRollup(user.id, new Date(dateStr));
      } catch (err) {
        console.error(`Rollup error for ${dateStr}:`, err);
      }
    }

    const response: BatchSyncResponse = { synced, errors };
    return NextResponse.json(response);
  } catch (error) {
    console.error("Batch sync error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
