export default function ProgressBar({ progress }: { progress: number }) {
  const pct = Math.round(Math.min(1, Math.max(0, progress)) * 100);
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-1 w-full bg-black/40"
    >
      <div
        className="h-full bg-amber-400 transition-[width] duration-150 ease-linear"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
