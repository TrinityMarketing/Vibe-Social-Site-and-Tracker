// Session payload sent from desktop app to web API
export interface SessionPayload {
  appName: string;
  windowTitle: string | null;
  startTime: string; // ISO 8601
  endTime: string;   // ISO 8601
  durationSecs: number;
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

// User roles
export type UserRole = "builder" | "engineer" | "ai_expert";

// Tracked apps list (shared between desktop and web)
export const TRACKED_APPS = [
  "Cursor",
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
] as const;
