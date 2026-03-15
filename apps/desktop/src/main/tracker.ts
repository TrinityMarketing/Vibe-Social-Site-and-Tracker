import { startSession, tickSession, closeSession, tickDailyTotal } from "./db";
import { BrowserWindow, app } from "electron";
import { execFile } from "child_process";
import { uIOhook } from "uiohook-napi";
import fs from "fs";
import path from "path";

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

const IDLE_THRESHOLD_SECS = 300;
const POLL_INTERVAL_MS = 2000;

interface ActiveSession {
  id: number;
  appName: string;
  lastActive: number;
}

let activeSessions: Map<string, ActiveSession> = new Map();
let pollInterval: ReturnType<typeof setInterval> | null = null;

// ── Signal 1: Keyboard hook (uiohook) ─────────────────────────
let lastRawKeyTime = 0; // any key, any app
let lastKeyTime = 0;    // key in a tracked app only
let hookStarted = false;

function startKeyboardHook() {
  if (hookStarted) return;
  hookStarted = true;
  uIOhook.on("keydown", () => {
    lastRawKeyTime = Date.now();
  });
  uIOhook.start();
}

function stopKeyboardHook() {
  if (!hookStarted) return;
  uIOhook.stop();
  hookStarted = false;
}

// Called from poll() only when a tracked app is focused
function checkTypingInTrackedApp(): boolean {
  const keyRecent = Date.now() - lastRawKeyTime < 2000;
  if (keyRecent) {
    lastKeyTime = Date.now();
  }
  return keyRecent;
}

// ── Signal 2: File system activity (code being written) ───────
let lastFileChangeTime = 0;
let fileWatcher: fs.FSWatcher | null = null;
let watchedDir: string | null = null;

function startFileWatcher() {
  // Watch the project root for file changes (go up from apps/desktop)
  let dir = process.cwd();
  // Walk up to find monorepo root (has package.json with workspaces or pnpm-workspace.yaml)
  for (let i = 0; i < 5; i++) {
    if (fs.existsSync(path.join(dir, "pnpm-workspace.yaml")) || fs.existsSync(path.join(dir, "turbo.json"))) break;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  if (fileWatcher || !fs.existsSync(dir)) return;
  watchedDir = dir;

  try {
    fileWatcher = fs.watch(dir, { recursive: true }, (eventType, filename) => {
      if (!filename) return;
      // Only count real source code changes
      if (
        filename.includes("node_modules") ||
        filename.includes(".git") ||
        filename.includes("dist") ||
        filename.includes(".next") ||
        filename.includes(".vite") ||
        filename.includes(".turbo") ||
        filename.includes(".cache") ||
        filename.includes("tracker-debug") ||
        filename.includes("vibeclock.db") ||
        filename.includes(".tmp") ||
        filename.includes(".log") ||
        filename.includes("lock") ||
        filename.endsWith(".map")
      ) return;
      // Only trigger on actual source code files (no json — too noisy from dev servers)
      if (!/\.(ts|tsx|js|jsx|css|html|md|prisma|py|rs|go|java|rb|swift|c|cpp|h)$/i.test(filename)) return;
      // Ignore build output and generated files
      if (filename.includes("tsbuildinfo") || filename.includes("__generated")) return;
      lastFileChangeTime = Date.now();
    });
  } catch {}
}

function stopFileWatcher() {
  if (fileWatcher) {
    fileWatcher.close();
    fileWatcher = null;
  }
}

// Short window for regular file changes, longer when claude is active
// (Claude work is bursty: write → think → read → write)
function isCodeBeingWritten(claudeActive: boolean): boolean {
  const window = claudeActive ? 8_000 : 3000;
  return Date.now() - lastFileChangeTime < window;
}

// ── Helpers ───────────────────────────────────────────────────
function isTrackedApp(appName: string): boolean {
  return TRACKED_APPS.some((tracked) =>
    appName.toLowerCase().includes(tracked.toLowerCase())
  );
}

function notifyRenderer(data: { activeApps?: string[]; active: boolean }) {
  const windows = BrowserWindow.getAllWindows();
  for (const w of windows) {
    w.webContents.send("tracker:update", data);
  }
}

// Claude process detection via tasklist (just checks if running)
let claudeRunning = false;
let claudeCheckTime = 0;

function checkClaudeProcess(): Promise<boolean> {
  if (Date.now() - claudeCheckTime < 4000) return Promise.resolve(claudeRunning);
  return new Promise((resolve) => {
    execFile("tasklist", ["/FI", "IMAGENAME eq claude.exe", "/NH"], { timeout: 2000 }, (err, stdout) => {
      claudeCheckTime = Date.now();
      claudeRunning = !err && stdout.includes("claude.exe");
      resolve(claudeRunning);
    });
  });
}

// ── Poll ──────────────────────────────────────────────────────
async function poll() {
  try {
    const activeWin = await import("active-win");
    const focusedWin = await activeWin.activeWindow();
    const focusedAppName = focusedWin?.owner.name ?? null;
    const focusedIsTracked = focusedAppName ? isTrackedApp(focusedAppName) : false;

    const activeApps = new Set<string>();
    const claude = await checkClaudeProcess();
    const codeChanging = isCodeBeingWritten(claude);

    // Only count typing when a tracked app is focused
    const typingInTrackedApp = focusedIsTracked && focusedAppName && checkTypingInTrackedApp();

    // Signal 1: User is typing in a tracked app
    if (typingInTrackedApp) {
      activeApps.add(focusedAppName!);
      if (claude) activeApps.add("claude");
    }

    // Signal 2: Code is being written while a tracked app is focused
    if (focusedIsTracked && codeChanging && focusedAppName) {
      activeApps.add(focusedAppName);
      if (claude) activeApps.add("claude");
    }

    // Notify renderer
    if (activeApps.size > 0) {
      const now = Date.now();
      const tickSecs = Math.round(POLL_INTERVAL_MS / 1000);

      tickDailyTotal(tickSecs);

      for (const appName of activeApps) {
        let session = activeSessions.get(appName);
        if (!session) {
          const newSession = startSession(appName, focusedWin?.title ?? null);
          session = { id: newSession.id, appName, lastActive: now };
          activeSessions.set(appName, session);
        }
        session.lastActive = now;
        tickSession(session.id, tickSecs);
      }

      notifyRenderer({ activeApps: Array.from(activeApps), active: true });
    } else {
      notifyRenderer({ active: false });
    }

    // Close sessions idle past threshold
    const now = Date.now();
    for (const [appName, session] of activeSessions) {
      if ((now - session.lastActive) / 1000 > IDLE_THRESHOLD_SECS) {
        closeSession(session.id);
        activeSessions.delete(appName);
      }
    }
  } catch (err) {
    console.error("Tracker poll error:", err);
  }
}

export function startTracking() {
  if (pollInterval) return;
  startKeyboardHook();
  startFileWatcher();
  pollInterval = setInterval(poll, POLL_INTERVAL_MS);
}

export function stopTracking() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
  stopKeyboardHook();
  stopFileWatcher();
  for (const session of activeSessions.values()) {
    closeSession(session.id);
  }
  activeSessions.clear();
}

export function getCurrentSession() {
  let latest: ActiveSession | null = null;
  for (const session of activeSessions.values()) {
    if (!latest || session.lastActive > latest.lastActive) {
      latest = session;
    }
  }
  return latest;
}
