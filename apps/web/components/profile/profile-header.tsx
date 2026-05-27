import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BadgeCheck, ExternalLink, Github, Globe2, Twitter } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  builder: "Builder",
  engineer: "Engineer",
  ai_expert: "AI Expert",
};

const ROLE_COLORS: Record<string, string> = {
  builder: "vc-chip vc-chip-mint",
  engineer: "vc-chip vc-chip-sky",
  ai_expert: "vc-chip vc-chip-amber",
};

interface ProfileHeaderProps {
  displayName: string;
  username: string;
  bio: string | null;
  avatarUrl: string | null;
  role: string;
  githubUrl: string | null;
  twitterUrl: string | null;
  websiteUrl: string | null;
}

export function ProfileHeader({
  displayName,
  username,
  bio,
  avatarUrl,
  role,
  githubUrl,
  twitterUrl,
  websiteUrl,
}: ProfileHeaderProps) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
      <Avatar className="h-24 w-24 border border-white/15 bg-white/[0.04]">
        <AvatarImage src={avatarUrl || undefined} alt={displayName} />
        <AvatarFallback className="bg-muted text-2xl">
          {displayName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-3xl font-bold tracking-normal text-foreground">
            {displayName}
          </h1>
          <span className={ROLE_COLORS[role] || "vc-chip"}>
            <BadgeCheck className="size-3.5" />
            {ROLE_LABELS[role] || role}
          </span>
        </div>
        <p className="mt-1 font-mono text-muted-foreground">@{username}</p>
        {bio && <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">{bio}</p>}

        <div className="mt-5 flex flex-wrap gap-2">
          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="vc-chip transition hover:border-emerald-400/25 hover:text-foreground"
            >
              <Github className="size-3.5" />
              GitHub
            </a>
          )}
          {twitterUrl && (
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="vc-chip transition hover:border-emerald-400/25 hover:text-foreground"
            >
              <Twitter className="size-3.5" />
              Twitter
            </a>
          )}
          {websiteUrl && (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="vc-chip transition hover:border-emerald-400/25 hover:text-foreground"
            >
              <Globe2 className="size-3.5" />
              Website
              <ExternalLink className="size-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
