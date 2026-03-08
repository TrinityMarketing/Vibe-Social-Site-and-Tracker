"use client";

import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";

export function Navbar() {
  const { isSignedIn } = useUser();

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-3 w-3 animate-pulse rounded-full bg-neon" />
            <span className="font-mono text-xl font-bold text-foreground">
              Vibe<span className="text-neon">Clock</span>
            </span>
          </Link>

          {isSignedIn && (
            <div className="hidden items-center gap-6 md:flex">
              <Link
                href="/dashboard"
                className="text-sm text-muted-foreground transition hover:text-foreground"
              >
                Dashboard
              </Link>
              <Link
                href="/settings"
                className="text-sm text-muted-foreground transition hover:text-foreground"
              >
                Settings
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
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
                href="/sign-in"
                className="text-sm text-muted-foreground transition hover:text-foreground"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="rounded-md bg-neon px-4 py-2 text-sm font-medium text-black transition hover:bg-neon/90"
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
