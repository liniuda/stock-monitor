"use client";

import { useState } from "react";
import { TradeRecord } from "@/lib/simulation/types";
import { formatPrice } from "@/lib/format";

interface Props {
  trades: TradeRecord[];
}

const SELL_REASON_LABEL: Record<string, { text: string; cls: string }> = {
  take_profit: { text: "止盈", cls: "bg-green-500/20 text-green-400" },
  stop_loss: { text: "止损", cls: "bg-red-500/20 text-red-400" },
  score_drop: { text: "排名跌出", cls: "bg-slate-600/50 text-slate-400" },
};

const PAGE_SIZE = 20;

export default function TradeLog({ trades }: Props) {
  const [filter, setFilter] = useState<"all" | "buy" | "sell">("all");
  const [page, setPage] = useState(0);

  const filtered =
    filter === "all" ? trades : trades.filter((t) => t.action === filter);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const filters: { key: "all" | "buy" | "sell"; label: string }[] = [
    { key: "all", label: "全部" },
    { key: "buy", label: "买入" },
    { key: "sell", label: "卖出" },
  ];

  return (
    <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold text-white">交易记录</h2>
        <div className="flex gap-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => {
                setFilter(f.key);
                setPage(0);
              }}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                filter === f.key
                  ? "bg-blue-600/30 text-blue-400"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {paged.length === 0 ? (
        <div className="text-center py-6 text-slate-500 text-sm">
          暂无交易记录
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-700/50">
                  <th className="text-left py-2 px-1 font-medium">日期</th>
                  <th className="text-left py-2 px-1 font-medium">股票</th>
                  <th className="text-center py-2 px-1 font-medium">方向</th>
                  <th className="text-right py-2 px-1 font-medium">价格</th>
                  <th className="text-right py-2 px-1 font-medium">数量</th>
                  <th className="text-right py-2 px-1 font-medium">金额</th>
                  <th className="text-right py-2 px-1 font-medium hidden md:table-cell">佣金</th>
                  <th className="text-center py-2 px-1 font-medium">原因</th>
                  <th className="text-right py-2 px-1 font-medium">盈亏</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((t) => {
                  const isBuy = t.action === "buy";
                  const rowBg = isBuy
                    ? "bg-blue-500/5"
                    : (t.realizedPnl ?? 0) >= 0
                      ? "bg-green-500/5"
                      : "bg-red-500/5";
                  const reasonInfo = t.sellReason
                    ? SELL_REASON_LABEL[t.sellReason]
                    : null;

                  return (
                    <tr
                      key={t.id}
                      className={`border-b border-slate-800/30 ${rowBg}`}
                    >
                      <td className="py-2 px-1 text-slate-400 font-mono">
                        {t.date}
                      </td>
                      <td className="py-2 px-1">
                        <span className="text-slate-400 font-mono">
                          {t.stockCode}
                        </span>{" "}
                        <span className="text-slate-300">{t.stockName}</span>
                      </td>
                      <td className="text-center py-2 px-1">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] ${
                            isBuy
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-amber-500/20 text-amber-400"
                          }`}
                        >
                          {isBuy ? "买入" : "卖出"}
                        </span>
                      </td>
                      <td className="text-right py-2 px-1 font-mono text-slate-300">
                        {formatPrice(t.price)}
                      </td>
                      <td className="text-right py-2 px-1 font-mono text-slate-300">
                        {t.shares}
                      </td>
                      <td className="text-right py-2 px-1 font-mono text-slate-300">
                        {t.amount.toFixed(0)}
                      </td>
                      <td className="text-right py-2 px-1 font-mono text-slate-500 hidden md:table-cell">
                        {t.commission.toFixed(0)}
                      </td>
                      <td className="text-center py-2 px-1">
                        {reasonInfo && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] ${reasonInfo.cls}`}
                          >
                            {reasonInfo.text}
                          </span>
                        )}
                      </td>
                      <td
                        className={`text-right py-2 px-1 font-mono ${
                          t.realizedPnl != null
                            ? t.realizedPnl >= 0
                              ? "text-red-400"
                              : "text-green-400"
                            : "text-slate-600"
                        }`}
                      >
                        {t.realizedPnl != null
                          ? `${t.realizedPnl >= 0 ? "+" : ""}${t.realizedPnl.toFixed(0)}`
                          : "--"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-3">
              <button
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className="px-2 py-1 text-xs text-slate-400 disabled:text-slate-600 hover:text-white transition-colors"
              >
                上一页
              </button>
              <span className="px-2 py-1 text-xs text-slate-500">
                {page + 1} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(page + 1)}
                className="px-2 py-1 text-xs text-slate-400 disabled:text-slate-600 hover:text-white transition-colors"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
