import { ScanStatus, DailyScanResult } from "./types";
import { fetchAllAShares } from "./stock-list";
import { fetchDailyKline } from "./kline";
import { evaluateDailyConditions } from "./conditions";

const BATCH_SIZE = 20;
const BATCH_DELAY = 300;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getCurrentTradingDate(): string {
  const now = new Date();
  // Use Beijing time (UTC+8)
  const beijing = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const day = beijing.getUTCDay();
  // Weekend → use Friday
  if (day === 0) beijing.setUTCDate(beijing.getUTCDate() - 2);
  if (day === 6) beijing.setUTCDate(beijing.getUTCDate() - 1);
  const yyyy = beijing.getUTCFullYear();
  const mm = String(beijing.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(beijing.getUTCDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

// Module-level state
let scanCache: { tradingDate: string; summary: ScanStatus } | null = null;
let activeScan: ScanStatus | null = null;

export function clearScanCache(): void {
  scanCache = null;
  activeScan = null;
}

export function getScanStatus(): ScanStatus | null {
  const today = getCurrentTradingDate();

  // Return active scan if in progress
  if (activeScan && activeScan.status === "scanning") {
    return activeScan;
  }

  // Return valid cache
  if (scanCache && scanCache.tradingDate === today) {
    return scanCache.summary;
  }

  return null;
}

export function getDailyScanResult(code: string): DailyScanResult | undefined {
  if (!scanCache) return undefined;
  return scanCache.summary.results.find((r) => r.stockCode === code);
}

async function scanSingleStock(
  code: string,
  name: string
): Promise<DailyScanResult> {
  try {
    const bars = await fetchDailyKline(code);
    if (bars.length < 6) {
      return {
        stockCode: code,
        stockName: name,
        conditions: [],
        dailyScore: 0,
        error: "历史数据不足",
      };
    }
    const { conditions, dailyScore } = evaluateDailyConditions(bars);
    return { stockCode: code, stockName: name, conditions, dailyScore };
  } catch (err) {
    return {
      stockCode: code,
      stockName: name,
      conditions: [],
      dailyScore: 0,
      error: err instanceof Error ? err.message : "未知错误",
    };
  }
}

export async function startDailyScan(): Promise<ScanStatus> {
  // Already scanning? Return current state
  if (activeScan && activeScan.status === "scanning") {
    return activeScan;
  }

  // Valid cache? Return it
  const today = getCurrentTradingDate();
  if (scanCache && scanCache.tradingDate === today) {
    return scanCache.summary;
  }

  // Initialize scan
  activeScan = {
    status: "scanning",
    progress: 0,
    total: 0,
    results: [],
    tradingDate: today,
    startedAt: Date.now(),
  };

  // Run scan in background (don't await)
  runScan(today).catch((err) => {
    if (activeScan) {
      activeScan.status = "error";
      activeScan.errorMessage =
        err instanceof Error ? err.message : "扫描失败";
    }
  });

  return activeScan;
}

async function runScan(tradingDate: string): Promise<void> {
  const stocks = await fetchAllAShares();
  if (!activeScan) return;
  activeScan.total = stocks.length;

  const allResults: DailyScanResult[] = [];

  for (let i = 0; i < stocks.length; i += BATCH_SIZE) {
    const batch = stocks.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.allSettled(
      batch.map((s) => scanSingleStock(s.code, s.name))
    );

    for (const result of batchResults) {
      if (result.status === "fulfilled") {
        allResults.push(result.value);
      }
    }

    if (activeScan) {
      activeScan.progress = Math.min(i + BATCH_SIZE, stocks.length);
      activeScan.results = [...allResults].sort(
        (a, b) => b.dailyScore - a.dailyScore
      );
    }

    // Delay between batches
    if (i + BATCH_SIZE < stocks.length) {
      await sleep(BATCH_DELAY);
    }
  }

  // Sort final results
  allResults.sort((a, b) => b.dailyScore - a.dailyScore);

  const summary: ScanStatus = {
    status: "done",
    progress: stocks.length,
    total: stocks.length,
    results: allResults,
    tradingDate,
    startedAt: activeScan?.startedAt,
    completedAt: Date.now(),
  };

  // Store in cache
  scanCache = { tradingDate, summary };
  activeScan = null;
}
