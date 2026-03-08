import { getUnsyncedSessions, markSynced, getApiKey, getApiBaseUrl } from "./db";

const SYNC_INTERVAL_MS = 60_000; // Sync every 60 seconds

let syncInterval: ReturnType<typeof setInterval> | null = null;

export async function syncSessions() {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.log("No API key configured, skipping sync");
    return;
  }

  const sessions = getUnsyncedSessions();
  if (sessions.length === 0) return;

  const baseUrl = getApiBaseUrl();

  try {
    const response = await fetch(`${baseUrl}/api/sessions/batch`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessions: sessions.map((s) => ({
          appName: s.appName,
          windowTitle: s.windowTitle,
          startTime: s.startTime,
          endTime: s.endTime,
          durationSecs: s.durationSecs,
        })),
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`Synced ${data.synced} sessions`);
      markSynced(sessions.map((s) => s.id));
    } else {
      console.error("Sync failed:", response.status, await response.text());
    }
  } catch (err) {
    console.error("Sync error:", err);
  }
}

export function startSyncLoop() {
  if (syncInterval) return;

  // Initial sync
  syncSessions();

  syncInterval = setInterval(syncSessions, SYNC_INTERVAL_MS);
}

export function stopSyncLoop() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}
