const APP_COLORS: Record<string, string> = {
  Cursor: "#00b4d8",
  Code: "#007acc",
  claude: "#d97706",
  Terminal: "#22c55e",
  iTerm2: "#16a34a",
  Warp: "#6366f1",
  Windsurf: "#06b6d4",
  Zed: "#f59e0b",
  WebStorm: "#00c7b7",
  PyCharm: "#21c97e",
  Xcode: "#147efb",
};

export function AppIcon({
  appName,
  size = "md",
}: {
  appName: string;
  size?: "sm" | "md" | "lg";
}) {
  const color = APP_COLORS[appName] || "#6366f1";
  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-sm",
    lg: "h-10 w-10 text-base",
  };

  return (
    <div
      className={`${sizeClasses[size]} flex items-center justify-center rounded-md font-mono font-bold`}
      style={{ backgroundColor: `${color}20`, color }}
    >
      {appName.charAt(0).toUpperCase()}
    </div>
  );
}
