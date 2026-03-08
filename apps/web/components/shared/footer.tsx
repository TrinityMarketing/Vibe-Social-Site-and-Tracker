import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background py-8">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-neon" />
            <span className="font-mono text-sm text-muted-foreground">
              VibeClock
            </span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/" className="transition hover:text-foreground">
              Home
            </Link>
            <Link href="/dashboard" className="transition hover:text-foreground">
              Dashboard
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} VibeClock
          </p>
        </div>
      </div>
    </footer>
  );
}
