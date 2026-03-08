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

let widgetWindow: BrowserWindow | null = null;
let setupWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

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
    height: 70,
    x: screenW - 200,
    y: screenH - 90,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
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

  if (process.env.NODE_ENV === "development") {
    widgetWindow.loadURL("http://localhost:5173/#widget");
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

  if (process.env.NODE_ENV === "development") {
    setupWindow.loadURL("http://localhost:5173/#setup");
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
  const icon = nativeImage.createFromDataURL(
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAhGVYSWZNTQAqAAAACAAFARIAAwAAAAEAAQAAARoABQAAAAEAAABKARsABQAAAAEAAABSASgAAwAAAAEAAgAAh2kABAAAAAEAAABaAAAAAAAA8AAAAAEAAADwAAAAAQADoAEAAwAAAAEAAQAAoAIABAAAAAEAAAAQoAMABAAAAAEAAAAQAAAAAJNkEGUAAAAJcEhZcwAAIdUAACHVAQSctJ0AAAEpSURBVDhPY/hPABMFBhgYAABZhGrBihUrGNasWcPg4ODA8Pv3b4Z///4xHD58mOHv378M69evZ8jIyGDYsGEDw5UrVxi0tLQYNm7cyLBlyxaG////M/z//5/h2bNnDC9fvmR4/fo1w8ePHxmEhYUZ2NjYGLi5uRmYmJgYGBkZGRgAAJYZ/pOSkvIHqP8HMHYD2P9CQ0N/gJwFUsfAwMDI8J8hBKQQ5AKQAaArQJIMIPwfkGRkZPwPNBcsnZGRwbB582aGr1+/Mvz69YsBqA/sUpAXwAaA/P3//3+Gp0+fMrx48YLh7du3DJ8+fWL48eMHw7dv3xi+fPnC8PnzZ4a3b98yvH//nuH9+/cMnz9/Zvj27RvD9+/fGX78+MGgoaHBcOjQIYZFixYxAACVT3k1Tn+Z4AAAAABJRU5ErkJggg=="
  );

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
