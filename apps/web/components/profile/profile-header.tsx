import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const ROLE_LABELS: Record<string, string> = {
  builder: "Builder",
  engineer: "Engineer",
  ai_expert: "AI Expert",
};

const ROLE_COLORS: Record<string, string> = {
  builder: "bg-neon/20 text-neon border-neon/30",
  engineer: "bg-indigo/20 text-indigo border-indigo/30",
  ai_expert: "bg-amber-500/20 text-amber-400 border-amber-500/30",
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
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      <Avatar className="h-24 w-24 border-2 border-border">
        <AvatarImage src={avatarUrl || undefined} alt={displayName} />
        <AvatarFallback className="bg-muted text-2xl">
          {displayName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="text-center sm:text-left">
        <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
        <p className="font-mono text-muted-foreground">@{username}</p>
        <Badge className={`mt-2 ${ROLE_COLORS[role] || ""}`}>
          {ROLE_LABELS[role] || role}
        </Badge>
        {bio && <p className="mt-3 max-w-md text-muted-foreground">{bio}</p>}

        <div className="mt-3 flex gap-3">
          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground transition hover:text-foreground"
            >
              GitHub
            </a>
          )}
          {twitterUrl && (
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground transition hover:text-foreground"
            >
              Twitter
            </a>
          )}
          {websiteUrl && (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground transition hover:text-foreground"
            >
              Website
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
