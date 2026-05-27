"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  EyeOff,
  GitBranch,
  Lock,
  Rocket,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";

const pillars = [
  {
    title: "Verified sessions",
    description: "Capture tools, projects, sources, and confidence without turning hours into a leaderboard.",
    icon: Activity,
  },
  {
    title: "Proof objects",
    description: "Attach repos, PRs, demos, deployments, screenshots, changelogs, and build notes.",
    icon: GitBranch,
  },
  {
    title: "Privacy controls",
    description: "Pause tracking, hide apps, redact titles, and keep private projects out of public view.",
    icon: ShieldCheck,
  },
];

const proofEvents = [
  { label: "Shipped demo", meta: "VibeSync dashboard", icon: Rocket, tone: "text-emerald-300" },
  { label: "Merged PR #142", meta: "session intelligence", icon: GitBranch, tone: "text-sky-300" },
  { label: "Logged focus", meta: "Cursor + Terminal", icon: Terminal, tone: "text-amber-300" },
];

export default function LandingPage() {
  return (
    <div className="vc-shell flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="relative min-h-[calc(100svh-6rem)] overflow-hidden border-b border-white/10">
          <Image
            src="/images/vibeclock-command-concept.png"
            alt="VibeClock command center interface preview"
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,hsl(var(--background))_0%,rgba(3,7,13,0.86)_38%,rgba(3,7,13,0.35)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,7,13,0.05)_0%,hsl(var(--background))_95%)]" />

          <div className="vc-container relative flex min-h-[calc(100svh-6rem)] items-center py-12 md:py-20">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="max-w-3xl"
            >
              <div className="vc-chip vc-chip-mint mb-6">
                <BadgeCheck className="size-3.5" />
                Verified activity layer for AI-native builders
              </div>
              <h1 className="max-w-3xl text-5xl font-bold leading-[1.02] tracking-normal text-foreground md:text-7xl">
                Turn shipped work into a public proof profile.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                VibeClock connects coding sessions, tools, source confidence, and
                shipped artifacts into one profile that feels useful, private, and
                credible.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/sign-up"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-300 px-5 font-semibold text-black transition hover:bg-emerald-200"
                >
                  Create proof profile
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/feed"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/12 bg-white/[0.045] px-5 font-semibold text-foreground transition hover:bg-white/[0.075]"
                >
                  View proof feed
                </Link>
              </div>

              <div className="mt-10 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  ["21", "sessions this week"],
                  ["95%", "editor confidence"],
                  ["3", "proof events shipped"],
                ].map(([value, label]) => (
                  <div key={label} className="vc-panel-soft p-4">
                    <p className="font-mono text-2xl font-bold text-foreground">
                      {value}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <section className="vc-container py-20">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="vc-section-title">Proof, not performative hours</p>
              <h2 className="mt-3 max-w-xl text-3xl font-bold tracking-normal md:text-5xl">
                Built for the messy reality of AI-assisted work.
              </h2>
              <p className="mt-4 max-w-xl text-muted-foreground">
                Desktop signals are useful, but they are not the whole story. VibeClock
                pairs activity with proof objects and confidence levels so profiles
                can evolve toward stronger integrations over time.
              </p>
            </div>

            <div className="grid gap-3">
              {pillars.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <div key={pillar.title} className="vc-panel vc-focus-ring p-5">
                    <div className="flex gap-4">
                      <div className="grid size-10 shrink-0 place-items-center rounded-lg border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <h3 className="font-mono text-lg font-semibold">
                          {pillar.title}
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {pillar.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-white/[0.025]">
          <div className="vc-container grid gap-8 py-20 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="vc-panel overflow-hidden p-0">
              <div className="border-b border-white/10 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="vc-section-title">Proof timeline</p>
                    <h2 className="mt-1 text-2xl font-bold">Mason shipped this week</h2>
                  </div>
                  <span className="vc-chip vc-chip-sky">Public profile</span>
                </div>
              </div>
              <div className="divide-y divide-white/10">
                {proofEvents.map((event) => {
                  const Icon = event.icon;
                  return (
                    <div key={event.label} className="flex items-center gap-4 p-5">
                      <div className={`grid size-11 place-items-center rounded-lg border border-white/10 bg-white/[0.045] ${event.tone}`}>
                        <Icon className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-mono font-semibold text-foreground">
                          {event.label}
                        </p>
                        <p className="text-sm text-muted-foreground">{event.meta}</p>
                      </div>
                      <span className="vc-chip">Verified activity</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4">
              <div className="vc-panel p-5">
                <div className="flex items-center gap-3">
                  <Lock className="size-5 text-emerald-300" />
                  <div>
                    <h3 className="font-mono font-semibold">Private by default</h3>
                    <p className="text-sm text-muted-foreground">
                      Redact window titles and hide sensitive projects.
                    </p>
                  </div>
                </div>
                <div className="mt-5 space-y-3">
                  {["Pause tracking", "Private projects", "Excluded apps"].map((item) => (
                    <div key={item} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.035] p-3 text-sm">
                      <span className="text-muted-foreground">{item}</span>
                      <span className="h-2 w-8 rounded-full bg-emerald-300/70" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="vc-panel p-5">
                <div className="flex items-center gap-3">
                  <EyeOff className="size-5 text-amber-300" />
                  <div>
                    <h3 className="font-mono font-semibold">No total-hours ranking</h3>
                    <p className="text-sm text-muted-foreground">
                      Profiles lead with shipped work, build streaks, and proof links.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="vc-container py-20 text-center">
          <p className="vc-section-title">Ready for a proof layer</p>
          <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-bold md:text-5xl">
            Show what you are building without exposing what should stay private.
          </h2>
          <div className="mt-8">
            <Link
              href="/sign-up"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-300 px-5 font-semibold text-black transition hover:bg-emerald-200"
            >
              Start building proof
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
