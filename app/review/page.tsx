"use client";

import { useState, useCallback } from "react";
import ReviewDiary from "@/components/simulation/ReviewDiary";
import { DailyReview } from "@/lib/simulation/review-types";
import review20260306 from "../../data/simulation/reviews/20260306.json";
import review20260625 from "../../data/simulation/reviews/20260625.json";

const staticReviews: Record<string, DailyReview> = {
  "20260306": review20260306 as unknown as DailyReview,
  "20260625": review20260625 as unknown as DailyReview,
};

function getCurrentTradingDate(): string {
  const now = new Date();
  const beijing = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const day = beijing.getUTCDay();
  if (day === 0) beijing.setUTCDate(beijing.getUTCDate() - 2);
  if (day === 6) beijing.setUTCDate(beijing.getUTCDate() - 1);
  const yyyy = beijing.getUTCFullYear();
  const mm = String(beijing.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(beijing.getUTCDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

export default function ReviewPage() {
  const reviewDates = Object.keys(staticReviews).sort().reverse();
  const [selectedDate, setSelectedDate] = useState<string>(
    reviewDates[0] ?? getCurrentTradingDate()
  );
  const [message, setMessage] = useState<string | null>(null);

  const review = staticReviews[selectedDate] ?? null;

  const handleGenerate = useCallback(() => {
    setMessage("静态部署模式：复盘数据为构建时快照，无法实时生成");
  }, []);

  const handleConfirmOptimization = useCallback(
    (_optimizationId: string, _confirmed: boolean) => {
      setMessage("静态部署模式：无法修改配置");
    },
    []
  );

  return (
    <div className="space-y-4">
      {/* Date selector + generate button */}
      <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-white">复盘日记</h2>
            <select
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setMessage(null);
              }}
              className="bg-slate-800 border border-slate-600 rounded-md px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              {reviewDates.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-600">
              静态部署模式
            </span>
            <button
              onClick={handleGenerate}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-amber-600 hover:bg-amber-500 text-white transition-colors"
            >
              生成/刷新复盘
            </button>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className="rounded-md bg-slate-800/80 border border-slate-700/50 px-4 py-2 text-sm text-amber-300">
          {message}
        </div>
      )}

      {/* Review content */}
      {review && (
        <ReviewDiary
          review={review}
          onConfirmOptimization={handleConfirmOptimization}
        />
      )}

      {/* No review */}
      {!review && !message && (
        <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-8 text-center">
          <p className="text-slate-500 text-sm mb-3">
            该日期暂无复盘记录
          </p>
          <p className="text-slate-600 text-xs">
            复盘数据为构建时快照，如需最新数据请在本地运行系统
          </p>
        </div>
      )}
    </div>
  );
}
