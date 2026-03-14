import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  getApiKey: () => ipcRenderer.invoke("get-api-key"),
  setApiKey: (key: string) => ipcRenderer.invoke("set-api-key", key),
  setApiUrl: (url: string) => ipcRenderer.invoke("set-api-url", url),
  getTodayStats: () => ipcRenderer.invoke("get-today-stats"),
  forceSync: () => ipcRenderer.invoke("force-sync"),
  onTrackerUpdate: (callback: (data: any) => void) => {
    ipcRenderer.on("tracker:update", (_, data) => callback(data));
  },
  closeWindow: () => ipcRenderer.invoke("close-window"),
  startResize: (direction: string) => ipcRenderer.invoke("start-resize", direction),
  stopResize: () => ipcRenderer.invoke("stop-resize"),
  getHash: () => window.location.hash,
});
