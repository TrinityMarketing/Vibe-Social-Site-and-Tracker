import React from "react";

interface Props {
  stats: { totalSecs: number; appName: string | null };
  tracking: boolean;
  currentApp: string | null;
}

function formatTime(secs: number): string {
  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  return `${hours}:${String(minutes).padStart(2, "0")}`;
}

export function TrayPopup({ stats, tracking, currentApp }: Props) {
  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: tracking ? "#00ff88" : "#666",
            boxShadow: tracking ? "0 0 8px #00ff88" : "none",
          }}
        />
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          <span style={{ color: "#00ff88" }}>Vibe</span>Clock
        </span>
      </div>

      {/* Today's Time */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <p
          style={{
            fontFamily: "monospace",
            fontSize: 48,
            fontWeight: 700,
            color: "#00ff88",
            lineHeight: 1,
          }}
        >
          {formatTime(stats.totalSecs)}
        </p>
        <p style={{ fontSize: 13, color: "#a3a3a3", marginTop: 4 }}>hours today</p>
      </div>

      {/* Current Session */}
      {tracking && currentApp && (
        <div
          style={{
            background: "#111",
            border: "1px solid #262626",
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#00ff88",
                animation: "pulse 2s infinite",
              }}
            />
            <span style={{ color: "#a3a3a3" }}>Tracking</span>
            <span style={{ fontWeight: 600 }}>{currentApp}</span>
          </div>
        </div>
      )}

      {/* Top App */}
      {stats.appName && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 13,
            color: "#a3a3a3",
          }}
        >
          <span>Top app today</span>
          <span style={{ color: "#f5f5f5", fontWeight: 500 }}>{stats.appName}</span>
        </div>
      )}

      {/* Sync button */}
      <button
        onClick={() => window.electronAPI.forceSync()}
        style={{
          width: "100%",
          padding: "8px",
          marginTop: 16,
          background: "transparent",
          border: "1px solid #262626",
          borderRadius: 6,
          color: "#a3a3a3",
          cursor: "pointer",
          fontSize: 12,
        }}
      >
        Force Sync
      </button>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
