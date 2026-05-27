"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Globe2, Lock, Send, Sparkles } from "lucide-react";

const KINDS = [
  "build_note",
  "repo",
  "pull_request",
  "deployment",
  "demo",
  "screenshot",
  "changelog",
];

export function ProofComposer() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    projectName: "",
    kind: "build_note",
    summary: "",
    note: "",
    repoUrl: "",
    pullRequestUrl: "",
    deploymentUrl: "",
    demoUrl: "",
    commitRange: "",
    isPublic: true,
  });

  const update = (key: keyof typeof form, value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const res = await fetch("/api/proofs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);

    if (res.ok) {
      setForm({
        title: "",
        projectName: "",
        kind: "build_note",
        summary: "",
        note: "",
        repoUrl: "",
        pullRequestUrl: "",
        deploymentUrl: "",
        demoUrl: "",
        commitRange: "",
        isPublic: true,
      });
      router.refresh();
    } else {
      alert("Failed to save proof");
    }
  };

  return (
    <Card className="vc-panel border-white/10 bg-card/80">
      <CardHeader className="border-b border-white/10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="vc-section-title">Proof composer</p>
            <CardTitle className="mt-1 font-mono text-xl">Add Proof</CardTitle>
          </div>
          <div className="grid size-10 place-items-center rounded-lg border border-emerald-400/20 bg-emerald-400/10 text-emerald-200">
            <Sparkles className="size-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="proof-title">Title</Label>
            <Input
              id="proof-title"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              className="mt-1 border-white/10 bg-white/[0.035]"
            />
          </div>
          <div>
            <Label htmlFor="proof-project">Project</Label>
            <Input
              id="proof-project"
              value={form.projectName}
              onChange={(e) => update("projectName", e.target.value)}
              className="mt-1 border-white/10 bg-white/[0.035]"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="proof-kind">Type</Label>
            <select
              id="proof-kind"
              value={form.kind}
              onChange={(e) => update("kind", e.target.value)}
              className="mt-1 h-9 w-full rounded-lg border border-white/10 bg-background px-2 text-sm text-foreground"
            >
              {KINDS.map((kind) => (
                <option key={kind} value={kind}>
                  {kind.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="proof-commits">Commit Range</Label>
            <Input
              id="proof-commits"
              value={form.commitRange}
              onChange={(e) => update("commitRange", e.target.value)}
              className="mt-1 border-white/10 bg-white/[0.035] font-mono"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="proof-summary">Summary</Label>
          <Textarea
            id="proof-summary"
            value={form.summary}
            onChange={(e) => update("summary", e.target.value)}
            className="mt-1 border-white/10 bg-white/[0.035]"
            rows={2}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            placeholder="Repo URL"
            value={form.repoUrl}
            onChange={(e) => update("repoUrl", e.target.value)}
            className="border-white/10 bg-white/[0.035]"
          />
          <Input
            placeholder="PR URL"
            value={form.pullRequestUrl}
            onChange={(e) => update("pullRequestUrl", e.target.value)}
            className="border-white/10 bg-white/[0.035]"
          />
          <Input
            placeholder="Deployment URL"
            value={form.deploymentUrl}
            onChange={(e) => update("deploymentUrl", e.target.value)}
            className="border-white/10 bg-white/[0.035]"
          />
          <Input
            placeholder="Demo URL"
            value={form.demoUrl}
            onChange={(e) => update("demoUrl", e.target.value)}
            className="border-white/10 bg-white/[0.035]"
          />
        </div>

        <div>
          <Label htmlFor="proof-note">Build Note</Label>
          <Textarea
            id="proof-note"
            value={form.note}
            onChange={(e) => update("note", e.target.value)}
            className="mt-1 border-white/10 bg-white/[0.035]"
            rows={3}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isPublic}
              onChange={(e) => update("isPublic", e.target.checked)}
              className="h-4 w-4 rounded border-border accent-neon"
            />
            {form.isPublic ? (
              <>
                <Globe2 className="size-4 text-emerald-300" />
                Public
              </>
            ) : (
              <>
                <Lock className="size-4 text-amber-300" />
                Private
              </>
            )}
          </label>
          <Button
            onClick={submit}
            disabled={saving || !form.title.trim()}
            className="bg-emerald-300 font-semibold text-black hover:bg-emerald-200"
          >
            <Send className="size-4" />
            {saving ? "Saving" : "Save Proof"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
