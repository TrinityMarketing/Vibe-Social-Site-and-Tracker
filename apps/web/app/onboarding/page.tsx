"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ROLES = [
  { value: "builder", label: "Builder", desc: "I vibe code with AI tools" },
  { value: "engineer", label: "Engineer", desc: "I write code traditionally + AI" },
  { value: "ai_expert", label: "AI Expert", desc: "I build AI tools & models" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [role, setRole] = useState("builder");
  const [bio, setBio] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const checkUsername = async (value: string) => {
    setUsername(value);
    setUsernameError("");
    setUsernameAvailable(null);

    if (value.length < 3) return;

    setCheckingUsername(true);
    try {
      const res = await fetch(`/api/users/check-username?username=${value}`);
      const data = await res.json();
      setUsernameAvailable(data.available);
      if (!data.available && data.error) {
        setUsernameError(data.error);
      }
    } catch {
      setUsernameError("Failed to check");
    }
    setCheckingUsername(false);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, role, bio }),
      });

      if (!res.ok) {
        const data = await res.json();
        setUsernameError(data.error || "Something went wrong");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setApiKey(data.user.apiKey);
      setStep(3);
    } catch {
      setUsernameError("Something went wrong");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg border-border bg-card">
        <CardHeader>
          <CardTitle className="text-center font-mono text-2xl text-neon">
            {step < 3 ? "Set up your profile" : "You're all set!"}
          </CardTitle>
          {step < 3 && (
            <div className="flex justify-center gap-2 pt-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`h-1.5 w-12 rounded-full ${
                    i <= step ? "bg-neon" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="your-username"
                  value={username}
                  onChange={(e) => checkUsername(e.target.value.toLowerCase())}
                  className="mt-1 font-mono"
                />
                {checkingUsername && (
                  <p className="mt-1 text-sm text-muted-foreground">Checking...</p>
                )}
                {usernameAvailable === true && (
                  <p className="mt-1 text-sm text-neon">Available!</p>
                )}
                {usernameError && (
                  <p className="mt-1 text-sm text-red-400">{usernameError}</p>
                )}
              </div>
              <Button
                onClick={() => setStep(1)}
                disabled={!usernameAvailable}
                className="w-full bg-neon text-black hover:bg-neon/90"
              >
                Next
              </Button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <Label>What best describes you?</Label>
              <div className="space-y-3">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setRole(r.value)}
                    className={`w-full rounded-lg border p-4 text-left transition ${
                      role === r.value
                        ? "border-neon bg-neon/10"
                        : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{r.label}</span>
                      {role === r.value && (
                        <Badge className="bg-neon text-black">Selected</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{r.desc}</p>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(0)} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-neon text-black hover:bg-neon/90"
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="bio">Bio (optional)</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell the world what you're building..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 bg-neon text-black hover:bg-neon/90"
                >
                  {loading ? "Creating..." : "Create Profile"}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="rounded-lg border border-border bg-muted p-4">
                <Label className="text-muted-foreground">Your API Key</Label>
                <p className="mt-2 break-all font-mono text-sm text-neon">{apiKey}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Copy this key — you&apos;ll paste it into the desktop app to start tracking.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => navigator.clipboard.writeText(apiKey)}
                >
                  Copy to clipboard
                </Button>
              </div>
              <Button
                onClick={() => router.push("/dashboard")}
                className="w-full bg-neon text-black hover:bg-neon/90"
              >
                Go to Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
