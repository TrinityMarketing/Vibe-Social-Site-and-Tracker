"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Eye, EyeOff, KeyRound, RotateCcw } from "lucide-react";

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
    <Card className="vc-panel border-white/10 bg-card/80">
      <CardHeader className="border-b border-white/10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="vc-section-title">Local sync</p>
            <CardTitle className="mt-1 font-mono text-xl">API Key</CardTitle>
          </div>
          <div className="grid size-10 place-items-center rounded-lg border border-sky-400/20 bg-sky-400/10 text-sky-200">
            <KeyRound className="size-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <code className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/25 px-3 py-2 font-mono text-sm text-emerald-200">
            {revealed ? apiKey : maskedKey}
          </code>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRevealed(!revealed)}
            className="border-white/10 bg-white/[0.035]"
          >
            {revealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            {revealed ? "Hide" : "Show"}
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="border-white/10 bg-white/[0.035]"
          >
            <Copy className="size-4" />
            {copied ? "Copied!" : "Copy"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRotate}
            disabled={rotating}
            className="border-white/10 bg-white/[0.035]"
          >
            <RotateCcw className="size-4" />
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
