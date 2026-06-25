"use client";

import Link from "next/link";
import { Sector } from "@/lib/types";
import { formatPercent, formatAmount } from "@/lib/format";
import { deriveSectorTags } from "@/lib/recommend/strategy";
import StrategyTagBadge from "./recommend/StrategyTagBadge";

function getChangeColor(value: number): string {
  if (value > 3) return "text-red-400";
  if (value > 0) return "text-red-500";
  if (value < -3) return "text-green-400";
  if (value < 0) return "text-green-500";
  return "text-slate-400";
}

function getCardBg(value: number): string {
  if (value > 3) return "bg-red-500/10 border-red-500/20";
  if (value > 1) return "bg-red-500/5 border-red-500/10";
  if (value > 0) return "bg-slate-800/50 border-red-500/5";
  if (value < -3) return "bg-green-500/10 border-green-500/20";
  if (value < -1) return "bg-green-500/5 border-green-500/10";
  if (value < 0) return "bg-slate-800/50 border-green-500/5";
  return "bg-slate-800/50 border-slate-700/50";
}

export default function SectorCard({ sector }: { sector: Sector }) {
  const changeColor = getChangeColor(sector.changePercent);
  const cardBg = getCardBg(sector.changePercent);
  const tags = deriveSectorTags(sector);

  return (
    <Link href={`/sectors/?code=${sector.code}`}>
      <div
        className={`group cursor-pointer rounded-xl border p-4 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${cardBg}`}
      >
        <div className="flex items-start justify-between">
          <span className="text-sm font-medium text-slate-200 group-hover:text-white">
            {sector.name}
          </span>
          <span className={`text-lg font-bold tabular-nums ${changeColor}`}>
            {formatPercent(sector.changePercent)}
          </span>
        </div>

        <div className="mt-3 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">成交额</span>
            <span className="tabular-nums text-slate-400">
              {formatAmount(sector.amount)}
            </span>
          </div>

          {sector.leadingStock && (
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">领涨</span>
              <span className="text-slate-300 truncate ml-2">
                {sector.leadingStock}
                {sector.leadingStockChange ? (
                  <span className={`ml-1 ${getChangeColor(sector.leadingStockChange)}`}>
                    {formatPercent(sector.leadingStockChange)}
                  </span>
                ) : null}
              </span>
            </div>
          )}

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {tags.map((tag) => (
                <StrategyTagBadge key={tag} tag={tag} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
