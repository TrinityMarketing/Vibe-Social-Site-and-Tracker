import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
    });
    if (existing) {
      return NextResponse.json({ error: "User already onboarded" }, { status: 400 });
    }

    const body = await req.json();
    const { username, role, bio } = body;

    // Validate username
    if (!username || !/^[a-zA-Z0-9_-]{3,20}$/.test(username)) {
      return NextResponse.json(
        { error: "Username must be 3-20 characters (letters, numbers, _, -)" },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ["builder", "engineer", "ai_expert"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Check username availability
    const taken = await prisma.user.findUnique({ where: { username } });
    if (taken) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: {
        clerkId: clerkUser.id,
        username,
        displayName: clerkUser.firstName
          ? `${clerkUser.firstName} ${clerkUser.lastName || ""}`.trim()
          : username,
        bio: bio || null,
        role,
        avatarUrl: clerkUser.imageUrl,
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        apiKey: user.apiKey,
      },
    });
  } catch (error) {
    console.error("Onboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
