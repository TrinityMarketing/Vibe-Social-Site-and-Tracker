"use client";

import { useEffect, useState } from "react";
import {
  Download,
  Eye,
  EyeOff,
  Globe2,
  Pause,
  Save,
  ShieldCheck,
  UserRound,
  Wifi,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiKeyDisplay } from "@/components/dashboard/api-key-display";
import { toast } from "sonner";

interface UserProfile {
  displayName: string;
  bio: string;
  githubUrl: string;
  twitterUrl: string;
  websiteUrl: string;
  isPublic: boolean;
  showPresence: boolean;
  trackingPaused: boolean;
  redactWindowTitles: boolean;
  excludedApps: string[];
  hiddenApps: string[];
  privateProjects: string[];
  currentProject: string;
  apiKey: string;
}

const fieldClass = "mt-1 border-white/10 bg-white/[0.035]";

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/me/profile")
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to load profile");
        return r.json();
      })
      .then((data) => {
        setProfile(data);
        setLoadError(false);
      })
      .catch(() => {
        setLoadError(true);
        toast.error("Failed to load profile");
      });
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const res = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: profile.displayName,
          bio: profile.bio,
          githubUrl: profile.githubUrl,
          twitterUrl: profile.twitterUrl,
          websiteUrl: profile.websiteUrl,
          isPublic: profile.isPublic,
          showPresence: profile.showPresence,
          trackingPaused: profile.trackingPaused,
          redactWindowTitles: profile.redactWindowTitles,
          excludedApps: profile.excludedApps,
          hiddenApps: profile.hiddenApps,
          privateProjects: profile.privateProjects,
          currentProject: profile.currentProject,
        }),
      });
      if (res.ok) {
        toast.success("Profile updated");
      } else {
        toast.error("Failed to save");
      }
    } catch {
      toast.error("Failed to save");
    }
    setSaving(false);
  };

  if (loadError) {
    return (
      <div className="vc-container py-8">
        <div className="vc-panel border-amber-400/20 bg-amber-400/[0.06] p-6">
          <div className="flex gap-4">
            <div className="grid size-11 shrink-0 place-items-center rounded-lg border border-amber-400/25 bg-amber-400/10 text-amber-200">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <h1 className="font-mono text-xl font-semibold text-amber-200">
                Settings temporarily unavailable
              </h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                The settings shell is running, but your profile could not be loaded
                right now. Sign in or reconnect the database to continue.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="vc-container py-8">
        <div className="vc-panel p-6 text-sm text-muted-foreground">
          Loading settings...
        </div>
      </div>
    );
  }

  return (
    <div className="vc-container py-8 md:py-10">
      <div className="mb-8">
        <div className="vc-chip vc-chip-mint mb-4">
          <ShieldCheck className="size-3.5" />
          Privacy command center
        </div>
        <h1 className="font-mono text-4xl font-bold tracking-normal">Settings</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Control what gets tracked locally, what becomes public, and how your proof
          profile appears to other builders.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="vc-panel p-5 md:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="vc-section-title">Profile</p>
                <h2 className="mt-1 font-mono text-xl font-semibold">
                  Public identity
                </h2>
              </div>
              <div className="grid size-10 place-items-center rounded-lg border border-emerald-400/20 bg-emerald-400/10 text-emerald-200">
                <UserRound className="size-5" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={profile.displayName}
                  onChange={(e) =>
                    setProfile({ ...profile, displayName: e.target.value })
                  }
                  className={fieldClass}
                />
              </div>
              <div>
                <Label htmlFor="websiteUrl">Website URL</Label>
                <Input
                  id="websiteUrl"
                  placeholder="https://yoursite.com"
                  value={profile.websiteUrl || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, websiteUrl: e.target.value })
                  }
                  className={fieldClass}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio || ""}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  className={fieldClass}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="githubUrl">GitHub URL</Label>
                <Input
                  id="githubUrl"
                  placeholder="https://github.com/username"
                  value={profile.githubUrl || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, githubUrl: e.target.value })
                  }
                  className={fieldClass}
                />
              </div>
              <div>
                <Label htmlFor="twitterUrl">Twitter URL</Label>
                <Input
                  id="twitterUrl"
                  placeholder="https://twitter.com/username"
                  value={profile.twitterUrl || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, twitterUrl: e.target.value })
                  }
                  className={fieldClass}
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={profile.isPublic}
                  onChange={(e) =>
                    setProfile({ ...profile, isPublic: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-border accent-emerald-300"
                />
                <Globe2 className="size-4 text-emerald-300" />
                Public profile
              </label>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-emerald-300 font-semibold text-black hover:bg-emerald-200"
              >
                <Save className="size-4" />
                {saving ? "Saving" : "Save Profile"}
              </Button>
            </div>
          </section>

          <section className="vc-panel p-5 md:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="vc-section-title">Privacy</p>
                <h2 className="mt-1 font-mono text-xl font-semibold">
                  Tracking and public visibility
                </h2>
              </div>
              <div className="grid size-10 place-items-center rounded-lg border border-amber-400/20 bg-amber-400/10 text-amber-200">
                <EyeOff className="size-5" />
              </div>
            </div>

            <div>
              <Label htmlFor="currentProject">Currently Building</Label>
              <Input
                id="currentProject"
                value={profile.currentProject || ""}
                onChange={(e) =>
                  setProfile({ ...profile, currentProject: e.target.value })
                }
                className={fieldClass}
              />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={profile.trackingPaused}
                  onChange={(e) =>
                    setProfile({ ...profile, trackingPaused: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-border accent-emerald-300"
                />
                <Pause className="size-4 text-amber-300" />
                Pause tracking
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={profile.showPresence}
                  onChange={(e) =>
                    setProfile({ ...profile, showPresence: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-border accent-emerald-300"
                />
                <Wifi className="size-4 text-sky-300" />
                Show presence
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={profile.redactWindowTitles}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      redactWindowTitles: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-border accent-emerald-300"
                />
                <Eye className="size-4 text-emerald-300" />
                Redact titles
              </label>
            </div>

            <div className="mt-4 grid gap-4">
              <div>
                <Label htmlFor="excludedApps">Excluded Apps</Label>
                <Textarea
                  id="excludedApps"
                  value={profile.excludedApps.join(", ")}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      excludedApps: e.target.value
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean),
                    })
                  }
                  className={`${fieldClass} font-mono`}
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="hiddenApps">Hidden Public Tools</Label>
                <Textarea
                  id="hiddenApps"
                  value={profile.hiddenApps.join(", ")}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      hiddenApps: e.target.value
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean),
                    })
                  }
                  className={`${fieldClass} font-mono`}
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="privateProjects">Private Projects</Label>
                <Textarea
                  id="privateProjects"
                  value={profile.privateProjects.join(", ")}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      privateProjects: e.target.value
                        .split(",")
                        .map((item) => item.trim())
                        .filter(Boolean),
                    })
                  }
                  className={`${fieldClass} font-mono`}
                  rows={2}
                />
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="mt-5 bg-emerald-300 font-semibold text-black hover:bg-emerald-200"
            >
              <Save className="size-4" />
              {saving ? "Saving" : "Save Privacy"}
            </Button>
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <ApiKeyDisplay apiKey={profile.apiKey} />

          <section className="vc-panel p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="vc-section-title">Desktop app</p>
                <h2 className="mt-1 font-mono text-xl font-semibold">
                  Local tracker
                </h2>
              </div>
              <div className="grid size-10 place-items-center rounded-lg border border-sky-400/20 bg-sky-400/10 text-sky-200">
                <Download className="size-5" />
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Download the VibeClock desktop tracker to automatically log coding
              sessions.
            </p>
            <Button
              variant="outline"
              className="mt-4 w-full border-white/10 bg-white/[0.035]"
              disabled
            >
              <Download className="size-4" />
              Windows app soon
            </Button>
          </section>
        </aside>
      </div>
    </div>
  );
}
