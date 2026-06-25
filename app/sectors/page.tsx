"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSectorStocks, useSectors } from "@/lib/hooks";
import { formatPercent, formatAmount } from "@/lib/format";
import StockTable from "@/components/StockTable";
import { useState, Suspense } from "react";

function SectorDetailContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code") ?? "";
  const [page, setPage] = useState(1);

  const { data: sectorsData } = useSectors();
  const { data, error, isLoading } = useSectorStocks(code || null, page);

  const sector = sectorsData?.data?.list?.find((s) => s.code === code);

  const stocks = data?.data?.list ?? [];
  const total = data?.data?.total ?? 0;
  const hasMore = stocks.length === 50;

  function getColor(value: number): string {
    if (value > 0) return "text-red-500";
    if (value < 0) return "text-green-500";
    return "text-slate-400";
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回
        </Link>

        {sector ? (
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-white">{sector.name}</h1>
            <span className={`text-lg font-bold ${getColor(sector.changePercent)}`}>
              {formatPercent(sector.changePercent)}
            </span>
            <span className="text-sm text-slate-500">
              成交额 {formatAmount(sector.amount)}
            </span>
          </div>
        ) : (
          <h1 className="text-xl font-bold text-white">板块 {code}</h1>
        )}
      </div>

      {sector && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-3">
            <div className="text-xs text-slate-500">涨跌幅</div>
            <div className={`mt-1 text-lg font-bold ${getColor(sector.changePercent)}`}>
              {formatPercent(sector.changePercent)}
            </div>
          </div>
          <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-3">
            <div className="text-xs text-slate-500">成交额</div>
            <div className="mt-1 text-lg font-bold text-slate-200">
              {formatAmount(sector.amount)}
            </div>
          </div>
          <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-3">
            <div className="text-xs text-slate-500">领涨股</div>
            <div className="mt-1 text-sm font-bold text-slate-200">
              {sector.leadingStock || "--"}
              {sector.leadingStockChange ? (
                <span className={`ml-1 ${getColor(sector.leadingStockChange)}`}>
                  {formatPercent(sector.leadingStockChange)}
                </span>
              ) : null}
            </div>
          </div>
          <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-3">
            <div className="text-xs text-slate-500">成交量</div>
            <div className="mt-1 text-lg font-bold text-slate-200">
              {sector.volume ? (sector.volume / 10000).toFixed(0) + "万手" : "--"}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-700/50 bg-slate-900/50">
        <div className="border-b border-slate-700/50 px-4 py-3">
          <h2 className="text-sm font-medium text-slate-300">个股列表</h2>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-600 border-t-blue-500" />
            <span className="ml-3 text-sm text-slate-500">加载中...</span>
          </div>
        )}

        {error && (
          <div className="py-12 text-center text-slate-500">加载失败，请稍后刷新</div>
        )}

        {stocks.length > 0 && <StockTable stocks={stocks} />}

        {(hasMore || page > 1) && (
          <div className="flex items-center justify-center gap-2 border-t border-slate-700/50 px-4 py-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-md px-3 py-1 text-sm text-slate-400 transition-colors hover:bg-slate-800 disabled:opacity-30"
            >
              上一页
            </button>
            <span className="text-sm text-slate-500">第 {page} 页</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasMore}
              className="rounded-md px-3 py-1 text-sm text-slate-400 transition-colors hover:bg-slate-800 disabled:opacity-30"
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SectorDetailPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-slate-500">加载中...</div>}>
      <SectorDetailContent />
    </Suspense>
  );
}
