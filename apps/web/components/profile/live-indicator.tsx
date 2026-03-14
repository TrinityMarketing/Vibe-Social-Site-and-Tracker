"use client";

import { useEffect, useState } from "react";

interface Props {
  username: string;
}

export function LiveIndicator({ username }: Props) {
  const [isLive, setIsLive] = useState(false);
  const [currentApp, setCurrentApp] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchPresence() {
      try {
        const res = await fetch(`/api/users/${username}/presence`);
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;
        setIsLive(data.isLive);
        setCurrentApp(data.currentApp);
      } catch {
        // ignore
      }
    }

    fetchPresence();
    const interval = setInterval(fetchPresence, 15_000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [username]);

  if (!isLive) return null;

  return (
    <div className="flex items-center gap-2 rounded-full border border-neon/20 bg-neon/5 px-3 py-1.5">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-neon" />
      </span>
      <span className="font-mono text-sm text-neon">
        Coding in {currentApp}
      </span>
    </div>
  );
}
