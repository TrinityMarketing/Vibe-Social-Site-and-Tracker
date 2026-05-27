export const dynamic = "force-dynamic";

import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { ProofList } from "@/components/proof/proof-list";
import type { ProofCardData } from "@/components/proof/proof-card";
import { prisma } from "@/lib/prisma";
import {
  BadgeCheck,
  EyeOff,
  Flame,
  GitBranch,
  Lock,
  Rocket,
  ShieldCheck,
  Sparkles,
  Terminal,
} from "lucide-react";

const filters = ["All", "Shipped", "Sessions", "Milestones", "Demos", "Commits"];

function formatKind(kind: string): string {
  return kind
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function FeedUnavailable() {
  return (
    <div className="vc-panel border-amber-400/20 bg-amber-400/[0.06] p-6">
      <div className="flex gap-4">
        <div className="grid size-11 shrink-0 place-items-center rounded-lg border border-amber-400/25 bg-amber-400/10 text-amber-200">
          <ShieldCheck className="size-5" />
        </div>
        <div>
          <h2 className="font-mono text-lg font-semibold text-amber-200">
            Proof feed is offline
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            The app shell is running, but the database connection is not available
            right now. Once Postgres is reachable, public proof objects will show here.
          </p>
        </div>
      </div>
    </div>
  );
}

export default async function ProofFeedPage() {
  let proofs: ProofCardData[] = [];
  let dbUnavailable = false;

  try {
    proofs = await prisma.proofObject.findMany({
      where: {
        isPublic: true,
        user: { isPublic: true },
      },
      include: {
        user: {
          select: {
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { shippedAt: "desc" },
      take: 50,
    });
  } catch (error) {
    dbUnavailable = true;
    console.error("Proof feed unavailable:", error);
  }

  const now = new Date();
  const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
  const shippedThisWeek = proofs.filter(
    (proof) => new Date(proof.shippedAt).getTime() >= weekAgo.getTime()
  ).length;
  const builderCount = new Set(
    proofs.map((proof) => proof.user?.username).filter(Boolean)
  ).size;
  const projectCount = new Set(
    proofs.map((proof) => proof.projectName).filter(Boolean)
  ).size;
  const topKinds: [string, number][] = Object.entries(
    proofs.reduce<Record<string, number>>((acc, proof) => {
      acc[proof.kind] = (acc[proof.kind] || 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div className="vc-shell flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="border-b border-white/10 bg-white/[0.02]">
          <div className="vc-container py-10 md:py-14">
            <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
              <div>
                <div className="vc-chip vc-chip-mint mb-5">
                  <BadgeCheck className="size-3.5" />
                  Verified public activity
                </div>
                <h1 className="max-w-3xl font-mono text-4xl font-bold tracking-normal text-foreground md:text-6xl">
                  Proof Feed
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                  A live social layer for shipped work, focused sessions, demos,
                  repos, and build notes without turning total hours into the flex.
                </p>
              </div>

              <div className="vc-panel-soft p-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="font-mono text-2xl font-bold text-foreground">
                      {dbUnavailable ? "--" : shippedThisWeek}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">this week</p>
                  </div>
                  <div>
                    <p className="font-mono text-2xl font-bold text-foreground">
                      {dbUnavailable ? "--" : builderCount}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">builders</p>
                  </div>
                  <div>
                    <p className="font-mono text-2xl font-bold text-foreground">
                      {dbUnavailable ? "--" : projectCount}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">projects</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-2 overflow-x-auto pb-1">
              {filters.map((filter, index) => (
                <span
                  key={filter}
                  className={index === 0 ? "vc-chip vc-chip-mint shrink-0" : "vc-chip shrink-0"}
                >
                  {filter}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="vc-container grid gap-6 py-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            {dbUnavailable ? (
              <FeedUnavailable />
            ) : (
              <ProofList
                proofs={proofs}
                emptyLabel="No public proof objects yet."
              />
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="vc-panel p-5">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-lg border border-emerald-400/20 bg-emerald-400/10 text-emerald-200">
                  <Lock className="size-5" />
                </div>
                <div>
                  <h2 className="font-mono font-semibold">Public by choice</h2>
                  <p className="text-sm text-muted-foreground">
                    Profiles show curated proof by default.
                  </p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {[
                  ["Private projects", "hidden"],
                  ["Window titles", "redacted"],
                  ["Total-hour rankings", "off"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-sm"
                  >
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-mono text-xs text-emerald-200">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="vc-panel p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-mono font-semibold">Weekly build pulse</h2>
                <Flame className="size-4 text-amber-300" />
              </div>
              <div className="mt-4 grid gap-3">
                <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Rocket className="size-4 text-emerald-300" />
                    Shipped this week
                  </div>
                  <p className="mt-2 font-mono text-2xl font-bold">
                    {dbUnavailable ? "--" : shippedThisWeek}
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Terminal className="size-4 text-sky-300" />
                    Popular proof type
                  </div>
                  <p className="mt-2 truncate font-mono text-lg font-semibold">
                    {topKinds[0] ? formatKind(topKinds[0][0]) : "Waiting for proof"}
                  </p>
                </div>
              </div>
            </div>

            <div className="vc-panel p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-mono font-semibold">Top proof signals</h2>
                <Sparkles className="size-4 text-sky-300" />
              </div>
              <div className="mt-4 space-y-3">
                {(topKinds.length > 0
                  ? topKinds
                  : ([
                      ["repo", 0],
                      ["demo", 0],
                      ["build_note", 0],
                    ] as [string, number][])
                ).map(
                  ([kind, count]) => (
                    <div key={kind} className="flex items-center gap-3">
                      <div className="grid size-8 place-items-center rounded-md border border-white/10 bg-white/[0.04] text-muted-foreground">
                        <GitBranch className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-foreground">
                          {formatKind(kind)}
                        </p>
                        <div className="mt-1 h-1.5 rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-emerald-300"
                            style={{
                              width: `${Math.max(18, Math.min(100, Number(count) * 24))}%`,
                            }}
                          />
                        </div>
                      </div>
                      <span className="font-mono text-xs text-muted-foreground">
                        {count}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="vc-panel-soft p-5">
              <div className="flex items-start gap-3">
                <EyeOff className="mt-0.5 size-5 text-amber-300" />
                <p className="text-sm leading-6 text-muted-foreground">
                  Presence is paired with projects and tools so “currently coding”
                  feels useful instead of performative.
                </p>
              </div>
            </div>
          </aside>
        </section>
      </main>
      <Footer />
    </div>
  );
}
