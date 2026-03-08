import { AppIcon } from "@/components/shared/app-icon";

interface Session {
  id: string;
  appName: string;
  windowTitle: string | null;
  startTime: string;
  durationSecs: number;
}

function formatDuration(secs: number): string {
  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function groupByDate(sessions: Session[]) {
  const groups: Record<string, Session[]> = {};
  for (const s of sessions) {
    const date = new Date(s.startTime).toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
    if (!groups[date]) groups[date] = [];
    groups[date].push(s);
  }
  return groups;
}

export function SessionList({ sessions }: { sessions: Session[] }) {
  if (sessions.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">No sessions yet.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Download the desktop app to start tracking.
        </p>
      </div>
    );
  }

  const grouped = groupByDate(sessions);

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([date, dateSessions]) => (
        <div key={date}>
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">{date}</h3>
          <div className="space-y-2">
            {dateSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
              >
                <AppIcon appName={session.appName} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{session.appName}</p>
                  {session.windowTitle && (
                    <p className="truncate text-sm text-muted-foreground">
                      {session.windowTitle}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm text-neon">
                    {formatDuration(session.durationSecs)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatTime(session.startTime)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
