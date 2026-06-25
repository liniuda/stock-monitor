"use client";

import useSWR from "swr";
import { MarketIndex, Sector, Stock, ApiResponse } from "./types";
import { ScanStatus, IntradayResult } from "./recommend/types";
import { Portfolio, TradeRecord, DailySnapshot } from "./simulation/types";
import { isMarketOpen } from "./market-hours";
import { useCallback } from "react";
import {
  fetchMarketIndicesClient,
  fetchSectorsClient,
  fetchSectorStocksClient,
} from "./client-fetch";

// Static JSON data (bundled at build time for GitHub Pages)
import staticPortfolio from "../data/simulation/portfolio.json";
import staticTrades from "../data/simulation/trades.json";
import staticConfig from "../data/simulation/config.json";

// ============ Market Data (client-side JSONP) ============

export function useMarketData() {
  const open = isMarketOpen();
  const { data, error, isLoading, mutate } = useSWR<MarketIndex[]>(
    "market-indices",
    () => fetchMarketIndicesClient(),
    {
      refreshInterval: open ? 5000 : 0,
      refreshWhenHidden: false,
      revalidateOnFocus: true,
      dedupingInterval: 3000,
    }
  );

  return {
    data: data ? { data, timestamp: Date.now() } : null,
    error,
    isLoading,
    mutate,
  };
}

export function useSectors(type: "industry" | "concept" = "industry") {
  const open = isMarketOpen();
  const { data, error, isLoading, mutate } = useSWR<{ list: Sector[]; total: number }>(
    `sectors-${type}`,
    () => fetchSectorsClient(1),
    {
      refreshInterval: open ? 10000 : 0,
      refreshWhenHidden: false,
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  );

  return {
    data: data ? { data, timestamp: Date.now() } : null,
    error,
    isLoading,
    mutate,
  };
}

export function useSectorStocks(code: string | null, page: number = 1) {
  const open = isMarketOpen();
  const { data, error, isLoading, mutate } = useSWR<{ list: Stock[]; total: number }>(
    code ? `sector-stocks-${code}-${page}` : null,
    () => fetchSectorStocksClient(code!, page, 50),
    {
      refreshInterval: open ? 8000 : 0,
      refreshWhenHidden: false,
      revalidateOnFocus: true,
      dedupingInterval: 4000,
    }
  );

  return {
    data: data ? { data, timestamp: Date.now() } : null,
    error,
    isLoading,
    mutate,
  };
}

// ============ Recommend (static: no server scan) ============

export function useRecommendScan() {
  const summary = null as ScanStatus | null;

  const startScan = useCallback(async () => {
    // No server-side scanning in static mode
  }, []);

  return {
    summary,
    isLoading: false,
    error: null,
    startScan,
    mutate: () => {},
  };
}

export function useIntradayCheck(_codes: string[]) {
  return {
    data: null as ApiResponse<IntradayResult[]> | null,
    error: null,
    isLoading: false,
  };
}

// ============ Simulation (static JSON) ============

export function usePortfolio() {
  const portfolio = staticPortfolio as unknown as Portfolio;
  return {
    portfolio,
    isLoading: false,
    error: null,
    mutate: () => {},
  };
}

export function useTradeHistory(_limit: number = 50) {
  const trades = (staticTrades as unknown as TradeRecord[]).slice(0, _limit);
  return {
    data: { data: trades, timestamp: Date.now() } as ApiResponse<TradeRecord[]>,
    error: null,
    isLoading: false,
    mutate: () => {},
  };
}

export function useSnapshots() {
  // Static: return empty snapshots (no file system access in browser)
  return {
    data: { data: [] as DailySnapshot[], timestamp: Date.now() } as ApiResponse<DailySnapshot[]>,
    error: null,
    isLoading: false,
    mutate: () => {},
  };
}

// ============ Strategy Config (static JSON) ============

export function useStrategyConfig() {
  return {
    config: staticConfig,
    isLoading: false,
    error: null,
    mutate: () => {},
  };
}
