import {
  app,
  BrowserWindow,
  Tray,
  Menu,
  ipcMain,
  nativeImage,
  screen,
} from "electron";
import path from "path";
import { initDb, getApiKey, setApiKey, setApiBaseUrl, getTodayStats } from "./db";
import { startTracking, stopTracking } from "./tracker";
import { startSyncLoop, stopSyncLoop, syncSessions } from "./sync";
import { startHeartbeat, stopHeartbeat } from "./heartbeat";

let widgetWindow: BrowserWindow | null = null;
let setupWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;
let resizeInterval: ReturnType<typeof setInterval> | null = null;

// ── Auto-launch on system startup ──────────────────────────────
function setupAutoLaunch() {
  app.setLoginItemSettings({
    openAtLogin: true,
    args: ["--hidden"],
  });
}

// ── Floating widget (always-on-top, draggable) ─────────────────
function createWidget() {
  const display = screen.getPrimaryDisplay();
  const { width: screenW, height: screenH } = display.workAreaSize;

  widgetWindow = new BrowserWindow({
    width: 180,
    height: 85,
    x: screenW - 200,
    y: screenH - 105,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    minWidth: 140,
    minHeight: 55,
    maxWidth: 500,
    maxHeight: 300,
    skipTaskbar: true,
    hasShadow: false,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  widgetWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  if (process.env.ELECTRON_RENDERER_URL) {
    widgetWindow.loadURL(`${process.env.ELECTRON_RENDERER_URL}#widget`);
  } else {
    widgetWindow.loadFile(path.join(__dirname, "../renderer/index.html"), {
      hash: "widget",
    });
  }

  widgetWindow.on("closed", () => {
    widgetWindow = null;
  });
}

// ── Setup window (for API key entry) ───────────────────────────
function createSetupWindow() {
  setupWindow = new BrowserWindow({
    width: 380,
    height: 320,
    frame: false,
    transparent: true,
    resizable: false,
    center: true,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    setupWindow.loadURL(`${process.env.ELECTRON_RENDERER_URL}#setup`);
  } else {
    setupWindow.loadFile(path.join(__dirname, "../renderer/index.html"), {
      hash: "setup",
    });
  }

  setupWindow.on("closed", () => {
    setupWindow = null;
  });
}

// ── System tray ────────────────────────────────────────────────
function createTray() {
  // Create a 32x32 tray icon with a green dot (VibeClock brand)
  const size = 32;
  const canvas = Buffer.alloc(size * size * 4); // RGBA
  const cx = size / 2;
  const cy = size / 2;
  const radius = 10;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const offset = (y * size + x) * 4;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (dist <= radius) {
        // Green circle (#00ff88)
        const alpha = dist > radius - 1 ? Math.max(0, (radius - dist) * 255) : 255;
        canvas[offset] = 0;      // R
        canvas[offset + 1] = 255; // G
        canvas[offset + 2] = 136; // B
        canvas[offset + 3] = Math.round(alpha); // A
      } else {
        canvas[offset + 3] = 0; // Transparent
      }
    }
  }

  const icon = nativeImage.createFromBuffer(canvas, { width: size, height: size });

  tray = new Tray(icon);
  tray.setToolTip("VibeClock");

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show Widget",
      click: () => {
        if (widgetWindow) {
          widgetWindow.show();
        } else {
          createWidget();
        }
      },
    },
    {
      label: "Hide Widget",
      click: () => widgetWindow?.hide(),
    },
    { type: "separator" },
    {
      label: "Settings",
      click: () => {
        if (setupWindow) {
          setupWindow.show();
          setupWindow.focus();
        } else {
          createSetupWindow();
        }
      },
    },
    {
      label: "Force Sync",
      click: () => syncSessions(),
    },
    { type: "separator" },
    {
      label: "Quit VibeClock",
      click: () => {
        isQuitting = true;
        stopTracking();
        stopSyncLoop();
        stopHeartbeat();
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on("click", () => {
    if (widgetWindow?.isVisible()) {
      widgetWindow.hide();
    } else if (widgetWindow) {
      widgetWindow.show();
    } else {
      createWidget();
    }
  });
}

// ── App lifecycle ──────────────────────────────────────────────
app.whenReady().then(async () => {
  await initDb();

  setupAutoLaunch();
  createTray();

  const apiKey = getApiKey();
  if (apiKey) {
    // Has API key — show widget and start tracking
    createWidget();
    startTracking();
    startSyncLoop();
    startHeartbeat();
  } else {
    // No API key — show setup window
    createSetupWindow();
  }
});

app.on("window-all-closed", (e: Event) => {
  if (!isQuitting) {
    e.preventDefault();
  }
});

app.on("before-quit", () => {
  isQuitting = true;
  stopTracking();
  stopSyncLoop();
  stopHeartbeat();
});

// ── IPC handlers ───────────────────────────────────────────────
ipcMain.handle("get-api-key", () => getApiKey());

ipcMain.handle("set-api-key", async (_, key: string) => {
  setApiKey(key);
  // Close setup, launch widget + tracking
  setupWindow?.close();
  if (!widgetWindow) createWidget();
  startTracking();
  startSyncLoop();
});

ipcMain.handle("set-api-url", (_, url: string) => setApiBaseUrl(url));
ipcMain.handle("get-today-stats", () => getTodayStats());
ipcMain.handle("force-sync", () => syncSessions());

ipcMain.handle("close-window", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  win?.close();
});

// ── Resize helpers (frameless window corner-drag) ─────────────
ipcMain.handle("start-resize", (event, direction: string) => {
  if (resizeInterval) clearInterval(resizeInterval);

  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return;

  const startCursor = screen.getCursorScreenPoint();
  const startBounds = win.getBounds();
  let lastCursor = { ...startCursor };
  let staleCount = 0;

  resizeInterval = setInterval(() => {
    const cursor = screen.getCursorScreenPoint();

    // Safety: stop if cursor idle for ~1s (user likely released outside window)
    if (cursor.x === lastCursor.x && cursor.y === lastCursor.y) {
      staleCount++;
      if (staleCount > 60) {
        clearInterval(resizeInterval!);
        resizeInterval = null;
        return;
      }
    } else {
      staleCount = 0;
      lastCursor = { ...cursor };
    }

    const dx = cursor.x - startCursor.x;
    const dy = cursor.y - startCursor.y;

    let { x, y, width, height } = { ...startBounds };

    if (direction.includes("right")) {
      width = Math.max(140, startBounds.width + dx);
    }
    if (direction.includes("bottom")) {
      height = Math.max(50, startBounds.height + dy);
    }
    if (direction.includes("left")) {
      const newW = Math.max(140, startBounds.width - dx);
      x = startBounds.x + startBounds.width - newW;
      width = newW;
    }
    if (direction.includes("top")) {
      const newH = Math.max(50, startBounds.height - dy);
      y = startBounds.y + startBounds.height - newH;
      height = newH;
    }

    win.setBounds({
      x: Math.round(x),
      y: Math.round(y),
      width: Math.round(width),
      height: Math.round(height),
    });
  }, 16); // ~60fps
});

ipcMain.handle("stop-resize", () => {
  if (resizeInterval) {
    clearInterval(resizeInterval);
    resizeInterval = null;
  }
});
