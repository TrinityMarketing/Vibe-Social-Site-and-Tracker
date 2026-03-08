import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
    const { displayName, bio, githubUrl, twitterUrl, websiteUrl, isPublic } = body;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(displayName !== undefined && { displayName }),
        ...(bio !== undefined && { bio: bio || null }),
        ...(githubUrl !== undefined && { githubUrl: githubUrl || null }),
        ...(twitterUrl !== undefined && { twitterUrl: twitterUrl || null }),
        ...(websiteUrl !== undefined && { websiteUrl: websiteUrl || null }),
        ...(isPublic !== undefined && { isPublic }),
      },
    });

    return NextResponse.json({
      displayName: updated.displayName,
      bio: updated.bio || "",
      githubUrl: updated.githubUrl || "",
      twitterUrl: updated.twitterUrl || "",
      websiteUrl: updated.websiteUrl || "",
      isPublic: updated.isPublic,
      apiKey: updated.apiKey,
    });
  } catch (error) {
    console.error("Profile PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
