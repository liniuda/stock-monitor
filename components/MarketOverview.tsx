"use client";

import { useMarketData } from "@/lib/hooks";
import IndexCard from "./IndexCard";

export default function MarketOverview() {
  const { data, error, isLoading } = useMarketData();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-[120px] animate-pulse rounded-xl border border-slate-700/50 bg-slate-800/50"
          />
        ))}
      </div>
    );
  }

  if (error || !data?.data?.length) {
    return (
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-6 text-center text-slate-500">
        大盘数据加载失败
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {data.data.map((index) => (
        <IndexCard key={index.code} index={index} />
      ))}
    </div>
  );
}
