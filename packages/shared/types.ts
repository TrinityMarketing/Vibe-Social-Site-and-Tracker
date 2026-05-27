// Session payload sent from desktop app to web API
export interface SessionPayload {
  appName: string;
  windowTitle: string | null;
  projectName?: string | null;
  startTime: string; // ISO 8601
  endTime: string | null; // ISO 8601, null while session is active
  durationSecs: number;
  source?: SessionSource;
  confidence?: number;
}

// Batch sync request from desktop app
export interface BatchSyncRequest {
  sessions: SessionPayload[];
}

// Batch sync response from web API
export interface BatchSyncResponse {
  synced: number;
  errors: string[];
}

// Aggregated user stats for profile display
export interface UserStats {
  totalHours: number;
  currentStreak: number;
  longestStreak: number;
  weeklyHours: number;
  topApps: { appName: string; totalHours: number }[];
  weeklyBreakdown: { day: string; hours: number }[];
}

// Presence heartbeat from desktop
export interface PresencePayload {
  appName: string;
  projectName?: string | null;
}

// Presence response from API
export interface PresenceStatus {
  isLive: boolean;
  currentApp: string | null;
  currentProject: string | null;
  lastSeenAt: string | null;
}

// Heatmap day entry
export interface HeatmapDay {
  date: string;
  totalSecs: number;
  topApp: string | null;
}

// Heatmap API response
export interface HeatmapResponse {
  days: HeatmapDay[];
}

// User roles
export type UserRole = "builder" | "engineer" | "ai_expert";

export type SessionSource =
  | "active_window"
  | "input_activity"
  | "file_activity"
  | "terminal_process"
  | "editor_plugin"
  | "manual";

export interface PrivacySettings {
  showPresence: boolean;
  trackingPaused: boolean;
  redactWindowTitles: boolean;
  excludedApps: string[];
  hiddenApps: string[];
  privateProjects: string[];
  currentProject: string | null;
}

export interface ProofObjectPayload {
  title: string;
  projectName?: string | null;
  kind?: string;
  summary?: string | null;
  note?: string | null;
  repoUrl?: string | null;
  pullRequestUrl?: string | null;
  deploymentUrl?: string | null;
  demoUrl?: string | null;
  screenshotUrl?: string | null;
  changelogUrl?: string | null;
  commitRange?: string | null;
  shippedAt?: string | null;
  isPublic?: boolean;
}

// Tracked apps list (shared between desktop and web)
export const TRACKED_APPS = [
  "Cursor",
  "Codex",
  "Code",         // VS Code
  "claude",       // Claude Code CLI
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
  "ChatGPT",
  "Claude",
  "GitHub",
  "Vercel",
  "Supabase",
  "Replit",
  "StackBlitz",
  "Bolt",
  "Lovable",
  "Localhost",
] as const;
