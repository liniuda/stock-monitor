"use client";

import { useState, useCallback } from "react";
import {
  DailyReview,
  TradeReview,
  StrategyOptimization,
} from "@/lib/simulation/review-types";
import { formatPrice } from "@/lib/format";

interface Props {
  review: DailyReview;
  onConfirmOptimization: (
    optimizationId: string,
    confirmed: boolean
  ) => void;
}

const RATING_STYLE: Record<string, { label: string; cls: string }> = {
  good: { label: "合理", cls: "bg-green-500/20 text-green-400" },
  neutral: { label: "一般", cls: "bg-yellow-500/20 text-yellow-400" },
  bad: { label: "待改进", cls: "bg-red-500/20 text-red-400" },
};

function TradeReviewCard({ item }: { item: TradeReview }) {
  const rating = RATING_STYLE[item.rating] ?? RATING_STYLE.neutral;
  const isBuy = item.action === "buy";

  return (
    <div className="rounded-md bg-slate-800/40 p-3 border border-slate-700/30">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] ${
              isBuy
                ? "bg-blue-500/20 text-blue-400"
                : "bg-amber-500/20 text-amber-400"
            }`}
          >
            {isBuy ? "买入" : "卖出"}
          </span>
          <span className="text-slate-400 font-mono text-xs">
            {item.stockCode}
          </span>
          <span className="text-slate-200 text-sm">{item.stockName}</span>
          <span className="text-slate-500 text-xs font-mono">
            {formatPrice(item.price)} x {item.shares}
          </span>
        </div>
        <span className={`px-2 py-0.5 rounded text-xs ${rating.cls}`}>
          {rating.label}
        </span>
      </div>
      <p className="text-xs text-slate-400 leading-relaxed">{item.reason}</p>
    </div>
  );
}

function OptimizationCard({
  opt,
  onConfirm,
}: {
  opt: StrategyOptimization;
  onConfirm: (id: string, confirmed: boolean) => void;
}) {
  return (
    <div className="rounded-md bg-slate-800/40 p-3 border border-amber-500/20">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1">
          <h4 className="text-sm font-medium text-amber-300">{opt.title}</h4>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            {opt.description}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-3 text-xs">
          <span className="text-slate-500">
            当前: <span className="text-slate-300">{opt.currentValue}</span>
          </span>
          <span className="text-slate-600">→</span>
          <span className="text-slate-500">
            建议: <span className="text-amber-300">{opt.suggestedValue}</span>
          </span>
        </div>
        <div className="flex gap-2">
          {opt.confirmed === null ? (
            <>
              <button
                onClick={() => onConfirm(opt.id, true)}
                className="px-3 py-1 text-xs rounded-md bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-500/30 transition-colors"
              >
                采纳优化
              </button>
              <button
                onClick={() => onConfirm(opt.id, false)}
                className="px-3 py-1 text-xs rounded-md bg-slate-600/20 text-slate-400 hover:bg-slate-600/30 border border-slate-500/30 transition-colors"
              >
                暂不优化
              </button>
            </>
          ) : opt.confirmed ? (
            <span className="px-3 py-1 text-xs rounded-md bg-green-500/10 text-green-400 border border-green-500/20">
              已采纳
            </span>
          ) : (
            <span className="px-3 py-1 text-xs rounded-md bg-slate-600/10 text-slate-500 border border-slate-600/20">
              已跳过
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ReviewDiary({ review, onConfirmOptimization }: Props) {
  const trendColor =
    review.market.marketTrend === "strong"
      ? "text-red-400"
      : review.market.marketTrend === "weak"
        ? "text-green-400"
        : "text-slate-400";

  const trendLabel =
    review.market.marketTrend === "strong"
      ? "偏强"
      : review.market.marketTrend === "weak"
        ? "偏弱"
        : "震荡";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-white">
            {review.date.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3")} 复盘日记
          </h2>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-500">
              交易{review.totalTrades}笔
            </span>
            <span
              className={
                review.realizedPnl >= 0 ? "text-red-400" : "text-green-400"
              }
            >
              已实现盈亏:{" "}
              {review.realizedPnl >= 0 ? "+" : ""}
              {review.realizedPnl.toFixed(0)}
            </span>
            <span
              className={
                review.cumulativeReturn >= 0
                  ? "text-red-400"
                  : "text-green-400"
              }
            >
              累计: {(review.cumulativeReturn * 100).toFixed(2)}%
            </span>
          </div>
        </div>
        {/* Market Context */}
        <div className="rounded-md bg-slate-800/40 p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-slate-500">大盘:</span>
            <span className={`text-xs font-medium ${trendColor}`}>
              {trendLabel}
            </span>
            <span className="text-xs text-slate-600">|</span>
            <span
              className={`text-xs font-mono ${review.market.shIndex >= 0 ? "text-red-400" : "text-green-400"}`}
            >
              沪{review.market.shIndex >= 0 ? "+" : ""}
              {review.market.shIndex.toFixed(2)}%
            </span>
            <span
              className={`text-xs font-mono ${review.market.szIndex >= 0 ? "text-red-400" : "text-green-400"}`}
            >
              深{review.market.szIndex >= 0 ? "+" : ""}
              {review.market.szIndex.toFixed(2)}%
            </span>
            <span
              className={`text-xs font-mono ${review.market.cyIndex >= 0 ? "text-red-400" : "text-green-400"}`}
            >
              创{review.market.cyIndex >= 0 ? "+" : ""}
              {review.market.cyIndex.toFixed(2)}%
            </span>
          </div>
          <p className="text-xs text-slate-400">{review.market.summary}</p>
        </div>
      </div>

      {/* Trade Reviews */}
      <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-4">
        <h3 className="text-sm font-bold text-white mb-3">
          交易复盘
          {review.tradeReviews.length === 0 && (
            <span className="text-xs text-slate-500 font-normal ml-2">
              今日无交易
            </span>
          )}
        </h3>
        {review.tradeReviews.length > 0 ? (
          <div className="space-y-2">
            {review.tradeReviews.map((tr) => (
              <TradeReviewCard key={tr.tradeId} item={tr} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 py-3 text-center">
            今日无交易记录，持仓保持不变
          </p>
        )}
      </div>

      {/* Strategy Summary */}
      <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-4">
        <h3 className="text-sm font-bold text-white mb-2">策略反思</h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          {review.strategySummary}
        </p>
      </div>

      {/* Optimizations */}
      {review.optimizations.length > 0 && (
        <div className="rounded-lg border border-amber-500/20 bg-slate-900/50 p-4">
          <h3 className="text-sm font-bold text-amber-300 mb-3">
            策略优化建议
            <span className="text-xs text-slate-500 font-normal ml-2">
              {review.optimizations.filter((o) => o.confirmed === null).length}{" "}
              条待确认
            </span>
          </h3>
          <div className="space-y-3">
            {review.optimizations.map((opt) => (
              <OptimizationCard
                key={opt.id}
                opt={opt}
                onConfirm={onConfirmOptimization}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
