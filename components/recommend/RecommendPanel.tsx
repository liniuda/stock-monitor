"use client";

import { useMemo } from "react";
import { useRecommendScan, useIntradayCheck } from "@/lib/hooks";
import ScanProgress from "./ScanProgress";
import RecommendTable from "./RecommendTable";

export default function RecommendPanel() {
  const { summary, isLoading, startScan } = useRecommendScan();

  // Get top stocks with score > 0 for intraday checking
  const intradayCodes = useMemo(() => {
    if (!summary || summary.status !== "done") return [];
    return summary.results
      .filter((r) => r.dailyScore > 0)
      .slice(0, 10)
      .map((r) => r.stockCode);
  }, [summary]);

  const { data: intradayData } = useIntradayCheck(intradayCodes);

  const status = summary?.status ?? "idle";
  const completedTime = summary?.completedAt
    ? new Date(summary.completedAt).toLocaleTimeString("zh-CN")
    : null;

  return (
    <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-slate-100">
            全A股选股推荐
          </h2>
          {completedTime && status === "done" && (
            <span className="text-xs text-slate-500">
              上次扫描: {completedTime}
            </span>
          )}
          {status === "done" && summary && (
            <span className="text-xs text-slate-500">
              ({summary.results.filter((r) => r.dailyScore > 0).length}只符合条件)
            </span>
          )}
        </div>
        <button
          onClick={startScan}
          disabled={status === "scanning"}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            status === "scanning"
              ? "bg-slate-700 text-slate-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
          }`}
        >
          {status === "scanning" ? "扫描中..." : "开始扫描"}
        </button>
      </div>

      {/* Body */}
      <div className="p-4">
        {isLoading && status === "idle" && (
          <div className="text-center py-8 text-slate-500">加载中...</div>
        )}

        {status === "idle" && !isLoading && (
          <div className="text-center py-8 text-slate-500">
            点击「开始扫描」按钮，基于技术指标筛选全A股
          </div>
        )}

        {status === "scanning" && summary && (
          <ScanProgress
            progress={summary.progress}
            total={summary.total}
          />
        )}

        {status === "error" && (
          <div className="text-center py-8 text-red-400">
            扫描失败: {summary?.errorMessage ?? "未知错误"}
            <br />
            <button
              onClick={startScan}
              className="mt-2 text-sm text-blue-400 hover:underline"
            >
              重新扫描
            </button>
          </div>
        )}

        {status === "done" && summary && (
          <RecommendTable
            dailyResults={summary.results}
            intradayResults={intradayData?.data}
          />
        )}

        {/* Partial results while scanning */}
        {status === "scanning" &&
          summary &&
          summary.results.length > 0 && (
            <div className="mt-4">
              <div className="text-xs text-slate-500 mb-2">
                实时结果预览:
              </div>
              <RecommendTable dailyResults={summary.results} />
            </div>
          )}
      </div>
    </div>
  );
}
