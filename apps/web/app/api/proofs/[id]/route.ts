import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { ProofObjectPayload } from "@vibeclock/shared";

function textOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function parseOptionalDate(value: unknown): Date | undefined {
  if (typeof value !== "string" || !value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: ProofObjectPayload = await req.json();
    const proof = await prisma.proofObject.updateMany({
      where: { id: params.id, userId: user.id },
      data: {
        ...(body.title !== undefined && { title: textOrNull(body.title) || "" }),
        ...(body.projectName !== undefined && {
          projectName: textOrNull(body.projectName),
        }),
        ...(body.kind !== undefined && {
          kind: textOrNull(body.kind) || "build_note",
        }),
        ...(body.summary !== undefined && { summary: textOrNull(body.summary) }),
        ...(body.note !== undefined && { note: textOrNull(body.note) }),
        ...(body.repoUrl !== undefined && { repoUrl: textOrNull(body.repoUrl) }),
        ...(body.pullRequestUrl !== undefined && {
          pullRequestUrl: textOrNull(body.pullRequestUrl),
        }),
        ...(body.deploymentUrl !== undefined && {
          deploymentUrl: textOrNull(body.deploymentUrl),
        }),
        ...(body.demoUrl !== undefined && { demoUrl: textOrNull(body.demoUrl) }),
        ...(body.screenshotUrl !== undefined && {
          screenshotUrl: textOrNull(body.screenshotUrl),
        }),
        ...(body.changelogUrl !== undefined && {
          changelogUrl: textOrNull(body.changelogUrl),
        }),
        ...(body.commitRange !== undefined && {
          commitRange: textOrNull(body.commitRange),
        }),
        ...(body.shippedAt !== undefined && {
          shippedAt: parseOptionalDate(body.shippedAt),
        }),
        ...(body.isPublic !== undefined && { isPublic: body.isPublic }),
      },
    });

    if (proof.count === 0) {
      return NextResponse.json({ error: "Proof not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Proof PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const proof = await prisma.proofObject.deleteMany({
      where: { id: params.id, userId: user.id },
    });

    if (proof.count === 0) {
      return NextResponse.json({ error: "Proof not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Proof DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
