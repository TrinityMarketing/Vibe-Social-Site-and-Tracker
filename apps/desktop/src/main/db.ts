import initSqlJs, { Database as SqlJsDatabase } from "sql.js";
import { app } from "electron";
import path from "path";
import fs from "fs";

interface LocalSession {
  id: number;
  appName: string;
  windowTitle: string | null;
  startTime: string;
  endTime: string | null;
  durationSecs: number;
  synced: number;
}

let db: SqlJsDatabase;
let dbPath: string;

function saveDb() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
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
      startTime TEXT NOT NULL,
      endTime TEXT,
      durationSecs INTEGER DEFAULT 0,
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

  saveDb();
  return db;
}

export function getDb() {
  if (!db) throw new Error("Database not initialized");
  return db;
}

export function startSession(
  appName: string,
  windowTitle: string | null
): LocalSession {
  const now = new Date().toISOString();
  getDb().run(
    "INSERT INTO sessions (appName, windowTitle, startTime) VALUES (?, ?, ?)",
    [appName, windowTitle, now]
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
    startTime: now,
    endTime: null,
    durationSecs: 0,
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
    "SELECT id, appName, windowTitle, startTime, endTime, durationSecs, synced FROM sessions WHERE synced = 0 AND durationSecs > 0"
  );
  if (!result.length) return [];

  return result[0].values.map((row) => ({
    id: row[0] as number,
    appName: row[1] as string,
    windowTitle: row[2] as string | null,
    startTime: row[3] as string,
    endTime: row[4] as string | null,
    durationSecs: row[5] as number,
    synced: row[6] as number,
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
  const result = getDb().exec(
    "SELECT value FROM config WHERE key = 'apiKey'"
  );
  return result.length ? (result[0].values[0][0] as string) : null;
}

export function setApiKey(key: string) {
  getDb().run(
    "INSERT OR REPLACE INTO config (key, value) VALUES ('apiKey', ?)",
    [key]
  );
  saveDb();
}

export function getApiBaseUrl(): string {
  const result = getDb().exec(
    "SELECT value FROM config WHERE key = 'apiBaseUrl'"
  );
  return result.length ? (result[0].values[0][0] as string) : "http://localhost:3000";
}

export function setApiBaseUrl(url: string) {
  getDb().run(
    "INSERT OR REPLACE INTO config (key, value) VALUES ('apiBaseUrl', ?)",
    [url]
  );
  saveDb();
}
