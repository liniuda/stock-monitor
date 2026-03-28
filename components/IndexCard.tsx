"use client";

import { MarketIndex } from "@/lib/types";
import { formatPrice, formatPercent, formatChange, formatAmount } from "@/lib/format";

function getColor(value: number): string {
  if (value > 0) return "text-red-500";
  if (value < 0) return "text-green-500";
  return "text-slate-400";
}

function getBgGlow(value: number): string {
  if (value > 0) return "shadow-red-500/5";
  if (value < 0) return "shadow-green-500/5";
  return "";
}

export default function IndexCard({ index }: { index: MarketIndex }) {
  const color = getColor(index.changePercent);
  const glow = getBgGlow(index.changePercent);

  return (
    <div
      className={`rounded-xl border border-slate-700/50 bg-slate-800/50 p-4 shadow-lg ${glow} transition-all duration-300`}
    >
      <div className="mb-2 text-sm text-slate-400">{index.name}</div>
      <div className={`text-2xl font-bold tabular-nums ${color}`}>
        {formatPrice(index.price)}
      </div>
      <div className="mt-1 flex items-center gap-3">
        <span className={`text-sm font-medium tabular-nums ${color}`}>
          {formatChange(index.change)}
        </span>
        <span className={`text-sm font-bold tabular-nums ${color}`}>
          {formatPercent(index.changePercent)}
        </span>
      </div>
      <div className="mt-2 flex justify-between text-xs text-slate-500">
        <span>成交 {formatAmount(index.amount)}</span>
        <span>振幅 {index.high && index.low && index.prevClose ? ((index.high - index.low) / index.prevClose * 100).toFixed(2) + "%" : "--"}</span>
      </div>
    </div>
  );
}
