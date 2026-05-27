import React, { useEffect, useRef, useState } from "react";

function formatTime(secs: number): string {
  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  const seconds = secs % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

const BASE_W = 236;
const BASE_H = 94;

const APP_THEMES = [
  {
    match: ["codex"],
    bg: "rgba(59,130,246,0.14)",
    border: "rgba(59,130,246,0.32)",
    text: "#bfdbfe",
  },
  {
    match: ["claude"],
    bg: "rgba(249,115,22,0.14)",
    border: "rgba(249,115,22,0.34)",
    text: "#fed7aa",
  },
  {
    match: ["cursor"],
    bg: "rgba(148,163,184,0.14)",
    border: "rgba(148,163,184,0.3)",
    text: "#e2e8f0",
  },
  {
    match: ["code", "vscode"],
    bg: "rgba(14,165,233,0.14)",
    border: "rgba(14,165,233,0.32)",
    text: "#bae6fd",
  },
  {
    match: ["terminal", "warp", "iterm", "ghostty", "kitty", "hyper"],
    bg: "rgba(34,197,94,0.14)",
    border: "rgba(34,197,94,0.3)",
    text: "#bbf7d0",
  },
  {
    match: ["github"],
    bg: "rgba(168,85,247,0.14)",
    border: "rgba(168,85,247,0.3)",
    text: "#e9d5ff",
  },
  {
    match: ["vercel", "localhost"],
    bg: "rgba(255,255,255,0.08)",
    border: "rgba(255,255,255,0.18)",
    text: "#f8fafc",
  },
  {
    match: ["supabase"],
    bg: "rgba(45,212,191,0.14)",
    border: "rgba(45,212,191,0.3)",
    text: "#99f6e4",
  },
];

const APP_DISPLAY_NAMES = [
  { name: "Codex", match: ["codex"] },
  { name: "Claude", match: ["claude"] },
  { name: "Cursor", match: ["cursor"] },
  { name: "VS Code", match: ["visual studio code", "vs code", "code"] },
  { name: "Terminal", match: ["terminal"] },
  { name: "GitHub", match: ["github"] },
  { name: "Supabase", match: ["supabase"] },
  { name: "Vercel", match: ["vercel"] },
  { name: "Localhost", match: ["localhost", "127.0.0.1"] },
];

function normalizeDisplayName(appName: string) {
  const value = appName.toLowerCase();
  const match = APP_DISPLAY_NAMES.find((app) =>
    app.match.some((token) => value.includes(token))
  );
  return match?.name ?? appName;
}

function uniqueApps(apps: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const app of apps) {
    const name = normalizeDisplayName(app);
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(name);
  }

  return result;
}

function getAppTheme(appName: string) {
  const value = appName.toLowerCase();
  return (
    APP_THEMES.find((theme) =>
      theme.match.some((token) => value.includes(token))
    ) || {
      bg: "rgba(36,240,155,0.1)",
      border: "rgba(36,240,155,0.2)",
      text: "#c7ffe7",
    }
  );
}

function AppChip({ app, scale }: { app: string; scale: number }) {
  const theme = getAppTheme(app);
  return (
    <span
      style={{
        minWidth: 0,
        maxWidth: Math.round(86 * scale),
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        borderRadius: 999,
        background: theme.bg,
        border: `1px solid ${theme.border}`,
        color: theme.text,
        padding: `${Math.round(4 * scale)}px ${Math.round(8 * scale)}px`,
        fontSize: Math.round(10 * scale),
        fontWeight: 700,
        lineHeight: 1,
      }}
    >
      {app}
    </span>
  );
}

export function Widget() {
  const [displaySecs, setDisplaySecs] = useState(0);
  const [tracking, setTracking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [activeApps, setActiveApps] = useState<string[]>([]);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastActiveRef = useRef(0);
  const pausedRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      const nextScale = Math.min(width / BASE_W, height / BASE_H);
      setScale(Math.max(0.78, nextScale));
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    window.electronAPI.getTodayStats().then((stats) => {
      setDisplaySecs((prev) => Math.max(prev, stats.totalSecs));
    });
    window.electronAPI.getTrackerConfig().then((config) => {
      setPaused(config.trackingPaused);
    });

    const dbInterval = setInterval(() => {
      window.electronAPI.getTodayStats().then((stats) => {
        setDisplaySecs((prev) => Math.max(prev, stats.totalSecs));
      });
    }, 5000);

    return () => clearInterval(dbInterval);
  }, []);

  useEffect(() => {
    if (!tracking) return;

    const tick = setInterval(() => {
      setDisplaySecs((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(tick);
  }, [tracking]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    window.electronAPI.onTrackerUpdate((data: any) => {
      setActiveApps(data.activeApps || []);
      if (data.active && !pausedRef.current) {
        lastActiveRef.current = Date.now();
        setTracking(true);
      } else {
        setTracking(false);
      }
    });
  }, []);

  useEffect(() => {
    const check = setInterval(() => {
      if (tracking && Date.now() - lastActiveRef.current > 4000) {
        setTracking(false);
        setActiveApps([]);
      }
    }, 1000);

    return () => clearInterval(check);
  }, [tracking]);

  const togglePaused = async () => {
    const config = await window.electronAPI.setTrackingPaused(!paused);
    setPaused(config.trackingPaused);

    if (config.trackingPaused) {
      setTracking(false);
      setActiveApps([]);
    }
  };

  const displayApps = uniqueApps(activeApps);
  const visibleApps = displayApps.slice(0, 2);
  const overflowCount = Math.max(0, displayApps.length - visibleApps.length);
  const statusLabel = paused ? "Paused" : tracking ? "Building" : "Idle";
  const accent = paused ? "#f8b84e" : tracking ? "#24f09b" : "#7a8395";
  const glow = paused
    ? "rgba(248, 184, 78, 0.28)"
    : tracking
      ? "rgba(36, 240, 155, 0.3)"
      : "rgba(122, 131, 149, 0.18)";

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        borderRadius: 18,
        background:
          "linear-gradient(145deg, rgba(12,16,24,0.96), rgba(4,8,14,0.94))",
        border: `1px solid ${tracking ? "rgba(36,240,155,0.32)" : "rgba(255,255,255,0.11)"}`,
        boxShadow: `0 18px 55px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 28px ${glow}`,
        backdropFilter: "blur(22px)",
        color: "#f7fbff",
        cursor: "move",
        userSelect: "none",
        // @ts-ignore
        WebkitAppRegion: "drag",
        fontFamily: "'Segoe UI', 'Inter', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 18% 10%, rgba(36,240,155,0.18), transparent 34%), radial-gradient(circle at 88% 20%, rgba(56,189,248,0.12), transparent 30%)",
          pointerEvents: "none",
        }}
      />

      <div
        onMouseDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          window.electronAPI.startResize("top-right");
          const onMouseUp = () => {
            window.electronAPI.stopResize();
            document.removeEventListener("mouseup", onMouseUp);
          };
          document.addEventListener("mouseup", onMouseUp);
        }}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 22,
          height: 22,
          cursor: "nesw-resize",
          zIndex: 12,
          // @ts-ignore
          WebkitAppRegion: "no-drag",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          height: "100%",
          boxSizing: "border-box",
          padding: `${Math.round(12 * scale)}px ${Math.round(14 * scale)}px`,
          display: "grid",
          gridTemplateRows: "auto 1fr auto",
          gap: Math.round(7 * scale),
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: Math.round(8 * scale),
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: Math.round(6 * scale),
              minWidth: 0,
            }}
          >
            <span
              style={{
                width: Math.round(8 * scale),
                height: Math.round(8 * scale),
                borderRadius: 99,
                background: accent,
                boxShadow: `0 0 ${Math.round(14 * scale)}px ${accent}`,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                color: "#b5c2d3",
                fontSize: Math.round(11 * scale),
                fontWeight: 700,
                lineHeight: 1,
                textTransform: "uppercase",
                letterSpacing: 0,
              }}
            >
              {statusLabel}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: Math.round(4 * scale),
              // @ts-ignore
              WebkitAppRegion: "no-drag",
            }}
          >
            <button
              onClick={togglePaused}
              title={paused ? "Resume tracking" : "Pause tracking"}
              style={{
                width: Math.round(24 * scale),
                height: Math.round(22 * scale),
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.1)",
                background: paused ? "rgba(248,184,78,0.16)" : "rgba(255,255,255,0.06)",
                color: paused ? "#f8b84e" : "#c7d2e2",
                cursor: "pointer",
                fontFamily: "monospace",
                fontSize: Math.round(11 * scale),
                lineHeight: 1,
              }}
            >
              {paused ? ">" : "||"}
            </button>
            <button
              onClick={() => window.electronAPI.closeWindow()}
              title="Close widget"
              style={{
                width: Math.round(24 * scale),
                height: Math.round(22 * scale),
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.04)",
                color: "#7f8b9e",
                cursor: "pointer",
                fontSize: Math.round(12 * scale),
                lineHeight: 1,
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.color = "#fff";
                event.currentTarget.style.background = "rgba(255,255,255,0.09)";
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.color = "#7f8b9e";
                event.currentTarget.style.background = "rgba(255,255,255,0.04)";
              }}
            >
              x
            </button>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: Math.round(10 * scale),
            minWidth: 0,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: "'Cascadia Code', 'JetBrains Mono', monospace",
                fontSize: Math.round(34 * scale),
                fontWeight: 800,
                lineHeight: 0.95,
                color: paused ? "#f8b84e" : tracking ? "#24f09b" : "#d7dfeb",
                letterSpacing: 0,
                textShadow: tracking ? "0 0 18px rgba(36,240,155,0.22)" : "none",
                whiteSpace: "nowrap",
              }}
            >
              {formatTime(displaySecs)}
            </div>
            <div
              style={{
                marginTop: Math.round(3 * scale),
                color: "#718096",
                fontSize: Math.round(10 * scale),
                fontWeight: 600,
              }}
            >
              today
            </div>
          </div>

          <div
            style={{
              width: Math.round(46 * scale),
              height: Math.round(46 * scale),
              borderRadius: 999,
              border: `1px solid ${tracking ? "rgba(36,240,155,0.36)" : "rgba(255,255,255,0.1)"}`,
              background: `conic-gradient(${accent} ${tracking ? "280deg" : paused ? "110deg" : "40deg"}, rgba(255,255,255,0.08) 0deg)`,
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: Math.round(34 * scale),
                height: Math.round(34 * scale),
                borderRadius: 999,
                background: "rgba(5,8,13,0.92)",
                display: "grid",
                placeItems: "center",
                color: accent,
                fontFamily: "monospace",
                fontSize: Math.round(13 * scale),
                fontWeight: 800,
              }}
            >
              VC
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: Math.round(5 * scale),
            minWidth: 0,
          }}
        >
          {paused ? (
            <span
              style={{
                borderRadius: 999,
                background: "rgba(248,184,78,0.12)",
                border: "1px solid rgba(248,184,78,0.24)",
                color: "#f8d28a",
                padding: `${Math.round(4 * scale)}px ${Math.round(8 * scale)}px`,
                fontSize: Math.round(10 * scale),
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              Tracking paused
            </span>
          ) : visibleApps.length > 0 ? (
            <>
              {visibleApps.map((app) => (
                <AppChip key={app} app={app} scale={scale} />
              ))}
              {overflowCount > 0 && (
                <span
                  style={{
                    color: "#94a3b8",
                    fontSize: Math.round(10 * scale),
                    fontWeight: 700,
                  }}
                >
                  +{overflowCount}
                </span>
              )}
            </>
          ) : (
            <span
              style={{
                borderRadius: 999,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#94a3b8",
                padding: `${Math.round(4 * scale)}px ${Math.round(8 * scale)}px`,
                fontSize: Math.round(10 * scale),
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              Waiting for coding signal
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
