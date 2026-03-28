"use client";

import { useState } from "react";
import { DailyScanResult, IntradayResult, StrategyTag } from "@/lib/recommend/types";
import { deriveStockStrategies, buildReasonText } from "@/lib/recommend/strategy";
import ConditionBadge from "./ConditionBadge";
import ScoreBar from "./ScoreBar";
import StrategyTagBadge from "./StrategyTagBadge";

interface RecommendTableProps {
  dailyResults: DailyScanResult[];
  intradayResults?: IntradayResult[];
}

export default function RecommendTable({
  dailyResults,
  intradayResults,
}: RecommendTableProps) {
  const [expandedCode, setExpandedCode] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const INITIAL_COUNT = 10;

  const merged = dailyResults
    .filter((r) => r.dailyScore > 0)
    .map((daily) => {
      const intraday = intradayResults?.find(
        (i) => i.stockCode === daily.stockCode
      );

      let strategyTags: StrategyTag[];
      let reason: string;
      if (intraday?.strategyTags && intraday.strategyTags.length > 0) {
        strategyTags = intraday.strategyTags;
        reason = intraday.reason ?? "";
      } else {
        strategyTags = deriveStockStrategies(daily.conditions);
        reason = buildReasonText(strategyTags, daily.conditions);
      }

      return {
        ...daily,
        intradayScore: intraday?.intradayScore ?? 0,
        intradayConditions: intraday?.conditions ?? [],
        totalScore: daily.dailyScore + (intraday?.intradayScore ?? 0),
        strategyTags,
        reason,
      };
    })
    .sort((a, b) => b.totalScore - a.totalScore);

  const visible = showAll ? merged : merged.slice(0, INITIAL_COUNT);
  const hasMore = merged.length > INITIAL_COUNT;

  if (merged.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        暂无符合条件的推荐股票
      </div>
    );
  }

  return (
    <div>
      {visible.map((item, idx) => {
        const isExpanded = expandedCode === item.stockCode;
        const scorePct = item.totalScore / 100;
        const bgOpacity = Math.round(scorePct * 15);

        return (
          <div
            key={item.stockCode}
            className="cursor-pointer border-b border-slate-800/50 transition-colors hover:bg-slate-800/40"
            style={{
              backgroundColor: `rgba(245, 158, 11, ${bgOpacity / 100})`,
            }}
            onClick={() =>
              setExpandedCode(isExpanded ? null : item.stockCode)
            }
          >
            {/* Line 1: info + reason + scores */}
            <div className="flex items-center px-3 pt-2.5 pb-1 gap-3">
              {/* Left: rank, code, name */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-slate-500 text-xs w-6 text-right flex-shrink-0">
                  {idx + 1}
                </span>
                <span className="font-mono text-slate-400 text-xs">
                  {item.stockCode}
                </span>
                <span className="text-slate-100 text-sm font-medium whitespace-nowrap">
                  {item.stockName}
                </span>
              </div>
              {/* Middle: reason */}
              {item.reason && (
                <div className="flex-1 min-w-0 px-2">
                  <p className="text-amber-300/70 text-xs leading-relaxed break-words line-clamp-2">
                    {item.reason}
                  </p>
                </div>
              )}
              {!item.reason && <div className="flex-1" />}
              {/* Right: scores */}
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 text-xs">日</span>
                  <ScoreBar score={item.dailyScore} maxScore={60} />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 text-xs">中</span>
                  <ScoreBar score={item.intradayScore} maxScore={40} />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 text-xs font-medium">总</span>
                  <ScoreBar score={item.totalScore} maxScore={100} />
                </div>
              </div>
            </div>

            {/* Line 2: condition badges + strategy tags */}
            <div className="flex flex-wrap gap-1 px-3 pb-2">
              {item.conditions.map((c) => (
                <ConditionBadge key={c.id} condition={c} />
              ))}
              {item.intradayConditions.map((c) => (
                <ConditionBadge key={`i${c.id}`} condition={c} />
              ))}
              {item.strategyTags.map((tag) => (
                <StrategyTagBadge key={tag} tag={tag} />
              ))}
            </div>

            {/* Expanded: condition details */}
            {isExpanded && (
              <div className="mx-3 mb-2.5 px-4 py-2.5 text-xs text-slate-400 space-y-1 border-t border-slate-700/30 bg-slate-900/30 rounded">
                <div className="font-medium text-slate-300 mb-1">
                  条件详情:
                </div>
                {[...item.conditions, ...item.intradayConditions].map((c) => (
                  <div key={c.id} className="flex gap-2">
                    <span
                      className={
                        c.passed ? "text-red-400" : "text-slate-500"
                      }
                    >
                      {c.passed ? "+" : "-"}
                    </span>
                    <span className="w-24">{c.name}</span>
                    <span className="font-mono w-12">
                      {c.score}/{c.maxScore}
                    </span>
                    <span className="text-slate-500">{c.detail}</span>
                  </div>
                ))}
                {item.error && (
                  <div className="text-yellow-500 mt-1">{item.error}</div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {hasMore && (
        <div className="text-center py-3 border-t border-slate-800/50">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAll(!showAll);
            }}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            {showAll ? "收起" : `展开全部 ${merged.length} 只 ▼`}
          </button>
        </div>
      )}
    </div>
  );
}
