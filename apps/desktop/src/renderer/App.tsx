import React, { useEffect, useState } from "react";
import { Widget } from "./components/Widget";
import { Setup } from "./components/Setup";

declare global {
  interface Window {
    electronAPI: {
      getApiKey: () => Promise<string | null>;
      setApiKey: (key: string) => Promise<void>;
      setApiUrl: (url: string) => Promise<void>;
      getTodayStats: () => Promise<{ totalSecs: number; appName: string | null }>;
      forceSync: () => Promise<void>;
      onTrackerUpdate: (callback: (data: any) => void) => void;
      closeWindow: () => Promise<void>;
      getHash: () => string;
    };
  }
}

export function App() {
  const [view, setView] = useState<"widget" | "setup">("widget");

  useEffect(() => {
    const hash = window.location.hash;
    if (hash === "#setup") {
      setView("setup");
    } else {
      setView("widget");
    }
  }, []);

  if (view === "setup") {
    return <Setup />;
  }

  return <Widget />;
}
