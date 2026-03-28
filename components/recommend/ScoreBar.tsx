"use client";

interface ScoreBarProps {
  score: number;
  maxScore: number;
}

export default function ScoreBar({ score, maxScore }: ScoreBarProps) {
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;

  let colorClass = "bg-slate-600";
  if (pct > 80) colorClass = "bg-red-500";
  else if (pct > 60) colorClass = "bg-orange-500";
  else if (pct > 30) colorClass = "bg-yellow-500";

  return (
    <div className="flex items-center gap-1">
      <div className="w-10 h-1.5 bg-slate-800 rounded-full overflow-hidden flex-shrink-0">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-slate-400 font-mono whitespace-nowrap">
        {score}/{maxScore}
      </span>
    </div>
  );
}
