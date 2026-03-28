"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import useSWR from "swr";
import ReviewDiary from "@/components/simulation/ReviewDiary";
import { DailyReview } from "@/lib/simulation/review-types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function getCurrentBeijingTime() {
  const now = new Date();
  const beijing = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return {
    hours: beijing.getUTCHours(),
    minutes: beijing.getUTCMinutes(),
    day: beijing.getUTCDay(),
  };
}

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
  const [selectedDate, setSelectedDate] = useState<string>(
    getCurrentTradingDate()
  );
  const [review, setReview] = useState<DailyReview | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const autoTriggered = useRef(false);

  // Fetch review date list
  const { data: datesData } = useSWR<{ data: string[] }>(
    "/api/simulation/review?action=list",
    fetcher
  );
  const reviewDates = datesData?.data ?? [];

  // Load review for selected date
  const loadReview = useCallback(async (date: string) => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/simulation/review?date=${date}`);
      const json = await res.json();
      if (json.data) {
        setReview(json.data);
      } else {
        setReview(null);
        setMessage(json.message || "该日期无复盘记录");
      }
    } catch {
      setMessage("加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  // Generate review
  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/simulation/review?action=generate&date=${selectedDate}`
      );
      const json = await res.json();
      if (json.data) {
        setReview(json.data);
        setMessage("复盘日记已生成");
      } else {
        setMessage(json.error ?? "生成失败");
      }
    } catch {
      setMessage("生成失败");
    } finally {
      setGenerating(false);
    }
  }, [selectedDate]);

  // Confirm optimization
  const handleConfirmOptimization = useCallback(
    async (optimizationId: string, confirmed: boolean) => {
      try {
        const res = await fetch("/api/simulation/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "confirm",
            date: selectedDate,
            optimizationId,
            confirmed,
          }),
        });
        const json = await res.json();
        if (json.data) {
          setReview(json.data);
        }
      } catch {
        // ignore
      }
    },
    [selectedDate]
  );

  // Load on date change
  useEffect(() => {
    loadReview(selectedDate);
  }, [selectedDate, loadReview]);

  // Auto-trigger at 15:00 Beijing time on weekdays
  useEffect(() => {
    const check = () => {
      const { hours, minutes, day } = getCurrentBeijingTime();
      const isWeekday = day >= 1 && day <= 5;
      const isAfter3 = hours >= 15;
      const todayDate = getCurrentTradingDate();

      if (
        isWeekday &&
        isAfter3 &&
        !autoTriggered.current &&
        selectedDate === todayDate &&
        !review
      ) {
        autoTriggered.current = true;
        handleGenerate();
      }
    };

    check();
    const timer = setInterval(check, 30000); // check every 30s
    return () => clearInterval(timer);
  }, [selectedDate, review, handleGenerate]);

  return (
    <div className="space-y-4">
      {/* Date selector + generate button */}
      <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-white">复盘日记</h2>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-800 border border-slate-600 rounded-md px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              {/* Current trading date always shown */}
              {!reviewDates.includes(getCurrentTradingDate()) && (
                <option value={getCurrentTradingDate()}>
                  {getCurrentTradingDate()} (今日)
                </option>
              )}
              {reviewDates.map((d) => (
                <option key={d} value={d}>
                  {d}
                  {d === getCurrentTradingDate() ? " (今日)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-600">
              每日15:00自动生成
            </span>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-amber-600 hover:bg-amber-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white transition-colors"
            >
              {generating ? "生成中..." : "生成/刷新复盘"}
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

      {/* Loading */}
      {loading && (
        <div className="text-center py-8 text-slate-500 text-sm">
          加载中...
        </div>
      )}

      {/* Review content */}
      {!loading && review && (
        <ReviewDiary
          review={review}
          onConfirmOptimization={handleConfirmOptimization}
        />
      )}

      {/* No review */}
      {!loading && !review && !message && (
        <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-8 text-center">
          <p className="text-slate-500 text-sm mb-3">
            该日期暂无复盘记录
          </p>
          <p className="text-slate-600 text-xs">
            复盘将在每日下午3点收盘后自动生成，或点击上方按钮手动生成
          </p>
        </div>
      )}
    </div>
  );
}
