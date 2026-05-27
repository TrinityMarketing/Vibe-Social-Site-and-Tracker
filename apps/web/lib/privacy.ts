const DEFAULT_SOURCE_CONFIDENCE: Record<string, number> = {
  active_window: 0.4,
  input_activity: 0.6,
  file_activity: 0.7,
  terminal_process: 0.7,
  editor_plugin: 0.95,
  manual: 0.5,
};

export function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeList(value: unknown): string[] {
  if (Array.isArray(value)) return asStringArray(value);
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeSource(source: unknown): string {
  if (
    source === "active_window" ||
    source === "input_activity" ||
    source === "file_activity" ||
    source === "terminal_process" ||
    source === "editor_plugin" ||
    source === "manual"
  ) {
    return source;
  }
  return "active_window";
}

export function normalizeConfidence(source: string, confidence: unknown): number {
  const fallback = DEFAULT_SOURCE_CONFIDENCE[source] ?? 0.4;
  if (typeof confidence !== "number" || Number.isNaN(confidence)) return fallback;
  return Math.max(0, Math.min(1, confidence));
}

export function inferProjectName(windowTitle: string | null | undefined): string | null {
  if (!windowTitle) return null;
  const parts = windowTitle
    .split(/\s[-|]\s/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return null;
  const likelyProject = parts.find((part) => /[\\/]|\.(tsx?|jsx?|py|prisma|md)$/.test(part));
  const value = likelyProject || parts[0];
  return value.replace(/^.*[\\/]/, "").slice(0, 80) || null;
}

export function matchesPrivateProject(
  projectName: string | null | undefined,
  windowTitle: string | null | undefined,
  privateProjects: string[]
): boolean {
  const haystack = `${projectName || ""} ${windowTitle || ""}`.toLowerCase();
  return privateProjects.some((project) =>
    haystack.includes(project.toLowerCase())
  );
}

export function isPublicSession(
  session: { appName: string; projectName?: string | null; windowTitle?: string | null },
  settings: { hiddenApps: unknown; excludedApps?: unknown; privateProjects: unknown }
): boolean {
  const hiddenApps = asStringArray(settings.hiddenApps).map((app) => app.toLowerCase());
  const excludedApps = asStringArray(settings.excludedApps).map((app) => app.toLowerCase());
  const privateProjects = asStringArray(settings.privateProjects);
  const app = session.appName.toLowerCase();
  return (
    !hiddenApps.includes(app) &&
    !excludedApps.includes(app) &&
    !matchesPrivateProject(session.projectName, session.windowTitle, privateProjects)
  );
}

export function publicWindowTitle(
  title: string | null | undefined,
  redactWindowTitles: boolean
): string | null {
  if (!title || redactWindowTitles) return null;
  return title;
}
