"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ApiKeyDisplay } from "@/components/dashboard/api-key-display";
import { toast } from "sonner";

interface UserProfile {
  displayName: string;
  bio: string;
  githubUrl: string;
  twitterUrl: string;
  websiteUrl: string;
  isPublic: boolean;
  apiKey: string;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/me/profile")
      .then((r) => r.json())
      .then(setProfile)
      .catch(() => toast.error("Failed to load profile"));
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
        }),
      });
      if (res.ok) {
        toast.success("Profile updated!");
      } else {
        toast.error("Failed to save");
      }
    } catch {
      toast.error("Failed to save");
    }
    setSaving(false);
  };

  if (!profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-8 font-mono text-3xl font-bold">Settings</h1>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={profile.displayName}
              onChange={(e) =>
                setProfile({ ...profile, displayName: e.target.value })
              }
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={profile.bio || ""}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              className="mt-1"
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
              className="mt-1"
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
              className="mt-1"
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
              className="mt-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isPublic"
              checked={profile.isPublic}
              onChange={(e) =>
                setProfile({ ...profile, isPublic: e.target.checked })
              }
              className="h-4 w-4 rounded border-border accent-neon"
            />
            <Label htmlFor="isPublic">Public profile</Label>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-neon text-black hover:bg-neon/90"
          >
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      <Separator className="my-8" />

      <ApiKeyDisplay apiKey={profile.apiKey} />

      <Separator className="my-8" />

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle>Desktop App</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Download the VibeClock desktop tracker to automatically log your coding
            sessions.
          </p>
          <Button variant="outline" className="mt-4" disabled>
            Download for Windows (coming soon)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
