export function LivePulse({ className = "" }: { className?: string }) {
  return (
    <span className={`relative flex h-3 w-3 ${className}`}>
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon opacity-75" />
      <span className="relative inline-flex h-3 w-3 rounded-full bg-neon" />
    </span>
  );
}
