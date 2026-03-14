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
  Hyper: "#fff",
  kitty: "#8b5cf6",
  Ghostty: "#a78bfa",
};

// Simplified SVG icons for each tracked app
function AppSvg({ appName, size }: { appName: string; size: number }) {
  const s = size;
  const common = { width: s, height: s, viewBox: "0 0 24 24", fill: "none" };

  switch (appName) {
    // Cursor — tab-shaped icon matching the Cursor IDE logo
    case "Cursor":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="4" fill="#00b4d8" opacity="0.15" />
          <path d="M8 6h8a2 2 0 012 2v2h-4v4h4v2a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2z" fill="#00b4d8" />
        </svg>
      );

    // VS Code — code brackets
    case "Code":
      return (
        <svg {...common}>
          <path d="M15.5 2l5.5 5v10l-5.5 5L3 14.5V9.5L15.5 2z" fill="#007acc" opacity="0.2" />
          <path d="M9 7l-5 5 5 5M15 7l5 5-5 5" stroke="#007acc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    // Claude — sparkle/star shape
    case "claude":
      return (
        <svg {...common}>
          <path d="M12 2c.5 4 2 6.5 4.5 7.5C13 10 10.5 12.5 10 17c-.5-4-3-6.5-5.5-7.5C7 9 9.5 6.5 10 2h2z" fill="#d97706" />
          <circle cx="17" cy="17" r="2.5" fill="#d97706" opacity="0.6" />
        </svg>
      );

    // Terminal — prompt icon
    case "Terminal":
      return (
        <svg {...common}>
          <rect x="2" y="4" width="20" height="16" rx="2" fill="#22c55e" opacity="0.15" />
          <path d="M6 10l4 3-4 3" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13 16h5" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    // iTerm2 — terminal with two panes
    case "iTerm2":
      return (
        <svg {...common}>
          <rect x="2" y="4" width="20" height="16" rx="2" fill="#16a34a" opacity="0.15" />
          <line x1="12" y1="4" x2="12" y2="20" stroke="#16a34a" strokeWidth="1" opacity="0.4" />
          <path d="M5 10l3 2.5-3 2.5" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M15 10l3 2.5-3 2.5" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    // Warp — stylized arrow/warp shape
    case "Warp":
      return (
        <svg {...common}>
          <path d="M4 12h16M13 5l7 7-7 7" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 8l4 4-4 4" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
        </svg>
      );

    // Windsurf — wave/wind shape
    case "Windsurf":
      return (
        <svg {...common}>
          <path d="M3 12c2-3 5-3 7 0s5 3 7 0" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" />
          <path d="M3 8c2-3 5-3 7 0s5 3 7 0" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
          <path d="M3 16c2-3 5-3 7 0s5 3 7 0" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        </svg>
      );

    // Zed — lightning bolt Z
    case "Zed":
      return (
        <svg {...common}>
          <path d="M7 4h10l-7 8h7l-10 8 3-8H7l0 0z" fill="#f59e0b" opacity="0.9" />
        </svg>
      );

    // WebStorm — W with globe hint
    case "WebStorm":
      return (
        <svg {...common}>
          <rect x="2" y="2" width="20" height="20" rx="3" fill="#00c7b7" opacity="0.15" />
          <path d="M5 7l3 10 4-7 4 7 3-10" stroke="#00c7b7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    // PyCharm — P with python snake hint
    case "PyCharm":
      return (
        <svg {...common}>
          <rect x="2" y="2" width="20" height="20" rx="3" fill="#21c97e" opacity="0.15" />
          <path d="M8 6v12M8 6h4a3 3 0 010 6H8" stroke="#21c97e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="16" cy="16" r="1.5" fill="#21c97e" opacity="0.6" />
        </svg>
      );

    // Xcode — hammer
    case "Xcode":
      return (
        <svg {...common}>
          <path d="M14.7 6.3a1 1 0 00-1.4 0l-7 7a1 1 0 000 1.4l3 3a1 1 0 001.4 0l7-7a1 1 0 000-1.4l-3-3z" fill="#147efb" opacity="0.2" stroke="#147efb" strokeWidth="1.5" />
          <path d="M5 19l2-2" stroke="#147efb" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    // Hyper — underscore/cursor blink
    case "Hyper":
      return (
        <svg {...common}>
          <rect x="2" y="4" width="20" height="16" rx="2" fill="#fff" opacity="0.1" />
          <rect x="7" y="14" width="8" height="2" rx="1" fill="#fff" opacity="0.9" />
          <rect x="7" y="9" width="2" height="5" rx="0.5" fill="#fff" opacity="0.6" />
        </svg>
      );

    // kitty — cat ears terminal
    case "kitty":
      return (
        <svg {...common}>
          <path d="M4 8l3-5v5M20 8l-3-5v5" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="4" y="8" width="16" height="12" rx="2" fill="#8b5cf6" opacity="0.15" />
          <path d="M8 14l3 2.5-3 2.5" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    // Ghostty — ghost shape terminal
    case "Ghostty":
      return (
        <svg {...common}>
          <path d="M12 3C8 3 5 6 5 10v8c0 0 1-2 2.5-2s2 2 3.5 2 2-2 3.5-2 2.5 2 2.5 2v-8c0-4-3-7-7-7z" fill="#a78bfa" opacity="0.2" stroke="#a78bfa" strokeWidth="1.5" />
          <circle cx="9.5" cy="10" r="1.5" fill="#a78bfa" />
          <circle cx="14.5" cy="10" r="1.5" fill="#a78bfa" />
        </svg>
      );

    default:
      return null;
  }
}

export function AppIcon({
  appName,
  size = "md",
}: {
  appName: string;
  size?: "sm" | "md" | "lg";
}) {
  const color = APP_COLORS[appName] || "#6366f1";
  const pxSize = { sm: 24, md: 32, lg: 40 };
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  const svg = AppSvg({ appName, size: pxSize[size] });

  if (svg) {
    return (
      <div className={`${sizeClasses[size]} flex items-center justify-center`}>
        {svg}
      </div>
    );
  }

  // Fallback: colored first letter
  return (
    <div
      className={`${sizeClasses[size]} flex items-center justify-center rounded-md font-mono text-sm font-bold`}
      style={{ backgroundColor: `${color}20`, color }}
    >
      {appName.charAt(0).toUpperCase()}
    </div>
  );
}
