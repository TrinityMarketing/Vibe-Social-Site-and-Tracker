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
        borderRadius: 16,
        background: "#0a0a0a",
        border: "1px solid #262626",
        padding: 28,
        fontFamily: "'Segoe UI', 'SF Pro', system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        // @ts-ignore — drag titlebar area
        WebkitAppRegion: "drag",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "#00ff88",
            boxShadow: "0 0 8px #00ff88",
          }}
        />
        <span style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 700 }}>
          <span style={{ color: "#00ff88" }}>Vibe</span>
          <span style={{ color: "#f5f5f5" }}>Clock</span>
        </span>

        {/* Close button */}
        <button
          onClick={() => window.electronAPI.closeWindow()}
          style={{
            marginLeft: "auto",
            background: "transparent",
            border: "none",
            color: "#666",
            fontSize: 18,
            cursor: "pointer",
            // @ts-ignore
            WebkitAppRegion: "no-drag",
          }}
        >
          ✕
        </button>
      </div>

      <p style={{ fontSize: 13, color: "#a3a3a3", marginBottom: 20, lineHeight: 1.5 }}>
        Paste your API key from the web dashboard to start tracking.
      </p>

      {/* Input */}
      <div
        // @ts-ignore
        style={{ WebkitAppRegion: "no-drag" }}
      >
        <input
          type="text"
          value={keyInput}
          onChange={(e) => {
            setKeyInput(e.target.value);
            setError("");
          }}
          placeholder="Enter API key..."
          style={{
            width: "100%",
            padding: "10px 14px",
            background: "#1a1a1a",
            border: `1px solid ${error ? "#ef4444" : "#262626"}`,
            borderRadius: 8,
            color: "#f5f5f5",
            fontFamily: "monospace",
            fontSize: 13,
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        {error && (
          <p style={{ color: "#ef4444", fontSize: 12, marginTop: 6 }}>{error}</p>
        )}

        <button
          onClick={handleConnect}
          style={{
            width: "100%",
            padding: "10px 16px",
            marginTop: 14,
            background: "#00ff88",
            color: "#0a0a0a",
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          Connect & Start Tracking
        </button>
      </div>
    </div>
  );
}
