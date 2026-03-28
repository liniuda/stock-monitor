"use client";

import { Position } from "@/lib/simulation/types";
import { formatPrice, formatPercent } from "@/lib/format";

interface Props {
  positions: Position[];
  tradingDate: string;
}

export default function PositionTable({ positions, tradingDate }: Props) {
  if (positions.length === 0) {
    return (
      <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-4">
        <h2 className="text-base font-bold text-white mb-3">当前持仓</h2>
        <div className="text-center py-6 text-slate-500 text-sm">
          暂无持仓
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-4">
      <h2 className="text-base font-bold text-white mb-3">
        当前持仓
        <span className="text-xs text-slate-500 font-normal ml-2">
          共 {positions.length} 只
        </span>
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-slate-500 border-b border-slate-700/50">
              <th className="text-left py-2 px-1 font-medium">股票</th>
              <th className="text-right py-2 px-1 font-medium">持股</th>
              <th className="text-right py-2 px-1 font-medium">成本</th>
              <th className="text-right py-2 px-1 font-medium">现价</th>
              <th className="text-right py-2 px-1 font-medium">盈亏%</th>
              <th className="text-right py-2 px-1 font-medium">盈亏额</th>
              <th className="text-right py-2 px-1 font-medium hidden md:table-cell">止损</th>
              <th className="text-right py-2 px-1 font-medium hidden md:table-cell">止盈</th>
              <th className="text-right py-2 px-1 font-medium hidden lg:table-cell">买入日</th>
              <th className="text-center py-2 px-1 font-medium">状态</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((pos) => {
              const pnlColor =
                pos.unrealizedPnlPct > 0
                  ? "text-red-400"
                  : pos.unrealizedPnlPct < 0
                    ? "text-green-400"
                    : "text-slate-400";

              const distToStop =
                pos.currentPrice > 0
                  ? (pos.currentPrice - pos.stopLossPrice) / pos.currentPrice
                  : 1;
              const distToProfit =
                pos.currentPrice > 0
                  ? (pos.takeProfitPrice - pos.currentPrice) / pos.currentPrice
                  : 1;
              const isT1 = pos.buyDate === tradingDate;

              let badge = null;
              if (isT1) {
                badge = (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-600/50 text-slate-400">
                    T+1
                  </span>
                );
              } else if (distToStop < 0.02) {
                badge = (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-orange-500/20 text-orange-400">
                    近止损
                  </span>
                );
              } else if (distToProfit < 0.02) {
                badge = (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-green-500/20 text-green-400">
                    近止盈
                  </span>
                );
              }

              return (
                <tr
                  key={pos.stockCode}
                  className="border-b border-slate-800/30 hover:bg-slate-800/30"
                >
                  <td className="py-2 px-1">
                    <div className="text-slate-400 font-mono">
                      {pos.stockCode}
                    </div>
                    <div className="text-slate-200">{pos.stockName}</div>
                  </td>
                  <td className="text-right py-2 px-1 font-mono text-slate-300">
                    {pos.shares}
                  </td>
                  <td className="text-right py-2 px-1 font-mono text-slate-400">
                    {formatPrice(pos.avgCost)}
                  </td>
                  <td className="text-right py-2 px-1 font-mono text-slate-200">
                    {formatPrice(pos.currentPrice)}
                  </td>
                  <td className={`text-right py-2 px-1 font-mono ${pnlColor}`}>
                    {formatPercent(pos.unrealizedPnlPct * 100)}
                  </td>
                  <td className={`text-right py-2 px-1 font-mono ${pnlColor}`}>
                    {pos.unrealizedPnl >= 0 ? "+" : ""}
                    {pos.unrealizedPnl.toFixed(0)}
                  </td>
                  <td className="text-right py-2 px-1 font-mono text-orange-400/60 hidden md:table-cell">
                    {formatPrice(pos.stopLossPrice)}
                  </td>
                  <td className="text-right py-2 px-1 font-mono text-green-400/60 hidden md:table-cell">
                    {formatPrice(pos.takeProfitPrice)}
                  </td>
                  <td className="text-right py-2 px-1 text-slate-500 hidden lg:table-cell">
                    {pos.buyDate}
                  </td>
                  <td className="text-center py-2 px-1">{badge}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
