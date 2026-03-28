"use client";

import { useState } from "react";
import { useSectors } from "@/lib/hooks";
import SectorCard from "./SectorCard";
import { Sector } from "@/lib/types";

type SortKey = "changePercent" | "amount" | "leadingStockChange";
type TabKey = "concept" | "industry";

const INITIAL_COUNT = 10;

export default function SectorGrid() {
  const [activeTab, setActiveTab] = useState<TabKey>("concept");
  const [sortKey, setSortKey] = useState<SortKey>("changePercent");
  const [sortDesc, setSortDesc] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const { data, error, isLoading } = useSectors(activeTab);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDesc(!sortDesc);
    } else {
      setSortKey(key);
      setSortDesc(true);
    }
  }

  function handleTabChange(tab: TabKey) {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setExpanded(false);
  }

  const tabs: { key: TabKey; label: string }[] = [
    { key: "concept", label: "概念板块" },
    { key: "industry", label: "行业板块" },
  ];

  const sortButtons: { key: SortKey; label: string }[] = [
    { key: "changePercent", label: "涨幅" },
    { key: "amount", label: "成交额" },
    { key: "leadingStockChange", label: "领涨股涨幅" },
  ];

  const sectors = data?.data?.list ?? [];
  const total = data?.data?.total ?? 0;

  const tabLabel = activeTab === "concept" ? "概念板块" : "行业板块";

  if (isLoading) {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-blue-500/20 text-blue-400"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: INITIAL_COUNT }).map((_, i) => (
            <div
              key={i}
              className="h-[130px] animate-pulse rounded-xl border border-slate-700/50 bg-slate-800/50"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !sectors.length) {
    return (
      <div>
        <div className="mb-4 flex items-center gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-8 text-center text-slate-500">
          {tabLabel}数据加载失败，请稍后刷新
        </div>
      </div>
    );
  }

  const sorted = [...sectors].sort((a: Sector, b: Sector) => {
    const multiplier = sortDesc ? -1 : 1;
    return (a[sortKey] - b[sortKey]) * multiplier;
  });

  const visible = expanded ? sorted : sorted.slice(0, INITIAL_COUNT);
  const hasMore = sorted.length > INITIAL_COUNT;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-blue-500/20 text-blue-400"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-500">
            共 {total} 个
          </span>
        </div>
        <div className="flex gap-1">
          {sortButtons.map((btn) => (
            <button
              key={btn.key}
              onClick={() => handleSort(btn.key)}
              className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                sortKey === btn.key
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {btn.label}
              {sortKey === btn.key && (sortDesc ? " \u2193" : " \u2191")}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {visible.map((sector) => (
          <SectorCard key={sector.code} sector={sector} />
        ))}
      </div>
      {hasMore && (
        <div className="mt-3 text-center">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            {expanded
              ? "收起"
              : `展开全部 ${sorted.length} 个${tabLabel} \u25bc`}
          </button>
        </div>
      )}
    </div>
  );
}
