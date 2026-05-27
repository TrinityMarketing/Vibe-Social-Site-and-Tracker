import React, { useState } from "react";

export function Setup() {
  const [keyInput, setKeyInput] = useState("");
  const [error, setError] = useState("");

  const handleConnect = async () => {
    const key = keyInput.trim();
    if (!key) {
      setError("Please enter your API key");
      return;
    }

    await window.electronAPI.setApiKey(key);
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        overflow: "hidden",
        borderRadius: 22,
        background:
          "linear-gradient(145deg, rgba(12,16,24,0.98), rgba(4,7,12,0.97))",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow:
          "0 24px 70px rgba(0,0,0,0.52), inset 0 1px 0 rgba(255,255,255,0.08)",
        color: "#f7fbff",
        fontFamily: "'Segoe UI', 'Inter', system-ui, sans-serif",
        position: "relative",
        // @ts-ignore
        WebkitAppRegion: "drag",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 18% 8%, rgba(36,240,155,0.18), transparent 30%), radial-gradient(circle at 92% 18%, rgba(56,189,248,0.13), transparent 28%)",
          pointerEvents: "none",
        }}
      />

      <button
        onClick={() => window.electronAPI.closeWindow()}
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 2,
          width: 30,
          height: 30,
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.04)",
          color: "#8b97a8",
          cursor: "pointer",
          fontSize: 14,
          // @ts-ignore
          WebkitAppRegion: "no-drag",
        }}
        onMouseEnter={(event) => {
          event.currentTarget.style.color = "#fff";
          event.currentTarget.style.background = "rgba(255,255,255,0.09)";
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.color = "#8b97a8";
          event.currentTarget.style.background = "rgba(255,255,255,0.04)";
        }}
      >
        x
      </button>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          height: "100%",
          boxSizing: "border-box",
          padding: "30px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              background: "linear-gradient(135deg, #24f09b, #38bdf8)",
              color: "#06110d",
              display: "grid",
              placeItems: "center",
              fontFamily: "'Cascadia Code', monospace",
              fontWeight: 900,
              boxShadow: "0 0 28px rgba(36,240,155,0.24)",
            }}
          >
            VC
          </div>
          <div>
            <div
              style={{
                fontFamily: "'Cascadia Code', 'JetBrains Mono', monospace",
                fontSize: 22,
                fontWeight: 800,
                lineHeight: 1,
              }}
            >
              VibeClock
            </div>
            <div style={{ marginTop: 5, color: "#8ea0b6", fontSize: 12 }}>
              Your private build pulse
            </div>
          </div>
        </div>

        <div style={{ marginTop: 30 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              borderRadius: 999,
              border: "1px solid rgba(36,240,155,0.22)",
              background: "rgba(36,240,155,0.08)",
              color: "#c7ffe7",
              padding: "7px 10px",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: 99,
                background: "#24f09b",
                boxShadow: "0 0 12px #24f09b",
              }}
            />
            Ready to connect
          </div>

          <h1
            style={{
              margin: "16px 0 0",
              maxWidth: 330,
              fontSize: 28,
              lineHeight: 1.12,
              fontWeight: 800,
              letterSpacing: 0,
            }}
          >
            Track build time without turning it into a scoreboard.
          </h1>
          <p
            style={{
              margin: "10px 0 0",
              maxWidth: 360,
              color: "#9aa8ba",
              fontSize: 13,
              lineHeight: 1.55,
            }}
          >
            Paste your API key from the web dashboard. Window titles are redacted by
            default, and pause controls stay one click away.
          </p>
        </div>

        <div
          style={{
            marginTop: 24,
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 8,
          }}
        >
          {["Private first", "Pause anytime", "Tool aware"].map((label) => (
            <div
              key={label}
              style={{
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.04)",
                padding: "10px 8px",
                color: "#cbd5e1",
                fontSize: 11,
                fontWeight: 700,
                textAlign: "center",
              }}
            >
              {label}
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: "auto",
            // @ts-ignore
            WebkitAppRegion: "no-drag",
          }}
        >
          <label
            htmlFor="apiKey"
            style={{
              display: "block",
              marginBottom: 7,
              color: "#bac7d8",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            API key
          </label>
          <input
            id="apiKey"
            type="text"
            value={keyInput}
            onChange={(event) => {
              setKeyInput(event.target.value);
              setError("");
            }}
            placeholder="vc_live_..."
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px 13px",
              background: "rgba(2,6,12,0.7)",
              border: `1px solid ${error ? "#ef4444" : "rgba(255,255,255,0.12)"}`,
              borderRadius: 12,
              color: "#f7fbff",
              fontFamily: "'Cascadia Code', monospace",
              fontSize: 13,
              outline: "none",
              boxShadow: error
                ? "0 0 0 3px rgba(239,68,68,0.13)"
                : "inset 0 1px 0 rgba(255,255,255,0.04)",
            }}
          />
          {error && (
            <p style={{ margin: "7px 0 0", color: "#f87171", fontSize: 12 }}>
              {error}
            </p>
          )}

          <button
            onClick={handleConnect}
            style={{
              width: "100%",
              marginTop: 12,
              padding: "12px 16px",
              border: "none",
              borderRadius: 12,
              background: "linear-gradient(135deg, #24f09b, #38bdf8)",
              color: "#04110b",
              fontWeight: 800,
              cursor: "pointer",
              fontSize: 14,
              boxShadow: "0 14px 30px rgba(36,240,155,0.18)",
            }}
          >
            Connect tracker
          </button>
        </div>
      </div>
    </div>
  );
}
