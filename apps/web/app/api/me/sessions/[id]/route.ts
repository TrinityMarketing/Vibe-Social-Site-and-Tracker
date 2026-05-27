import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateDailyRollup } from "@/lib/rollup";
import { NextResponse } from "next/server";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await prisma.session.findFirst({
      where: { id: params.id, userId: user.id },
      select: { id: true, date: true },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    await prisma.session.delete({ where: { id: session.id } });
    await updateDailyRollup(user.id, session.date);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Session DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
