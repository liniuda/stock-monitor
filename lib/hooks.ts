"use client";

import useSWR from "swr";
import { MarketIndex, Sector, Stock, ApiResponse } from "./types";
import { ScanStatus, IntradayResult } from "./recommend/types";
import { Portfolio, TradeRecord, DailySnapshot } from "./simulation/types";
import { isMarketOpen } from "./market-hours";
import { useCallback } from "react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useMarketData() {
  const open = isMarketOpen();
  return useSWR<ApiResponse<MarketIndex[]>>("/api/market", fetcher, {
    refreshInterval: open ? 5000 : 0,
    refreshWhenHidden: false,
    revalidateOnFocus: true,
    dedupingInterval: 3000,
  });
}

export function useSectors(type: "industry" | "concept" = "industry") {
  const open = isMarketOpen();
  return useSWR<ApiResponse<{ list: Sector[]; total: number }>>(
    `/api/sectors?type=${type}`,
    fetcher,
    {
      refreshInterval: open ? 10000 : 0,
      refreshWhenHidden: false,
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  );
}

export function useSectorStocks(code: string | null, page: number = 1) {
  const open = isMarketOpen();
  return useSWR<ApiResponse<{ list: Stock[]; total: number }>>(
    code ? `/api/sector-stocks?code=${code}&page=${page}&pageSize=50` : null,
    fetcher,
    {
      refreshInterval: open ? 8000 : 0,
      refreshWhenHidden: false,
      revalidateOnFocus: true,
      dedupingInterval: 4000,
    }
  );
}

export function useRecommendScan() {
  const { data, error, isLoading, mutate } = useSWR<
    ApiResponse<ScanStatus>
  >("/api/recommend/scan", fetcher, {
    refreshInterval: (latestData) => {
      const status = latestData?.data?.status;
      if (status === "scanning") return 3000;
      return 0;
    },
    refreshWhenHidden: false,
    revalidateOnFocus: false,
    dedupingInterval: 2000,
  });

  const startScan = useCallback(async () => {
    await fetch("/api/recommend/scan?action=start");
    mutate();
  }, [mutate]);

  return {
    summary: data?.data ?? null,
    isLoading,
    error,
    startScan,
    mutate,
  };
}

export function useIntradayCheck(codes: string[]) {
  const open = isMarketOpen();
  const key =
    codes.length > 0
      ? `/api/recommend/intraday?codes=${codes.join(",")}`
      : null;

  return useSWR<ApiResponse<IntradayResult[]>>(
    open ? key : null,
    fetcher,
    {
      refreshInterval: open ? 30000 : 0,
      refreshWhenHidden: false,
      revalidateOnFocus: true,
      dedupingInterval: 10000,
    }
  );
}

// ============ Simulation Hooks ============

export function usePortfolio() {
  const open = isMarketOpen();
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<Portfolio>>(
    "/api/simulation/portfolio",
    fetcher,
    {
      refreshInterval: open ? 30000 : 0,
      refreshWhenHidden: false,
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  );

  return {
    portfolio: data?.data ?? null,
    isLoading,
    error,
    mutate,
  };
}

export function useTradeHistory(limit: number = 50) {
  return useSWR<ApiResponse<TradeRecord[]>>(
    `/api/simulation/history?type=trades&limit=${limit}`,
    fetcher,
    { revalidateOnFocus: false }
  );
}

export function useSnapshots() {
  return useSWR<ApiResponse<DailySnapshot[]>>(
    "/api/simulation/history?type=snapshots",
    fetcher,
    { revalidateOnFocus: false }
  );
}
