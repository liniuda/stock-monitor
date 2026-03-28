"use client";

interface ScanProgressProps {
  progress: number;
  total: number;
}

export default function ScanProgress({ progress, total }: ScanProgressProps) {
  const pct = total > 0 ? Math.round((progress / total) * 100) : 0;

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-300">
          扫描中... {progress}/{total}
        </span>
        <span className="text-sm font-mono text-slate-400">{pct}%</span>
      </div>
      <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-300 animate-pulse"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
