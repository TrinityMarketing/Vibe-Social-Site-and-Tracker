"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";

const features = [
  {
    title: "Track",
    description:
      "Auto-detect your coding activity across Cursor, VS Code, Claude Code, and more. Zero config.",
    icon: "⏱",
  },
  {
    title: "Showcase",
    description:
      "Beautiful public profile with verified build hours, app breakdown, and streaks.",
    icon: "📊",
  },
  {
    title: "Get Hired",
    description:
      "Prove your skills with real data. Recruiters can verify your actual coding time.",
    icon: "🚀",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden px-4 py-24 md:py-32">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#00ff8810_0%,_transparent_70%)]" />
          <div className="relative mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <p className="mb-4 font-mono text-sm text-neon">
                The LinkedIn for vibe coders
              </p>
              <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl">
                Track your build time.
                <br />
                <span className="text-neon">Prove your grind.</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
                VibeClock auto-tracks your coding sessions across every tool you use.
                Build your developer profile with verified, real-time proof of how much
                you&apos;ve actually built.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
            >
              <Link
                href="/sign-up"
                className="rounded-lg bg-neon px-8 py-3 font-medium text-black transition hover:bg-neon/90"
              >
                Create Free Profile
              </Link>
              <Link
                href="#features"
                className="rounded-lg border border-border px-8 py-3 font-medium text-foreground transition hover:bg-muted"
              >
                Learn More
              </Link>
            </motion.div>

            {/* Live counter mockup */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="mx-auto mt-16 max-w-sm rounded-xl border border-border bg-card p-6"
            >
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-neon" />
                </span>
                <span className="font-mono text-sm text-muted-foreground">
                  Tracking active session
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-mono text-5xl font-bold text-neon">2:47</span>
                <span className="text-muted-foreground">hrs today</span>
              </div>
              <p className="mt-2 font-mono text-sm text-muted-foreground">
                Cursor — vibeclock/apps/web
              </p>
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-t border-border px-4 py-24">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-12 text-center font-mono text-3xl font-bold">
              How it works
            </h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="rounded-xl border border-border bg-card p-6"
                >
                  <span className="text-3xl">{feature.icon}</span>
                  <h3 className="mt-4 font-mono text-xl font-semibold text-neon">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="border-t border-border px-4 py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-mono text-3xl font-bold">
              Join the builders who <span className="text-neon">ship</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Stop claiming you code. Start proving it. VibeClock gives you verifiable
              proof of your development time — the ultimate builder credential.
            </p>
            <Link
              href="/sign-up"
              className="mt-8 inline-block rounded-lg bg-neon px-8 py-3 font-medium text-black transition hover:bg-neon/90"
            >
              Get Started — It&apos;s Free
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
