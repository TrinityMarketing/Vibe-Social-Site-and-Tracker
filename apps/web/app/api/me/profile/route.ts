import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { asStringArray, normalizeList } from "@/lib/privacy";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      displayName: user.displayName,
      bio: user.bio || "",
      githubUrl: user.githubUrl || "",
      twitterUrl: user.twitterUrl || "",
      websiteUrl: user.websiteUrl || "",
      isPublic: user.isPublic,
      showPresence: user.showPresence,
      trackingPaused: user.trackingPaused,
      redactWindowTitles: user.redactWindowTitles,
      excludedApps: asStringArray(user.excludedApps),
      hiddenApps: asStringArray(user.hiddenApps),
      privateProjects: asStringArray(user.privateProjects),
      currentProject: user.currentProject || "",
      apiKey: user.apiKey,
    });
  } catch (error) {
    console.error("Profile GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      displayName,
      bio,
      githubUrl,
      twitterUrl,
      websiteUrl,
      isPublic,
      showPresence,
      trackingPaused,
      redactWindowTitles,
      excludedApps,
      hiddenApps,
      privateProjects,
      currentProject,
    } = body;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(displayName !== undefined && { displayName }),
        ...(bio !== undefined && { bio: bio || null }),
        ...(githubUrl !== undefined && { githubUrl: githubUrl || null }),
        ...(twitterUrl !== undefined && { twitterUrl: twitterUrl || null }),
        ...(websiteUrl !== undefined && { websiteUrl: websiteUrl || null }),
        ...(isPublic !== undefined && { isPublic }),
        ...(showPresence !== undefined && { showPresence }),
        ...(trackingPaused !== undefined && { trackingPaused }),
        ...(redactWindowTitles !== undefined && { redactWindowTitles }),
        ...(excludedApps !== undefined && {
          excludedApps: normalizeList(excludedApps),
        }),
        ...(hiddenApps !== undefined && { hiddenApps: normalizeList(hiddenApps) }),
        ...(privateProjects !== undefined && {
          privateProjects: normalizeList(privateProjects),
        }),
        ...(currentProject !== undefined && {
          currentProject: currentProject || null,
        }),
        ...((trackingPaused === true || showPresence === false) && {
          isLive: false,
        }),
      },
    });

    return NextResponse.json({
      displayName: updated.displayName,
      bio: updated.bio || "",
      githubUrl: updated.githubUrl || "",
      twitterUrl: updated.twitterUrl || "",
      websiteUrl: updated.websiteUrl || "",
      isPublic: updated.isPublic,
      showPresence: updated.showPresence,
      trackingPaused: updated.trackingPaused,
      redactWindowTitles: updated.redactWindowTitles,
      excludedApps: asStringArray(updated.excludedApps),
      hiddenApps: asStringArray(updated.hiddenApps),
      privateProjects: asStringArray(updated.privateProjects),
      currentProject: updated.currentProject || "",
      apiKey: updated.apiKey,
    });
  } catch (error) {
    console.error("Profile PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
