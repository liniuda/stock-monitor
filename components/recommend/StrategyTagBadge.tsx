"use client";

import { StrategyTag } from "@/lib/recommend/types";

const TAG_STYLES: Record<StrategyTag, string> = {
  趋势跟踪: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  均值回归: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  动量策略: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  量价异动: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  统计套利: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
};

interface StrategyTagBadgeProps {
  tag: StrategyTag;
}

export default function StrategyTagBadge({ tag }: StrategyTagBadgeProps) {
  const style = TAG_STYLES[tag] ?? "bg-slate-700/50 text-slate-400 border-slate-600/30";

  return (
    <span
      className={`inline-block px-1.5 py-0.5 rounded text-xs border ${style}`}
    >
      {tag}
    </span>
  );
}
