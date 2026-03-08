import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const RESERVED_USERNAMES = [
  "dashboard",
  "settings",
  "onboarding",
  "sign-in",
  "sign-up",
  "api",
  "leaderboard",
  "explore",
  "admin",
  "about",
  "help",
  "support",
  "blog",
  "pricing",
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json({ available: false, error: "Username required" });
  }

  if (!/^[a-zA-Z0-9_-]{3,20}$/.test(username)) {
    return NextResponse.json({
      available: false,
      error: "3-20 characters, letters, numbers, _ or -",
    });
  }

  if (RESERVED_USERNAMES.includes(username.toLowerCase())) {
    return NextResponse.json({ available: false, error: "This username is reserved" });
  }

  const existing = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
  });

  return NextResponse.json({ available: !existing });
}
