import { startSession, tickSession, closeSession } from "./db";
import { BrowserWindow, powerMonitor } from "electron";

const TRACKED_APPS = [
  "Cursor",
  "Code",       // VS Code
  "claude",     // Claude Code CLI
  "Terminal",
  "iTerm2",
  "Warp",
  "Windsurf",
  "Zed",
  "WebStorm",
  "PyCharm",
  "Xcode",
  "Hyper",
  "kitty",
  "Ghostty",
];

// User must have typed/moved mouse within this many seconds to count as "active"
const INPUT_THRESHOLD_SECS = 3;
// After this long with no activity at all, close the session
const IDLE_THRESHOLD_SECS = 120;
const POLL_INTERVAL_MS = 2000;

interface ActiveSession {
  id: number;
  appName: string;
}

let currentSession: ActiveSession | null = null;
let lastTrackedTime = Date.now();
let lastWindowTitle: string | null = null;
let pollInterval: ReturnType<typeof setInterval> | null = null;

function isTrackedApp(appName: string): boolean {
  return TRACKED_APPS.some((tracked) =>
    appName.toLowerCase().includes(tracked.toLowerCase())
  );
}

function notifyRenderer(data: { appName?: string; windowTitle?: string; active: boolean }) {
  const windows = BrowserWindow.getAllWindows();
  for (const w of windows) {
    w.webContents.send("tracker:update", data);
  }
}

export function startTracking() {
  if (pollInterval) return;

  pollInterval = setInterval(async () => {
    try {
      const { activeWindow } = await import("active-win");
      const win = await activeWindow();

      if (!win) return;

      const appName = win.owner.name;
      const isTracked = isTrackedApp(appName);

      if (!isTracked) {
        // Non-tracked app focused
        lastWindowTitle = null;
        notifyRenderer({ active: false });

        const idleSecs = (Date.now() - lastTrackedTime) / 1000;
        if (currentSession && idleSecs > IDLE_THRESHOLD_SECS) {
          closeSession(currentSession.id);
          currentSession = null;
        }
        return;
      }

      // Tracked app is focused — check for activity
      const systemIdleSecs = powerMonitor.getSystemIdleTime();
      const userTyping = systemIdleSecs < INPUT_THRESHOLD_SECS;
      const titleChanged = lastWindowTitle !== null && win.title !== lastWindowTitle;
      lastWindowTitle = win.title;

      // Active = user is typing OR the app is doing something (title changed)
      const isActive = userTyping || titleChanged;

      if (isActive) {
        lastTrackedTime = Date.now();

        if (!currentSession || currentSession.appName !== appName) {
          if (currentSession) {
            closeSession(currentSession.id);
          }
          const session = startSession(appName, win.title);
          currentSession = { id: session.id, appName };
          tickSession(session.id, Math.round(POLL_INTERVAL_MS / 1000));
        } else {
          tickSession(currentSession.id, Math.round(POLL_INTERVAL_MS / 1000));
        }

        notifyRenderer({ appName, windowTitle: win.title, active: true });

      } else {
        // Tracked app focused but no user input and no app activity — paused
        notifyRenderer({ appName, windowTitle: win.title, active: false });

        const idleSecs = (Date.now() - lastTrackedTime) / 1000;
        if (currentSession && idleSecs > IDLE_THRESHOLD_SECS) {
          closeSession(currentSession.id);
          currentSession = null;
        }
      }
    } catch (err) {
      console.error("Tracker poll error:", err);
    }
  }, POLL_INTERVAL_MS);
}

export function stopTracking() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
  if (currentSession) {
    closeSession(currentSession.id);
    currentSession = null;
  }
}

export function getCurrentSession() {
  return currentSession;
}
