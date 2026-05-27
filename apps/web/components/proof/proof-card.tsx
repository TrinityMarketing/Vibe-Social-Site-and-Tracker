import Link from "next/link";
import {
  BadgeCheck,
  BookOpen,
  ExternalLink,
  FileText,
  GitBranch,
  GitCommit,
  Github,
  ImageIcon,
  Lock,
  NotebookText,
  Rocket,
  ScreenShare,
  type LucideIcon,
} from "lucide-react";

export interface ProofCardData {
  id: string;
  title: string;
  projectName: string | null;
  kind: string;
  summary: string | null;
  note: string | null;
  repoUrl: string | null;
  pullRequestUrl: string | null;
  deploymentUrl: string | null;
  demoUrl: string | null;
  screenshotUrl: string | null;
  changelogUrl: string | null;
  commitRange: string | null;
  shippedAt: Date | string;
  isPublic?: boolean;
  user?: {
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

function formatDate(value: Date | string): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatKind(kind: string): string {
  return kind
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const kindIcons: Record<string, LucideIcon> = {
  build_note: NotebookText,
  repo: Github,
  pull_request: GitBranch,
  deployment: Rocket,
  demo: ScreenShare,
  screenshot: ImageIcon,
  changelog: BookOpen,
};

function proofLinks(proof: ProofCardData) {
  return [
    { label: "Repo", href: proof.repoUrl, icon: Github },
    { label: "PR", href: proof.pullRequestUrl, icon: GitBranch },
    { label: "Deploy", href: proof.deploymentUrl, icon: Rocket },
    { label: "Demo", href: proof.demoUrl, icon: ExternalLink },
    { label: "Screenshot", href: proof.screenshotUrl, icon: ImageIcon },
    { label: "Changelog", href: proof.changelogUrl, icon: BookOpen },
  ].filter((link) => link.href);
}

export function ProofCard({ proof }: { proof: ProofCardData }) {
  const links = proofLinks(proof);
  const KindIcon = kindIcons[proof.kind] || FileText;
  const displayName = proof.user?.displayName || "Builder";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <article className="vc-panel vc-focus-ring overflow-hidden p-0">
      <div className="flex gap-4 p-4 sm:p-5">
        <div className="hidden shrink-0 sm:block">
          <div className="grid size-12 place-items-center rounded-lg border border-emerald-400/20 bg-emerald-400/10 text-emerald-200 shadow-[0_0_28px_rgba(52,211,153,0.12)]">
            <KindIcon className="size-5" />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {proof.user ? (
              <Link
                href={`/${proof.user.username}`}
                className="group inline-flex min-w-0 items-center gap-2 text-sm"
              >
                <span className="grid size-7 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.045] font-mono text-xs text-foreground">
                  {initial}
                </span>
                <span className="min-w-0 truncate text-muted-foreground group-hover:text-foreground">
                  {displayName}
                  <span className="ml-1 text-foreground/45">
                    @{proof.user.username}
                  </span>
                </span>
              </Link>
            ) : (
              <span className="vc-chip">
                <BadgeCheck className="size-3.5" />
                Proof object
              </span>
            )}

            <span
              className={
                proof.isPublic === false
                  ? "vc-chip vc-chip-amber"
                  : "vc-chip vc-chip-mint"
              }
            >
              {proof.isPublic === false ? (
                <>
                  <Lock className="size-3.5" />
                  Private
                </>
              ) : (
                <>
                  <BadgeCheck className="size-3.5" />
                  Public proof
                </>
              )}
            </span>
          </div>

          <div className="mt-4">
            <div className="flex items-center gap-2 sm:hidden">
              <div className="grid size-9 place-items-center rounded-lg border border-emerald-400/20 bg-emerald-400/10 text-emerald-200">
                <KindIcon className="size-4" />
              </div>
            </div>
            <h3 className="mt-2 font-mono text-xl font-semibold leading-tight text-foreground sm:mt-0">
              {proof.title}
            </h3>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {proof.projectName && (
                <span className="vc-chip vc-chip-sky">{proof.projectName}</span>
              )}
              <span className="vc-chip vc-chip-amber">
                {formatKind(proof.kind)}
              </span>
              <span className="vc-chip">{formatDate(proof.shippedAt)}</span>
            </div>
          </div>

          {proof.summary && (
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              {proof.summary}
            </p>
          )}
          {proof.note && (
            <p className="mt-4 rounded-lg border border-white/10 bg-white/[0.035] p-3 text-sm leading-6 text-foreground">
              {proof.note}
            </p>
          )}

          {(proof.commitRange || links.length > 0) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {proof.commitRange && (
                <span className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-black/20 px-2 py-1 font-mono text-xs text-muted-foreground">
                  <GitCommit className="size-3.5" />
                  {proof.commitRange}
                </span>
              )}
              {links.map((link) => {
                const Icon = link.icon;
                return (
                  <a
                    key={link.label}
                    href={link.href || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.035] px-2 py-1 text-xs text-muted-foreground transition hover:border-emerald-400/25 hover:text-foreground"
                  >
                    <Icon className="size-3.5" />
                    {link.label}
                  </a>
                );
              })}
            </div>
          )}

          {!proof.summary && !proof.note && links.length === 0 && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-muted-foreground">
              <FileText className="size-4" />
              Proof shell ready for links, notes, and shipped artifacts.
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
