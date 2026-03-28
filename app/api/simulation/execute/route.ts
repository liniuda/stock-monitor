import { NextResponse } from "next/server";
import { getScanStatus } from "@/lib/recommend/scanner";
import { runTradingCycle, takeDailySnapshot } from "@/lib/simulation/engine";
import { fetchCurrentPrices, StockPrice } from "@/lib/simulation/price";
import { readPortfolio } from "@/lib/simulation/storage";
import { AllocationCandidate } from "@/lib/simulation/rules";

export const dynamic = "force-dynamic";

let isExecuting = false;

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

async function executeTrading() {
  // 1. Check scan results
  const scanStatus = getScanStatus();
  if (!scanStatus || scanStatus.status !== "done") {
    return { error: "请先完成每日扫描后再执行交易" };
  }

  // 2. Build top 20 list from scan results
  const top20Results = scanStatus.results
    .filter((r) => r.dailyScore > 0)
    .slice(0, 20);

  if (top20Results.length === 0) {
    return { error: "扫描结果中无符合条件的股票" };
  }

  // 3. Also include codes from existing positions
  const portfolio = await readPortfolio();
  const heldCodes = portfolio
    ? portfolio.positions.map((p) => p.stockCode)
    : [];

  const allCodes = [
    ...new Set([
      ...top20Results.map((r) => r.stockCode),
      ...heldCodes,
    ]),
  ];

  // 4. Fetch current prices (including prevClose for limit detection)
  const stockInfoMap = await fetchCurrentPrices(allCodes);
  const priceMap = new Map<string, number>();
  for (const [code, { price }] of stockInfoMap) {
    priceMap.set(code, price);
  }

  // 5. Build candidate list
  const candidates: AllocationCandidate[] = top20Results
    .filter((r) => priceMap.has(r.stockCode))
    .map((r) => ({
      stockCode: r.stockCode,
      stockName: r.stockName,
      totalScore: r.dailyScore,
      currentPrice: priceMap.get(r.stockCode)!,
    }));

  // 6. Execute trading cycle (with limit-up/down checks)
  const tradingDate = getCurrentTradingDate();
  const result = await runTradingCycle(
    candidates,
    priceMap,
    stockInfoMap,
    tradingDate
  );

  // 7. Take daily snapshot
  await takeDailySnapshot(
    result.portfolio,
    tradingDate,
    result.newTrades.length
  );

  return { data: result };
}

export async function POST() {
  if (isExecuting) {
    return NextResponse.json(
      { error: "交易正在执行中，请稍候", timestamp: Date.now() },
      { status: 409 }
    );
  }

  isExecuting = true;
  try {
    const result = await executeTrading();
    if ("error" in result) {
      return NextResponse.json(
        { error: result.error, timestamp: Date.now() },
        { status: 400 }
      );
    }
    return NextResponse.json({ data: result.data, timestamp: Date.now() });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "执行交易失败",
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  } finally {
    isExecuting = false;
  }
}

/**
 * GET: Auto-execute during market hours if scan is done and not yet executed today.
 * Returns execution result or skip reason.
 */
export async function GET() {
  const tradingDate = getCurrentTradingDate();

  // Check if already executed today
  const portfolio = await readPortfolio();
  if (portfolio && portfolio.tradingDate === tradingDate) {
    return NextResponse.json({
      data: { skipped: true, reason: "今日已执行过交易", tradingDate },
      timestamp: Date.now(),
    });
  }

  // Check scan status
  const scanStatus = getScanStatus();
  if (!scanStatus || scanStatus.status !== "done") {
    return NextResponse.json({
      data: { skipped: true, reason: "扫描未完成", tradingDate },
      timestamp: Date.now(),
    });
  }

  // Auto-execute
  if (isExecuting) {
    return NextResponse.json({
      data: { skipped: true, reason: "正在执行中", tradingDate },
      timestamp: Date.now(),
    });
  }

  isExecuting = true;
  try {
    const result = await executeTrading();
    if ("error" in result) {
      return NextResponse.json({
        data: { skipped: true, reason: result.error, tradingDate },
        timestamp: Date.now(),
      });
    }
    return NextResponse.json({ data: result.data, timestamp: Date.now() });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "自动执行失败",
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  } finally {
    isExecuting = false;
  }
}
