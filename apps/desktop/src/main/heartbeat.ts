import { getApiKey, getApiBaseUrl } from "./db";
import { getCurrentSession } from "./tracker";

const HEARTBEAT_INTERVAL_MS = 12_000; // 12 seconds

let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

async function sendHeartbeat() {
  const apiKey = getApiKey();
  if (!apiKey) return;

  const session = getCurrentSession();
  if (!session) return;

  const baseUrl = getApiBaseUrl();

  try {
    await fetch(`${baseUrl}/api/me/presence`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ appName: session.appName }),
    });
  } catch {
    // Silently ignore — presence is best-effort
  }
}

export function startHeartbeat() {
  if (heartbeatInterval) return;
  heartbeatInterval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
}

export function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}
