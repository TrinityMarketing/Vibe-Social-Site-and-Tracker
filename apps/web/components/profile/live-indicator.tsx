"use client";

import { useEffect, useState } from "react";

interface Props {
  username: string;
}

export function LiveIndicator({ username }: Props) {
  const [isLive, setIsLive] = useState(false);
  const [currentApp, setCurrentApp] = useState<string | null>(null);
  const [currentProject, setCurrentProject] = useState<string | null>(null);

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
        setCurrentProject(data.currentProject);
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
    <div className="inline-flex max-w-full items-center gap-2 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-300" />
      </span>
      <span className="truncate font-mono text-sm text-emerald-200">
        {currentProject
          ? `Building ${currentProject}${currentApp ? ` with ${currentApp}` : ""}`
          : `Building with ${currentApp || "tracked tools"}`}
      </span>
    </div>
  );
}
