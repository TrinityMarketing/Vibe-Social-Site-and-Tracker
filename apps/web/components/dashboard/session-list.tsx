import { AppIcon } from "@/components/shared/app-icon";
import { SessionDeleteButton } from "./session-delete-button";

interface Session {
  id: string;
  appName: string;
  projectName?: string | null;
  windowTitle: string | null;
  startTime: string;
  durationSecs: number;
  source?: string;
  confidence?: number;
}

function formatDuration(secs: number): string {
  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  const seconds = secs % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function formatConfidence(confidence?: number): string {
  if (confidence === undefined) return "observed";
  if (confidence >= 0.9) return "verified";
  if (confidence >= 0.7) return "strong signal";
  if (confidence >= 0.5) return "activity signal";
  return "observed";
}

function mergeSessions(sessions: Session[]): Session[] {
  if (sessions.length === 0) return [];

  const merged: Session[] = [];
  let current = { ...sessions[0] };

  for (let i = 1; i < sessions.length; i++) {
    const s = sessions[i];
    const gap =
      (new Date(current.startTime).getTime() - new Date(s.startTime).getTime()) /
      1000;

    if (s.appName === current.appName && Math.abs(gap) < 900) {
      const earlierStart =
        new Date(s.startTime) < new Date(current.startTime)
          ? s.startTime
          : current.startTime;
      current = {
        ...current,
        startTime: earlierStart,
        durationSecs: current.durationSecs + s.durationSecs,
        windowTitle: current.windowTitle || s.windowTitle,
        projectName: current.projectName || s.projectName,
        confidence: Math.max(current.confidence || 0, s.confidence || 0),
      };
    } else {
      merged.push(current);
      current = { ...s };
    }
  }
  merged.push(current);

  return merged.filter((s) => s.durationSecs >= 30);
}

function groupByDate(sessions: Session[]) {
  const groups: Record<string, Session[]> = {};
  for (const s of sessions) {
    const dateKey = formatDateLabel(s.startTime);
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(s);
  }
  return groups;
}

export function SessionList({
  sessions,
  showDelete = false,
}: {
  sessions: Session[];
  showDelete?: boolean;
}) {
  if (sessions.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/[0.035] p-8 text-center">
        <p className="font-mono text-lg font-semibold text-foreground">
          No sessions yet.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Download the desktop app to start tracking.
        </p>
      </div>
    );
  }

  const merged = mergeSessions(sessions);
  const grouped = groupByDate(merged);

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([date, dateSessions]) => {
        const dayTotal = dateSessions.reduce((sum, s) => sum + s.durationSecs, 0);
        return (
          <div key={date}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">{date}</h3>
              <span className="font-mono text-xs text-emerald-200">
                {formatDuration(dayTotal)}
              </span>
            </div>
            <div className="space-y-2">
              {dateSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-3 transition hover:border-emerald-400/20 hover:bg-white/[0.055]"
                >
                  <AppIcon appName={session.appName} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{session.appName}</p>
                    {session.projectName && (
                      <p className="truncate text-sm text-sky-400">
                        {session.projectName}
                      </p>
                    )}
                    {session.windowTitle && (
                      <p className="truncate text-sm text-muted-foreground">
                        {session.windowTitle}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm text-emerald-200">
                      {formatDuration(session.durationSecs)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(session.startTime)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatConfidence(session.confidence)}
                    </p>
                  </div>
                  {showDelete && <SessionDeleteButton sessionId={session.id} />}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
