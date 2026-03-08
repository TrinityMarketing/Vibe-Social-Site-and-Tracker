import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { apiKey: randomUUID() },
    });

    return NextResponse.json({ apiKey: updated.apiKey });
  } catch (error) {
    console.error("API key rotate error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
