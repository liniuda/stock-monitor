"use client";

import { Stock } from "@/lib/types";
import {
  formatPrice,
  formatPercent,
  formatChange,
  formatAmount,
  formatMarketCap,
} from "@/lib/format";

function getColor(value: number): string {
  if (value > 0) return "text-red-500";
  if (value < 0) return "text-green-500";
  return "text-slate-400";
}

function getRowBg(value: number): string {
  if (value >= 9.9) return "bg-red-500/10";
  if (value <= -9.9) return "bg-green-500/10";
  return "";
}

export default function StockTable({ stocks }: { stocks: Stock[] }) {
  if (!stocks.length) {
    return (
      <div className="py-12 text-center text-slate-500">暂无数据</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700/50 text-xs text-slate-500">
            <th className="whitespace-nowrap px-3 py-2.5 text-left font-medium">
              代码
            </th>
            <th className="whitespace-nowrap px-3 py-2.5 text-left font-medium">
              名称
            </th>
            <th className="whitespace-nowrap px-3 py-2.5 text-right font-medium">
              最新价
            </th>
            <th className="whitespace-nowrap px-3 py-2.5 text-right font-medium">
              涨跌幅
            </th>
            <th className="whitespace-nowrap px-3 py-2.5 text-right font-medium">
              涨跌额
            </th>
            <th className="whitespace-nowrap px-3 py-2.5 text-right font-medium">
              成交额
            </th>
            <th className="hidden whitespace-nowrap px-3 py-2.5 text-right font-medium md:table-cell">
              换手率
            </th>
            <th className="hidden whitespace-nowrap px-3 py-2.5 text-right font-medium md:table-cell">
              振幅
            </th>
            <th className="hidden whitespace-nowrap px-3 py-2.5 text-right font-medium lg:table-cell">
              总市值
            </th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock) => {
            const color = getColor(stock.changePercent);
            const rowBg = getRowBg(stock.changePercent);
            return (
              <tr
                key={stock.code}
                className={`border-b border-slate-800/50 transition-colors hover:bg-slate-800/50 ${rowBg}`}
              >
                <td className="whitespace-nowrap px-3 py-2 font-mono text-slate-400">
                  {stock.code}
                </td>
                <td className="whitespace-nowrap px-3 py-2 font-medium text-slate-200">
                  {stock.name}
                </td>
                <td className={`whitespace-nowrap px-3 py-2 text-right tabular-nums font-medium ${color}`}>
                  {formatPrice(stock.price)}
                </td>
                <td className={`whitespace-nowrap px-3 py-2 text-right tabular-nums font-bold ${color}`}>
                  {formatPercent(stock.changePercent)}
                </td>
                <td className={`whitespace-nowrap px-3 py-2 text-right tabular-nums ${color}`}>
                  {formatChange(stock.change)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-slate-400">
                  {formatAmount(stock.amount)}
                </td>
                <td className="hidden whitespace-nowrap px-3 py-2 text-right tabular-nums text-slate-400 md:table-cell">
                  {stock.turnoverRate ? stock.turnoverRate.toFixed(2) + "%" : "--"}
                </td>
                <td className="hidden whitespace-nowrap px-3 py-2 text-right tabular-nums text-slate-400 md:table-cell">
                  {stock.amplitude ? stock.amplitude.toFixed(2) + "%" : "--"}
                </td>
                <td className="hidden whitespace-nowrap px-3 py-2 text-right tabular-nums text-slate-400 lg:table-cell">
                  {formatMarketCap(stock.totalMarketCap)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
