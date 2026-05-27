"use client";

import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { Activity, Gauge, Home, Search, Settings, Sparkles } from "lucide-react";

const navItems = [
  { href: "/feed", label: "Feed", icon: Activity },
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Navbar() {
  const { isSignedIn } = useUser();
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-background/78 backdrop-blur-xl">
      <div className="vc-container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-lg border border-emerald-400/20 bg-emerald-400/10 text-emerald-300 shadow-[0_0_24px_rgba(52,211,153,0.16)]">
              <Sparkles className="size-4" />
            </div>
            <span className="font-mono text-lg font-bold text-foreground">
              Vibe<span className="text-emerald-300">Clock</span>
            </span>
          </Link>

          {isSignedIn && (
            <div className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm transition ${
                      active
                        ? "border border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                        : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
                    }`}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="hidden min-w-0 flex-1 justify-center lg:flex">
          <div className="flex h-9 w-full max-w-md items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-3 text-sm text-muted-foreground">
            <Search className="size-4" />
            <span className="truncate">Search builders, projects, tools...</span>
            <span className="ml-auto rounded border border-white/10 px-1.5 py-0.5 font-mono text-[10px]">
              Ctrl K
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isSignedIn ? (
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8",
                },
              }}
            />
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="hidden items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground sm:inline-flex"
              >
                <Home className="size-4" />
                Home
              </Link>
              <Link
                href="/feed"
                className="text-sm text-muted-foreground transition hover:text-foreground"
              >
                Feed
              </Link>
              <Link
                href="/sign-in"
                className="text-sm text-muted-foreground transition hover:text-foreground"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="rounded-lg bg-emerald-300 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-200"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
