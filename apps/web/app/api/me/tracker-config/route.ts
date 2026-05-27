import { getUserByApiKey } from "@/lib/auth";
import { asStringArray } from "@/lib/privacy";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing API key" }, { status: 401 });
    }

    const user = await getUserByApiKey(authHeader.slice(7));
    if (!user) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    return NextResponse.json({
      showPresence: user.showPresence,
      trackingPaused: user.trackingPaused,
      redactWindowTitles: user.redactWindowTitles,
      excludedApps: asStringArray(user.excludedApps),
      hiddenApps: asStringArray(user.hiddenApps),
      privateProjects: asStringArray(user.privateProjects),
      currentProject: user.currentProject,
    });
  } catch (error) {
    console.error("Tracker config error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
