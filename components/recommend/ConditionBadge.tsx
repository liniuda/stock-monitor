"use client";

import { ConditionResult } from "@/lib/recommend/types";

const SHORT_NAMES: Record<number, string> = {
  1: "MA5",
  2: "MACD",
  3: "量能",
  4: "BOLL",
  5: "RSI",
  6: "盘中量",
  7: "动量",
  8: "KDJ",
  9: "缺口",
  10: "5MA金叉",
  11: "量价涨",
};

interface ConditionBadgeProps {
  condition: ConditionResult;
}

export default function ConditionBadge({ condition }: ConditionBadgeProps) {
  const label = SHORT_NAMES[condition.id] ?? condition.name;

  return (
    <span
      className={`inline-block px-1.5 py-0.5 rounded text-xs cursor-default transition-colors ${
        condition.passed
          ? "bg-red-500/20 text-red-400 border border-red-500/30"
          : "bg-slate-700/50 text-slate-500 border border-slate-600/30"
      }`}
      title={condition.detail}
    >
      {label}
    </span>
  );
}
