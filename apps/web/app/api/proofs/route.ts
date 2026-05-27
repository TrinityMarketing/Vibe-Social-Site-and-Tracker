import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { ProofObjectPayload } from "@vibeclock/shared";

function textOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function parseShippedAt(value: unknown): Date {
  if (typeof value !== "string" || !value) return new Date();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const proofs = await prisma.proofObject.findMany({
      where: { userId: user.id },
      orderBy: { shippedAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ proofs });
  } catch (error) {
    console.error("Proof GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: ProofObjectPayload = await req.json();
    const title = textOrNull(body.title);
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const proof = await prisma.proofObject.create({
      data: {
        userId: user.id,
        title,
        projectName: textOrNull(body.projectName),
        kind: textOrNull(body.kind) || "build_note",
        summary: textOrNull(body.summary),
        note: textOrNull(body.note),
        repoUrl: textOrNull(body.repoUrl),
        pullRequestUrl: textOrNull(body.pullRequestUrl),
        deploymentUrl: textOrNull(body.deploymentUrl),
        demoUrl: textOrNull(body.demoUrl),
        screenshotUrl: textOrNull(body.screenshotUrl),
        changelogUrl: textOrNull(body.changelogUrl),
        commitRange: textOrNull(body.commitRange),
        shippedAt: parseShippedAt(body.shippedAt),
        isPublic: body.isPublic ?? true,
      },
    });

    return NextResponse.json({ proof }, { status: 201 });
  } catch (error) {
    console.error("Proof POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
