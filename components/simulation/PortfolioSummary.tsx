"use client";

import { Portfolio } from "@/lib/simulation/types";
import { formatAmount, formatPercent } from "@/lib/format";

interface Props {
  portfolio: Portfolio;
  onExecute: () => void;
  onReset: () => void;
  executing: boolean;
}

export default function PortfolioSummary({
  portfolio,
  onExecute,
  onReset,
  executing,
}: Props) {
  const pnlColor =
    portfolio.totalPnl > 0
      ? "text-red-400"
      : portfolio.totalPnl < 0
        ? "text-green-400"
        : "text-slate-400";

  const cards = [
    {
      label: "总资产",
      value: formatAmount(portfolio.totalAssets),
      color: pnlColor,
    },
    {
      label: "累计收益",
      value: formatPercent(portfolio.totalPnlPct * 100),
      sub: formatAmount(portfolio.totalPnl),
      color: pnlColor,
    },
    {
      label: "可用现金",
      value: formatAmount(portfolio.cashBalance),
      color: "text-slate-200",
    },
    {
      label: "持仓市值",
      value: formatAmount(portfolio.totalMarketValue),
      sub: `${portfolio.positions.length} 只`,
      color: "text-slate-200",
    },
  ];

  return (
    <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-white">小牛交易组合</h2>
        <div className="flex gap-2">
          <button
            onClick={onExecute}
            disabled={executing}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white transition-colors"
          >
            {executing ? "执行中..." : "执行交易决策"}
          </button>
          <button
            onClick={() => {
              if (confirm("确认重置？将清空所有持仓和交易记录，恢复100万初始资金。")) {
                onReset();
              }
            }}
            className="px-3 py-1.5 text-xs font-medium rounded-md border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
          >
            重置
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-md bg-slate-800/60 px-3 py-2.5"
          >
            <div className="text-xs text-slate-500 mb-1">{card.label}</div>
            <div className={`text-lg font-bold font-mono ${card.color}`}>
              {card.value}
            </div>
            {card.sub && (
              <div className={`text-xs font-mono mt-0.5 ${card.color} opacity-70`}>
                {card.sub}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 text-xs text-slate-600">
        更新时间: {portfolio.lastUpdated ? new Date(portfolio.lastUpdated).toLocaleString("zh-CN") : "--"}
        {portfolio.tradingDate && ` | 交易日: ${portfolio.tradingDate}`}
      </div>
    </div>
  );
}
