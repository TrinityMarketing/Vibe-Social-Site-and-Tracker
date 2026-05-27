import {
  closeSession,
  getCurrentProject,
  getExcludedApps,
  getRedactWindowTitles,
  getTrackingPaused,
  startSession,
  tickDailyTotal,
  tickSession,
} from "./db";
import { BrowserWindow } from "electron";
import { execFile } from "child_process";
import { uIOhook } from "uiohook-napi";
import fs from "fs";
import path from "path";

const TRACKED_APPS = [
  "Cursor",
  "Codex",
  "Code",
  "claude",
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

const CANONICAL_APP_NAMES = [
  { name: "Codex", patterns: ["codex"] },
  { name: "Cursor", patterns: ["cursor"] },
  { name: "Claude", patterns: ["claude"] },
  { name: "VS Code", patterns: ["visual studio code", "vs code", "code"] },
  { name: "Terminal", patterns: ["terminal"] },
  { name: "iTerm2", patterns: ["iterm"] },
  { name: "Warp", patterns: ["warp"] },
  { name: "Windsurf", patterns: ["windsurf"] },
  { name: "Zed", patterns: ["zed"] },
  { name: "WebStorm", patterns: ["webstorm"] },
  { name: "PyCharm", patterns: ["pycharm"] },
  { name: "Xcode", patterns: ["xcode"] },
  { name: "Hyper", patterns: ["hyper"] },
  { name: "kitty", patterns: ["kitty"] },
  { name: "Ghostty", patterns: ["ghostty"] },
  { name: "ChatGPT", patterns: ["chatgpt", "openai"] },
  { name: "GitHub", patterns: ["github"] },
  { name: "Vercel", patterns: ["vercel"] },
  { name: "Supabase", patterns: ["supabase"] },
  { name: "Replit", patterns: ["replit"] },
  { name: "StackBlitz", patterns: ["stackblitz"] },
  { name: "Bolt", patterns: ["bolt.new", "bolt"] },
  { name: "Lovable", patterns: ["lovable"] },
  { name: "Localhost", patterns: ["localhost", "127.0.0.1"] },
];

const BROWSER_APPS = [
  "Chrome",
  "Microsoft Edge",
  "Brave",
  "Arc",
  "Firefox",
  "Safari",
];

const BROWSER_TOOL_TITLE_RULES = [
  { appName: "Codex", patterns: ["codex"] },
  { appName: "ChatGPT", patterns: ["chatgpt", "openai"] },
  { appName: "Claude", patterns: ["claude"] },
  { appName: "GitHub", patterns: ["github"] },
  { appName: "Vercel", patterns: ["vercel"] },
  { appName: "Supabase", patterns: ["supabase"] },
  { appName: "Replit", patterns: ["replit"] },
  { appName: "StackBlitz", patterns: ["stackblitz"] },
  { appName: "Bolt", patterns: ["bolt.new", "bolt"] },
  { appName: "Lovable", patterns: ["lovable"] },
  { appName: "Localhost", patterns: ["localhost", "127.0.0.1"] },
];

const IDLE_THRESHOLD_SECS = 90;
const AI_OUTPUT_GRACE_SECS = 120;
const VISIBLE_APP_TTL_SECS = 18;
const POLL_INTERVAL_MS = 2000;
const FRESH_INPUT_WINDOW_MS = Math.max(POLL_INTERVAL_MS * 2, 5000);

interface ActiveSession {
  id: number;
  appName: string;
  projectName: string | null;
  lastActive: number;
}

type InputKind = "keyboard" | "mouse_click" | "wheel";

let activeSessions: Map<string, ActiveSession> = new Map();
let pollInterval: ReturnType<typeof setInterval> | null = null;

let hookStarted = false;
let hookListenersRegistered = false;
let lastRawInputTime = 0;
let lastRawKeyTime = 0;
let lastRawMouseTime = 0;
let lastRawInputKind: InputKind | null = null;
let lastTrackedInputEventTime = 0;
const lastToolActionTime = new Map<string, number>();
const lastToolBuildSignalTime = new Map<string, number>();

function clearToolSignals() {
  lastToolActionTime.clear();
  lastToolBuildSignalTime.clear();
  lastTrackedInputEventTime = lastRawInputTime;
}

function noteRawInput(kind: InputKind) {
  const now = Date.now();

  lastRawInputTime = now;
  lastRawInputKind = kind;
  if (kind === "keyboard") lastRawKeyTime = now;
  if (kind !== "keyboard") lastRawMouseTime = now;
}

function registerInputHooks() {
  if (hookListenersRegistered) return;
  hookListenersRegistered = true;

  uIOhook.on("keydown", () => noteRawInput("keyboard"));
  uIOhook.on("mousedown", () => noteRawInput("mouse_click"));
  uIOhook.on("mouseup", () => noteRawInput("mouse_click"));
  uIOhook.on("click", () => noteRawInput("mouse_click"));
  uIOhook.on("wheel", () => noteRawInput("wheel"));
}

function startInputHook() {
  if (hookStarted) return;
  registerInputHooks();

  try {
    uIOhook.start();
    hookStarted = true;
  } catch (error) {
    console.error("Input hook failed to start:", error);
  }
}

function stopInputHook() {
  if (!hookStarted) return;
  try {
    uIOhook.stop();
  } catch (error) {
    console.error("Input hook failed to stop:", error);
  }
  hookStarted = false;
}

function consumeFreshInputInTrackedApp(): {
  fresh: boolean;
  kind: InputKind | null;
} {
  const now = Date.now();
  const isFresh =
    lastRawInputTime > lastTrackedInputEventTime &&
    now - lastRawInputTime <= FRESH_INPUT_WINDOW_MS;

  if (!isFresh) return { fresh: false, kind: null };

  lastTrackedInputEventTime = lastRawInputTime;
  return {
    fresh: true,
    kind: lastRawInputKind,
  };
}

let lastFileChangeTime = 0;
let fileWatcher: fs.FSWatcher | null = null;

function startFileWatcher() {
  let dir = process.cwd();
  for (let i = 0; i < 5; i++) {
    if (
      fs.existsSync(path.join(dir, "pnpm-workspace.yaml")) ||
      fs.existsSync(path.join(dir, "turbo.json"))
    ) {
      break;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  if (fileWatcher || !fs.existsSync(dir)) return;

  try {
    fileWatcher = fs.watch(dir, { recursive: true }, (_eventType, filename) => {
      if (!filename) return;
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
      ) {
        return;
      }
      if (
        !/\.(ts|tsx|js|jsx|css|html|md|prisma|py|rs|go|java|rb|swift|c|cpp|h)$/i.test(
          filename
        )
      ) {
        return;
      }
      if (filename.includes("tsbuildinfo") || filename.includes("__generated")) {
        return;
      }
      lastFileChangeTime = Date.now();
    });
  } catch (error) {
    console.error("File watcher failed to start:", error);
  }
}

function stopFileWatcher() {
  if (fileWatcher) {
    fileWatcher.close();
    fileWatcher = null;
  }
}

function isCodeBeingWritten(claudeActive: boolean): boolean {
  const windowMs = claudeActive ? 15_000 : 6000;
  return Date.now() - lastFileChangeTime < windowMs;
}

function includesAny(value: string, list: string[]): boolean {
  const lower = value.toLowerCase();
  return list.some((item) => lower.includes(item.toLowerCase()));
}

function normalizeAppName(appName: string): string {
  const lower = appName.toLowerCase();
  const match = CANONICAL_APP_NAMES.find((app) =>
    app.patterns.some((pattern) => lower.includes(pattern))
  );
  return match?.name ?? appName;
}

function appKey(appName: string): string {
  return normalizeAppName(appName).toLowerCase();
}

function isTrackedApp(appName: string): boolean {
  return includesAny(appName, TRACKED_APPS);
}

function isBrowserApp(appName: string): boolean {
  return includesAny(appName, BROWSER_APPS);
}

function resolveBrowserToolName(title: string | null | undefined): string | null {
  if (!title) return null;
  const lowerTitle = title.toLowerCase();
  const match = BROWSER_TOOL_TITLE_RULES.find((rule) =>
    rule.patterns.some((pattern) => lowerTitle.includes(pattern))
  );
  return match?.appName ?? null;
}

function resolveTrackedToolName(
  focusedAppName: string | null,
  windowTitle: string | null | undefined
): string | null {
  if (!focusedAppName) return null;
  if (isTrackedApp(focusedAppName)) return normalizeAppName(focusedAppName);
  if (isBrowserApp(focusedAppName)) return resolveBrowserToolName(windowTitle);
  return null;
}

function isExcludedApp(appName: string): boolean {
  const app = appName.toLowerCase();
  const canonical = normalizeAppName(appName).toLowerCase();
  return getExcludedApps().some((excluded) => {
    const value = excluded.toLowerCase();
    return (
      app.includes(value) ||
      value.includes(app) ||
      canonical.includes(value) ||
      value.includes(canonical)
    );
  });
}

function addActiveApp(
  activeApps: Set<string>,
  meta: Map<string, { source: string; confidence: number }>,
  appName: string,
  source: string,
  confidence: number
) {
  const canonicalName = normalizeAppName(appName);
  if (isExcludedApp(appName) || isExcludedApp(canonicalName)) return;
  activeApps.add(canonicalName);
  const existing = meta.get(canonicalName);
  if (!existing || confidence > existing.confidence) {
    meta.set(canonicalName, { source, confidence });
  }
}

function notifyRenderer(data: { activeApps?: string[]; active: boolean }) {
  const windows = BrowserWindow.getAllWindows();
  for (const w of windows) {
    w.webContents.send("tracker:update", data);
  }
}

function closeStaleSessions(now: number) {
  for (const [key, session] of activeSessions) {
    if ((now - session.lastActive) / 1000 > IDLE_THRESHOLD_SECS) {
      closeSession(session.id);
      activeSessions.delete(key);
      lastToolActionTime.delete(key);
      lastToolBuildSignalTime.delete(key);
    }
  }
}

function getVisibleSessionApps(now: number): string[] {
  return Array.from(activeSessions.values())
    .filter((session) => (now - session.lastActive) / 1000 <= VISIBLE_APP_TTL_SECS)
    .sort((a, b) => b.lastActive - a.lastActive)
    .map((session) => session.appName);
}

let claudeRunning = false;
let claudeCheckTime = 0;

function checkClaudeProcess(): Promise<boolean> {
  if (Date.now() - claudeCheckTime < 4000) return Promise.resolve(claudeRunning);
  return new Promise((resolve) => {
    execFile(
      "tasklist",
      ["/FI", "IMAGENAME eq claude.exe", "/NH"],
      { timeout: 2000 },
      (err, stdout) => {
        claudeCheckTime = Date.now();
        claudeRunning = !err && stdout.includes("claude.exe");
        resolve(claudeRunning);
      }
    );
  });
}

function lastToolSignalTime(appName: string): number {
  const key = appKey(appName);
  return Math.max(
    lastToolActionTime.get(key) || 0,
    lastToolBuildSignalTime.get(key) || 0
  );
}

function hasRecentBuildActivity(appName: string, now: number): boolean {
  return now - lastToolSignalTime(appName) <= IDLE_THRESHOLD_SECS * 1000;
}

function hasLikelyAiOutput(
  appName: string,
  now: number,
  claudeActive: boolean
): boolean {
  if (!claudeActive) return false;
  return now - lastToolSignalTime(appName) <= AI_OUTPUT_GRACE_SECS * 1000;
}

async function poll() {
  try {
    if (getTrackingPaused()) {
      for (const session of activeSessions.values()) {
        closeSession(session.id);
      }
      activeSessions.clear();
      clearToolSignals();
      notifyRenderer({ active: false });
      return;
    }

    const activeWin = await import("active-win");
    const focusedWin = await activeWin.activeWindow();
    const focusedAppName = focusedWin?.owner.name ?? null;
    const focusedToolName = resolveTrackedToolName(
      focusedAppName,
      focusedWin?.title
    );
    const focusedIsTracked =
      Boolean(focusedToolName) &&
      !isExcludedApp(focusedAppName || "") &&
      !isExcludedApp(focusedToolName || "");

    const now = Date.now();
    const activeApps = new Set<string>();
    const sessionMeta = new Map<string, { source: string; confidence: number }>();
    const claude = await checkClaudeProcess();
    const codeChanging = focusedIsTracked && isCodeBeingWritten(claude);

    let freshInput = { fresh: false, kind: null as InputKind | null };
    if (focusedIsTracked) {
      freshInput = consumeFreshInputInTrackedApp();
    }

    if (focusedToolName && codeChanging) {
      lastToolBuildSignalTime.set(appKey(focusedToolName), now);
    }

    const positiveInput =
      freshInput.fresh &&
      (freshInput.kind === "keyboard" || freshInput.kind === "mouse_click");
    const wheelExtendsExistingSession =
      freshInput.fresh &&
      freshInput.kind === "wheel" &&
      Boolean(focusedToolName && activeSessions.has(appKey(focusedToolName)));

    if (focusedToolName && positiveInput) {
      lastToolActionTime.set(appKey(focusedToolName), now);
    }

    const existingFocusedSession = Boolean(
      focusedToolName && activeSessions.has(appKey(focusedToolName))
    );
    const recentBuildActivity =
      focusedIsTracked &&
      focusedToolName &&
      existingFocusedSession &&
      hasRecentBuildActivity(focusedToolName, now);
    const likelyAiOutput =
      focusedIsTracked &&
      focusedToolName &&
      existingFocusedSession &&
      hasLikelyAiOutput(focusedToolName, now, claude);

    if (
      focusedToolName &&
      (positiveInput ||
        codeChanging ||
        wheelExtendsExistingSession ||
        recentBuildActivity ||
        likelyAiOutput)
    ) {
      if (codeChanging) {
        addActiveApp(activeApps, sessionMeta, focusedToolName, "file_activity", 0.78);
      } else if (positiveInput) {
        addActiveApp(
          activeApps,
          sessionMeta,
          focusedToolName,
          "input_activity",
          freshInput.kind === "keyboard" ? 0.68 : 0.55
        );
      } else if (likelyAiOutput) {
        addActiveApp(
          activeApps,
          sessionMeta,
          focusedToolName,
          "terminal_process",
          0.68
        );
      } else if (wheelExtendsExistingSession) {
        addActiveApp(activeApps, sessionMeta, focusedToolName, "input_activity", 0.45);
      } else {
        addActiveApp(activeApps, sessionMeta, focusedToolName, "active_window", 0.5);
      }

      if (
        claude &&
        (focusedToolName.toLowerCase().includes("claude") ||
          focusedToolName.toLowerCase().includes("terminal"))
      ) {
        addActiveApp(activeApps, sessionMeta, "claude", "terminal_process", 0.7);
      }
    }

    if (activeApps.size > 0) {
      const tickSecs = Math.round(POLL_INTERVAL_MS / 1000);
      const projectName = getCurrentProject();
      const title = getRedactWindowTitles() ? null : focusedWin?.title ?? null;

      tickDailyTotal(tickSecs);

      for (const appName of activeApps) {
        const key = appKey(appName);
        const canonicalName = normalizeAppName(appName);
        let session = activeSessions.get(key);
        if (!session) {
          const metadata =
            sessionMeta.get(canonicalName) || {
              source: "active_window",
              confidence: 0.5,
            };
          const newSession = startSession(
            canonicalName,
            title,
            projectName,
            metadata.source,
            metadata.confidence
          );
          session = {
            id: newSession.id,
            appName: canonicalName,
            projectName,
            lastActive: now,
          };
          activeSessions.set(key, session);
        }
        session.lastActive = now;
        tickSession(session.id, tickSecs);
      }

      closeStaleSessions(now);
      notifyRenderer({ activeApps: getVisibleSessionApps(now), active: true });
    } else {
      closeStaleSessions(now);
      const visibleApps = getVisibleSessionApps(now);
      notifyRenderer({
        activeApps: visibleApps,
        active: false,
      });
    }
  } catch (err) {
    console.error("Tracker poll error:", err);
  }
}

export function startTracking() {
  if (pollInterval) return;
  startInputHook();
  startFileWatcher();
  poll();
  pollInterval = setInterval(poll, POLL_INTERVAL_MS);
}

export function stopTracking() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
  stopInputHook();
  stopFileWatcher();
  for (const session of activeSessions.values()) {
    closeSession(session.id);
  }
  activeSessions.clear();
  clearToolSignals();
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
