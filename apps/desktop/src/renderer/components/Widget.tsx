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

// Base design dimensions (default widget size minus padding)
const BASE_W = 156;
const BASE_H = 54;

export function Widget() {
  const [displaySecs, setDisplaySecs] = useState(0);
  const [tracking, setTracking] = useState(false);
  const [activeApps, setActiveApps] = useState<string[]>([]);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Scale content proportionally when widget is resized
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      const s = Math.min(width / BASE_W, height / BASE_H);
      setScale(Math.max(0.8, s));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Initial load + periodic DB correction (only adjusts upward)
  useEffect(() => {
    window.electronAPI.getTodayStats().then((s) => {
      setDisplaySecs((prev) => Math.max(prev, s.totalSecs));
    });

    const dbInterval = setInterval(() => {
      window.electronAPI.getTodayStats().then((s) => {
        setDisplaySecs((prev) => Math.max(prev, s.totalSecs));
      });
    }, 5000);

    return () => clearInterval(dbInterval);
  }, []);

  // Local tick: +1 every second while tracking (wall-clock time)
  useEffect(() => {
    if (!tracking) return;

    const tick = setInterval(() => {
      setDisplaySecs((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(tick);
  }, [tracking]);

  // Listen for tracker updates
  const lastActiveRef = useRef(0);
  useEffect(() => {
    window.electronAPI.onTrackerUpdate((data: any) => {
      if (data.active) {
        lastActiveRef.current = Date.now();
        setTracking(true);
        setActiveApps(data.activeApps || []);
      } else {
        setTracking(false);
        setActiveApps([]);
      }
    });
  }, []);

  // Safety net: force idle if no active event in 4 seconds
  useEffect(() => {
    const check = setInterval(() => {
      if (tracking && Date.now() - lastActiveRef.current > 4000) {
        setTracking(false);
        setActiveApps([]);
      }
    }, 1000);
    return () => clearInterval(check);
  }, [tracking]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        borderRadius: 12,
        background: "rgba(10, 10, 10, 0.92)",
        border: `1px solid ${tracking ? "rgba(0, 255, 136, 0.2)" : "rgba(255,255,255,0.06)"}`,
        backdropFilter: "blur(20px)",
        padding: `${Math.round(8 * scale)}px ${Math.round(12 * scale)}px`,
        cursor: "move",
        userSelect: "none",
        // @ts-ignore
        WebkitAppRegion: "drag",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        fontFamily: "'JetBrains Mono', 'Cascadia Code', 'Fira Code', monospace",
        transition: "border-color 0.3s",
      }}
    >
      {/* Top-right resize handle */}
      <div
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
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
          width: 18,
          height: 18,
          cursor: "nesw-resize",
          zIndex: 10,
          // @ts-ignore
          WebkitAppRegion: "no-drag",
        }}
      />

      {/* Timer row */}
      <div style={{ display: "flex", alignItems: "center", gap: Math.round(6 * scale) }}>
        <div
          style={{
            width: Math.round(6 * scale),
            height: Math.round(6 * scale),
            borderRadius: "50%",
            background: tracking ? "#00ff88" : "#444",
            boxShadow: tracking ? `0 0 ${Math.round(8 * scale)}px #00ff88` : "none",
            transition: "all 0.3s",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: Math.round(22 * scale),
            fontWeight: 700,
            color: tracking ? "#00ff88" : "#666",
            letterSpacing: "-0.5px",
            lineHeight: 1,
            transition: "color 0.3s",
            flex: 1,
          }}
        >
          {formatTime(displaySecs)}
        </span>
        <button
          onClick={() => window.electronAPI.closeWindow()}
          style={{
            background: "transparent",
            border: "none",
            color: "#555",
            fontSize: Math.round(14 * scale),
            cursor: "pointer",
            padding: 0,
            lineHeight: 1,
            // @ts-ignore
            WebkitAppRegion: "no-drag",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#555")}
        >
          ✕
        </button>
      </div>

      {/* Active apps list */}
      <div
        style={{
          marginTop: Math.round(3 * scale),
          display: "flex",
          flexDirection: "column",
          gap: Math.round(1 * scale),
        }}
      >
        {tracking && activeApps.length > 0 ? (
          activeApps.map((app) => (
            <div
              key={app}
              style={{
                display: "flex",
                alignItems: "center",
                gap: Math.round(4 * scale),
                fontSize: Math.round(10 * scale),
                color: "#a3a3a3",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              <div
                style={{
                  width: Math.round(4 * scale),
                  height: Math.round(4 * scale),
                  borderRadius: "50%",
                  background: "#00ff88",
                  boxShadow: `0 0 ${Math.round(4 * scale)}px #00ff88`,
                  flexShrink: 0,
                }}
              />
              {app}
            </div>
          ))
        ) : (
          <div
            style={{
              fontSize: Math.round(10 * scale),
              color: "#555",
            }}
          >
            idle
          </div>
        )}
      </div>
    </div>
  );
}
