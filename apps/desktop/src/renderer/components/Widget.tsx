import React, { useEffect, useState } from "react";

function formatTime(secs: number): string {
  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  const seconds = secs % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function Widget() {
  const [displaySecs, setDisplaySecs] = useState(0);
  const [tracking, setTracking] = useState(false);
  const [currentApp, setCurrentApp] = useState<string | null>(null);

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

  // Local tick: +1 every second while tracking (smooth counting)
  useEffect(() => {
    if (!tracking) return;

    const tick = setInterval(() => {
      setDisplaySecs((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(tick);
  }, [tracking]);

  // Listen for tracker updates
  useEffect(() => {
    window.electronAPI.onTrackerUpdate((data) => {
      setTracking(data.active);
      if (data.active) {
        setCurrentApp(data.appName);
      } else {
        setCurrentApp(null);
      }
    });
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: 16,
        background: "rgba(10, 10, 10, 0.92)",
        border: `1px solid ${tracking ? "rgba(0, 255, 136, 0.2)" : "rgba(255,255,255,0.06)"}`,
        backdropFilter: "blur(20px)",
        padding: "14px 18px",
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
      {/* Timer */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: tracking ? "#00ff88" : "#444",
            boxShadow: tracking ? "0 0 10px #00ff88, 0 0 20px #00ff8844" : "none",
            transition: "all 0.3s",
          }}
        />
        <span
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: tracking ? "#00ff88" : "#666",
            letterSpacing: "-1px",
            lineHeight: 1,
            transition: "color 0.3s",
          }}
        >
          {formatTime(displaySecs)}
        </span>
      </div>

      {/* Current app */}
      <div
        style={{
          marginTop: 6,
          fontSize: 11,
          color: tracking ? "#a3a3a3" : "#555",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {tracking && currentApp ? (
          <>
            <span style={{ color: "#00ff88" }}>●</span> {currentApp}
          </>
        ) : (
          "Waiting for activity..."
        )}
      </div>
    </div>
  );
}
