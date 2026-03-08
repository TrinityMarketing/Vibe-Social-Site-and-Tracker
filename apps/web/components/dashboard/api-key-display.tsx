"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ApiKeyDisplay({ apiKey: initialKey }: { apiKey: string }) {
  const [apiKey, setApiKey] = useState(initialKey);
  const [revealed, setRevealed] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [copied, setCopied] = useState(false);

  const maskedKey = apiKey.slice(0, 8) + "..." + apiKey.slice(-4);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRotate = async () => {
    if (!confirm("Regenerate your API key? The old key will stop working immediately.")) {
      return;
    }
    setRotating(true);
    try {
      const res = await fetch("/api/me/apikey/rotate", { method: "POST" });
      const data = await res.json();
      setApiKey(data.apiKey);
      setRevealed(true);
    } catch {
      alert("Failed to rotate API key");
    }
    setRotating(false);
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg">API Key</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded bg-muted px-3 py-2 font-mono text-sm text-neon">
            {revealed ? apiKey : maskedKey}
          </code>
          <Button variant="outline" size="sm" onClick={() => setRevealed(!revealed)}>
            {revealed ? "Hide" : "Show"}
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? "Copied!" : "Copy"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRotate}
            disabled={rotating}
          >
            {rotating ? "Rotating..." : "Rotate"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Paste this key in the desktop app to sync your sessions.
        </p>
      </CardContent>
    </Card>
  );
}
