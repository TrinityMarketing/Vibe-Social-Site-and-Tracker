"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pause, Play, Wifi } from "lucide-react";

function formatLastSeen(lastSeenAt: string | null): string {
  if (!lastSeenAt) return "No sync yet";
  const diffMs = Date.now() - new Date(lastSeenAt).getTime();
  const minutes = Math.max(0, Math.round(diffMs / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes === 1) return "1 min ago";
  if (minutes < 60) return `${minutes} min ago`;
  return new Date(lastSeenAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function TrackerStatusCard({
  trackingPaused,
  lastSeenAt,
  currentProject,
}: {
  trackingPaused: boolean;
  lastSeenAt: string | null;
  currentProject: string | null;
}) {
  const router = useRouter();
  const [paused, setPaused] = useState(trackingPaused);
  const [saving, setSaving] = useState(false);

  const togglePaused = async () => {
    setSaving(true);
    const next = !paused;
    const res = await fetch("/api/me/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackingPaused: next }),
    });
    setSaving(false);
    if (res.ok) {
      setPaused(next);
      router.refresh();
    } else {
      alert("Failed to update tracker status");
    }
  };

  return (
    <Card className="vc-panel border-white/10 bg-card/80">
      <CardHeader className="border-b border-white/10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="vc-section-title">Live sync</p>
            <CardTitle className="mt-1 flex items-center gap-2 font-mono text-xl">
              Tracker Status
            </CardTitle>
          </div>
          <div className="grid size-10 place-items-center rounded-lg border border-sky-400/20 bg-sky-400/10 text-sky-200">
            <Wifi className="size-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2">
          <span className="text-sm text-muted-foreground">Sync</span>
          <span className="font-mono text-sm text-foreground">
            {formatLastSeen(lastSeenAt)}
          </span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2">
          <span className="text-sm text-muted-foreground">Tracking</span>
          <span className={paused ? "text-amber-200" : "text-emerald-200"}>
            {paused ? "Paused" : "Active"}
          </span>
        </div>
        {currentProject && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2">
            <span className="text-sm text-muted-foreground">Project</span>
            <span className="truncate font-mono text-sm text-sky-300">
              {currentProject}
            </span>
          </div>
        )}
        <Button
          variant={paused ? "default" : "outline"}
          className={
            paused
              ? "w-full bg-emerald-300 font-semibold text-black hover:bg-emerald-200"
              : "w-full border-white/10 bg-white/[0.035] hover:bg-white/[0.06]"
          }
          onClick={togglePaused}
          disabled={saving}
        >
          {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
          {paused ? "Resume Tracking" : "Pause Tracking"}
        </Button>
      </CardContent>
    </Card>
  );
}
