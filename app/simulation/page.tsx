"use client";

import { useState, useCallback } from "react";
import { usePortfolio, useTradeHistory, useSnapshots } from "@/lib/hooks";
import PortfolioSummary from "@/components/simulation/PortfolioSummary";
import PositionTable from "@/components/simulation/PositionTable";
import PerformanceChart from "@/components/simulation/PerformanceChart";
import TradeLog from "@/components/simulation/TradeLog";
import { ExecutionResult } from "@/lib/simulation/types";

export default function SimulationPage() {
  const { portfolio, isLoading, mutate: mutatePortfolio } = usePortfolio();
  const { data: tradesData, mutate: mutateTrades } = useTradeHistory(100);
  const { data: snapshotsData, mutate: mutateSnapshots } = useSnapshots();
  const [executing, setExecuting] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  const handleExecute = useCallback(async () => {
    setExecuting(true);
    setLastMessage("静态部署模式：交易执行功能需要在本地运行系统");
    setExecuting(false);
  }, []);

  const handleReset = useCallback(async () => {
    setLastMessage("静态部署模式：重置功能需要在本地运行系统");
  }, []);

  if (isLoading || !portfolio) {
    return (
      <div className="text-center py-12 text-slate-500">
        加载组合数据中...
      </div>
    );
  }

  const trades = tradesData?.data ?? [];
  const snapshots = snapshotsData?.data ?? [];

  return (
    <div className="space-y-4">
      {lastMessage && (
        <div className="rounded-md bg-slate-800/80 border border-slate-700/50 px-4 py-2 text-sm text-amber-300">
          {lastMessage}
        </div>
      )}
      <PortfolioSummary
        portfolio={portfolio}
        onExecute={handleExecute}
        onReset={handleReset}
        executing={executing}
      />
      <PositionTable
        positions={portfolio.positions}
        tradingDate={portfolio.tradingDate}
      />
      <PerformanceChart snapshots={snapshots} />
      <TradeLog trades={trades} />
    </div>
  );
}
