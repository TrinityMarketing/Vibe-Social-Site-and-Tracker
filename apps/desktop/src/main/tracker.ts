import { startSession, tickSession, closeSession } from "./db";
import { BrowserWindow, powerMonitor, screen } from "electron";
import { execFile } from "child_process";

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

const IDLE_THRESHOLD_SECS = 120;
const POLL_INTERVAL_MS = 2000;

// CPU delta threshold: Cursor idle uses ~1-2s CPU per 3s check.
// Real work (AI, builds, typing) uses 3+ seconds.
const CPU_ACTIVE_THRESHOLD = 3;

interface ActiveSession {
  id: number;
  appName: string;
}

let currentSession: ActiveSession | null = null;
let lastTrackedTime = Date.now();
let trackedWindowTitles: Map<string, string> = new Map();
let pollInterval: ReturnType<typeof setInterval> | null = null;
let polling = false;

// Keyboard detection: track mouse position to distinguish keyboard from mouse input
let lastMousePos: { x: number; y: number } | null = null;

// Process CPU monitoring
let lastTotalCpu: Map<string, number> = new Map();
let cpuCache: { results: Map<string, boolean>; checkedAt: number } = {
  results: new Map(),
  checkedAt: 0,
};

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

// Detect keyboard typing: if system reports input but mouse hasn't moved, it's keyboard
function isKeyboardActive(): boolean {
  const idleSecs = powerMonitor.getSystemIdleTime();
  const cursorPos = screen.getCursorScreenPoint();

  const mouseMovedSinceLastPoll =
    lastMousePos !== null &&
    (cursorPos.x !== lastMousePos.x || cursorPos.y !== lastMousePos.y);

  lastMousePos = { x: cursorPos.x, y: cursorPos.y };

  // Input detected within 3 seconds AND mouse didn't move = keyboard typing
  return idleSecs < 3 && !mouseMovedSinceLastPoll;
}

// Check CPU usage of tracked processes via PowerShell
function checkProcessCpu(): Promise<{ appName: string | null; active: boolean }> {
  if (Date.now() - cpuCache.checkedAt < 3000) {
    for (const [name, active] of cpuCache.results) {
      if (active) return Promise.resolve({ appName: name, active: true });
    }
    return Promise.resolve({ appName: null, active: false });
  }

  return new Promise((resolve) => {
    const cmd = `Get-Process | Where-Object {$_.CPU -gt 0} | Group-Object ProcessName | ForEach-Object { "$($_.Name)=$(($_.Group|Measure-Object CPU -Sum).Sum)" }`;

    execFile(
      "powershell.exe",
      ["-NoProfile", "-NoLogo", "-Command", cmd],
      { timeout: 5000 },
      (err, stdout) => {
        cpuCache.checkedAt = Date.now();
        cpuCache.results.clear();

        if (err || !stdout.trim()) {
          resolve({ appName: null, active: false });
          return;
        }

        let firstActive: string | null = null;

        for (const line of stdout.trim().split("\n")) {
          const match = line.trim().match(/^(.+?)=(.+)$/);
          if (!match) continue;

          const processName = match[1];
          if (!isTrackedApp(processName)) continue;

          const cpuTotal = parseFloat(match[2]);
          if (isNaN(cpuTotal)) continue;

          const prevCpu = lastTotalCpu.get(processName) || 0;
          lastTotalCpu.set(processName, cpuTotal);

          // Only count as working if CPU delta exceeds threshold
          // (filters out Cursor's idle background CPU usage)
          const isWorking = prevCpu > 0 && cpuTotal - prevCpu > CPU_ACTIVE_THRESHOLD;
          cpuCache.results.set(processName, isWorking);

          if (isWorking && !firstActive) {
            firstActive = processName;
          }
        }

        resolve({ appName: firstActive, active: firstActive !== null });
      }
    );
  });
}

async function poll() {
  if (polling) return;
  polling = true;

  try {
    const activeWin = await import("active-win");
    const focusedWin = await activeWin.activeWindow();
    const allWindows = await activeWin.openWindows();

    // 1. Check all tracked app windows for title changes
    let titleChangedApp: string | null = null;
    let titleChangedTitle: string | null = null;

    for (const win of allWindows) {
      const appName = win.owner.name;
      if (!isTrackedApp(appName)) continue;

      const key = `${appName}::${win.id}`;
      const prevTitle = trackedWindowTitles.get(key);
      trackedWindowTitles.set(key, win.title);

      if (prevTitle !== undefined && prevTitle !== win.title) {
        titleChangedApp = appName;
        titleChangedTitle = win.title;
      }
    }

    // 2. Check focused window
    const focusedAppName = focusedWin?.owner.name ?? null;
    const focusedIsTracked = focusedAppName ? isTrackedApp(focusedAppName) : false;

    // 3. Detect keyboard typing (not mouse) in a tracked app
    const typing = isKeyboardActive();
    const typingInTrackedApp = focusedIsTracked && typing;

    // 4. Check process CPU (catches AI generating, builds, etc.)
    const cpuCheck = await checkProcessCpu();

    // Active when:
    // A) User is typing in a tracked app (keyboard only, no mouse)
    // B) A tracked app's window title changed (app doing work)
    // C) A tracked process is using significant CPU (AI/build, not idle)
    const titleChanged = titleChangedApp !== null;
    const processWorking = cpuCheck.active;

    const isActive = typingInTrackedApp || titleChanged || processWorking;

    // Pick which app to attribute
    let activeAppName: string | null = null;
    let activeWindowTitle: string | null = null;

    if (typingInTrackedApp) {
      activeAppName = focusedAppName;
      activeWindowTitle = focusedWin?.title ?? null;
    } else if (titleChanged) {
      activeAppName = titleChangedApp;
      activeWindowTitle = titleChangedTitle;
    } else if (processWorking) {
      activeAppName = cpuCheck.appName;
    }

    if (isActive && activeAppName) {
      lastTrackedTime = Date.now();

      if (!currentSession || currentSession.appName !== activeAppName) {
        if (currentSession) {
          closeSession(currentSession.id);
        }
        const session = startSession(activeAppName, activeWindowTitle);
        currentSession = { id: session.id, appName: activeAppName };
      }

      tickSession(currentSession.id, Math.round(POLL_INTERVAL_MS / 1000));

      notifyRenderer({
        appName: activeAppName,
        windowTitle: activeWindowTitle ?? undefined,
        active: true,
      });
    } else {
      notifyRenderer({ active: false });

      const idleSecs = (Date.now() - lastTrackedTime) / 1000;
      if (currentSession && idleSecs > IDLE_THRESHOLD_SECS) {
        closeSession(currentSession.id);
        currentSession = null;
      }
    }
  } catch (err) {
    console.error("Tracker poll error:", err);
  } finally {
    polling = false;
  }
}

export function startTracking() {
  if (pollInterval) return;
  pollInterval = setInterval(poll, POLL_INTERVAL_MS);
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
