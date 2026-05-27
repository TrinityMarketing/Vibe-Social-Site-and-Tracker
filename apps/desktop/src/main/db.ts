import initSqlJs, { Database as SqlJsDatabase } from "sql.js";
import { app } from "electron";
import path from "path";
import fs from "fs";

interface LocalSession {
  id: number;
  appName: string;
  windowTitle: string | null;
  projectName: string | null;
  startTime: string;
  endTime: string | null;
  durationSecs: number;
  source: string;
  confidence: number;
  synced: number;
}

let db: SqlJsDatabase;
let dbPath: string;

function saveDb() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

function ensureColumn(table: string, column: string, definition: string) {
  try {
    getDb().run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  } catch {
    // Column already exists.
  }
}

function getConfigValue(key: string): string | null {
  const result = getDb().exec("SELECT value FROM config WHERE key = ?", [key]);
  return result.length ? (result[0].values[0][0] as string) : null;
}

function setConfigValue(key: string, value: string) {
  getDb().run("INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)", [
    key,
    value,
  ]);
  saveDb();
}

function readJsonList(key: string): string[] {
  const raw = getConfigValue(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

export async function initDb() {
  dbPath = path.join(app.getPath("userData"), "vibeclock.db");

  const SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appName TEXT NOT NULL,
      windowTitle TEXT,
      projectName TEXT,
      startTime TEXT NOT NULL,
      endTime TEXT,
      durationSecs INTEGER DEFAULT 0,
      source TEXT DEFAULT 'active_window',
      confidence REAL DEFAULT 0.4,
      synced INTEGER DEFAULT 0
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS daily_totals (
      date TEXT PRIMARY KEY,
      totalSecs INTEGER DEFAULT 0
    );
  `);

  ensureColumn("sessions", "projectName", "TEXT");
  ensureColumn("sessions", "source", "TEXT DEFAULT 'active_window'");
  ensureColumn("sessions", "confidence", "REAL DEFAULT 0.4");

  saveDb();
  return db;
}

export function getDb() {
  if (!db) throw new Error("Database not initialized");
  return db;
}

export function startSession(
  appName: string,
  windowTitle: string | null,
  projectName: string | null,
  source = "active_window",
  confidence = 0.4
): LocalSession {
  const now = new Date().toISOString();
  getDb().run(
    "INSERT INTO sessions (appName, windowTitle, projectName, startTime, source, confidence) VALUES (?, ?, ?, ?, ?, ?)",
    [appName, windowTitle, projectName, now, source, confidence]
  );

  // Get ID before saveDb() — db.export() resets last_insert_rowid() in sql.js
  const result = getDb().exec(
    "SELECT last_insert_rowid() as id"
  );
  const id = result[0].values[0][0] as number;

  saveDb();

  return {
    id,
    appName,
    windowTitle,
    projectName,
    startTime: now,
    endTime: null,
    durationSecs: 0,
    source,
    confidence,
    synced: 0,
  };
}

export function tickSession(id: number, seconds: number) {
  getDb().run(
    "UPDATE sessions SET durationSecs = durationSecs + ? WHERE id = ?",
    [seconds, id]
  );
  saveDb();
}

export function closeSession(id: number) {
  const now = new Date().toISOString();
  getDb().run("UPDATE sessions SET endTime = ? WHERE id = ?", [now, id]);
  saveDb();
}

export function getUnsyncedSessions(): LocalSession[] {
  // Sync both closed sessions AND active sessions with accumulated time
  const result = getDb().exec(
    "SELECT id, appName, windowTitle, projectName, startTime, endTime, durationSecs, source, confidence, synced FROM sessions WHERE synced = 0 AND durationSecs > 0"
  );
  if (!result.length) return [];

  return result[0].values.map((row) => ({
    id: row[0] as number,
    appName: row[1] as string,
    windowTitle: row[2] as string | null,
    projectName: row[3] as string | null,
    startTime: row[4] as string,
    endTime: row[5] as string | null,
    durationSecs: row[6] as number,
    source: (row[7] as string | null) || "active_window",
    confidence: (row[8] as number | null) ?? 0.4,
    synced: row[9] as number,
  }));
}

export function markSynced(ids: number[]) {
  for (const id of ids) {
    getDb().run("UPDATE sessions SET synced = 1 WHERE id = ?", [id]);
  }
  saveDb();
}

// Increment wall-clock coding time for today (called once per poll, not per app)
export function tickDailyTotal(seconds: number) {
  const today = new Date().toISOString().split("T")[0];
  getDb().run(
    `INSERT INTO daily_totals (date, totalSecs) VALUES (?, ?)
     ON CONFLICT(date) DO UPDATE SET totalSecs = totalSecs + ?`,
    [today, seconds, seconds]
  );
  saveDb();
}

export function getTodayStats(): { totalSecs: number; appName: string | null } {
  const today = new Date().toISOString().split("T")[0];

  // Use wall-clock total (not sum of overlapping sessions)
  const totalResult = getDb().exec(
    `SELECT COALESCE(totalSecs, 0) FROM daily_totals WHERE date = '${today}'`
  );
  const totalSecs = totalResult.length ? (totalResult[0].values[0][0] as number) : 0;

  const topAppResult = getDb().exec(
    `SELECT appName FROM sessions WHERE startTime LIKE '${today}%' GROUP BY appName ORDER BY SUM(durationSecs) DESC LIMIT 1`
  );
  const appName = topAppResult.length
    ? (topAppResult[0].values[0][0] as string)
    : null;

  return { totalSecs, appName };
}

export function getApiKey(): string | null {
  return getConfigValue("apiKey");
}

export function setApiKey(key: string) {
  setConfigValue("apiKey", key);
}

export function getApiBaseUrl(): string {
  return getConfigValue("apiBaseUrl") || "http://localhost:3000";
}

export function setApiBaseUrl(url: string) {
  setConfigValue("apiBaseUrl", url);
}

export function getTrackingPaused(): boolean {
  return getConfigValue("trackingPaused") === "true";
}

export function setTrackingPaused(paused: boolean) {
  setConfigValue("trackingPaused", paused ? "true" : "false");
}

export function getRedactWindowTitles(): boolean {
  return getConfigValue("redactWindowTitles") !== "false";
}

export function setRedactWindowTitles(redact: boolean) {
  setConfigValue("redactWindowTitles", redact ? "true" : "false");
}

export function getExcludedApps(): string[] {
  return readJsonList("excludedApps");
}

export function setExcludedApps(apps: string[]) {
  setConfigValue("excludedApps", JSON.stringify(apps));
}

export function getCurrentProject(): string | null {
  return getConfigValue("currentProject") || null;
}

export function setCurrentProject(projectName: string | null) {
  if (projectName) {
    setConfigValue("currentProject", projectName);
  } else {
    setConfigValue("currentProject", "");
  }
}

export function getTrackerConfig() {
  return {
    trackingPaused: getTrackingPaused(),
    redactWindowTitles: getRedactWindowTitles(),
    excludedApps: getExcludedApps(),
    currentProject: getCurrentProject(),
  };
}

export function applyRemoteTrackerConfig(config: {
  trackingPaused?: boolean;
  redactWindowTitles?: boolean;
  excludedApps?: string[];
  currentProject?: string | null;
}) {
  if (typeof config.trackingPaused === "boolean") {
    setTrackingPaused(config.trackingPaused);
  }
  if (typeof config.redactWindowTitles === "boolean") {
    setRedactWindowTitles(config.redactWindowTitles);
  }
  if (Array.isArray(config.excludedApps)) {
    setExcludedApps(config.excludedApps);
  }
  if ("currentProject" in config) {
    setCurrentProject(config.currentProject || null);
  }
}
