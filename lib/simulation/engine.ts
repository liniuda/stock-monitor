import {
  Portfolio,
  Position,
  TradeRecord,
  DailySnapshot,
  ExecutionResult,
  SimConfig,
} from "./types";
import {
  readPortfolio,
  writePortfolio,
  appendTrades,
  readSnapshot,
  writeSnapshot,
  listSnapshots,
  initPortfolio,
} from "./storage";
import {
  calcCommission,
  checkSellSignal,
  calcTargetAllocation,
  AllocationCandidate,
} from "./rules";
import { StockPrice, isLimitUp, isLimitDown } from "./price";
import { readConfig } from "./config-storage";
import { fetchMarketIndices } from "../stock-api";

function makeTradeId(date: string, code: string): string {
  return `${date}-${code}-${Date.now()}`;
}

export function updatePortfolioPrices(
  portfolio: Portfolio,
  priceMap: Map<string, number>
): Portfolio {
  let totalMV = 0;
  const updatedPositions = portfolio.positions.map((pos) => {
    const price = priceMap.get(pos.stockCode) ?? pos.currentPrice;
    const mv = pos.shares * price;
    const pnl = mv - pos.shares * pos.avgCost;
    const pnlPct = pos.avgCost > 0 ? pnl / (pos.shares * pos.avgCost) : 0;
    totalMV += mv;
    return {
      ...pos,
      currentPrice: price,
      marketValue: mv,
      unrealizedPnl: pnl,
      unrealizedPnlPct: pnlPct,
    };
  });

  const totalAssets = portfolio.cashBalance + totalMV;
  return {
    ...portfolio,
    positions: updatedPositions,
    totalMarketValue: totalMV,
    totalAssets,
    totalPnl: totalAssets - portfolio.initialCapital,
    totalPnlPct: (totalAssets - portfolio.initialCapital) / portfolio.initialCapital,
    lastUpdated: new Date().toISOString(),
  };
}

export async function runTradingCycle(
  top20: AllocationCandidate[],
  priceMap: Map<string, number>,
  stockInfoMap: Map<string, StockPrice>,
  tradingDate: string
): Promise<ExecutionResult> {
  const config: SimConfig = await readConfig();

  let portfolio = await readPortfolio();
  if (!portfolio) portfolio = initPortfolio(config);

  // Update prices
  portfolio = updatePortfolioPrices(portfolio, priceMap);
  portfolio.tradingDate = tradingDate;

  const newTrades: TradeRecord[] = [];
  const skippedLimitDown: string[] = [];
  const skippedLimitUp: string[] = [];

  // === Sell phase (sell first to free cash) ===
  const top20Codes = top20.map((c) => c.stockCode);
  const remainingPositions: Position[] = [];

  for (const pos of portfolio.positions) {
    const currentPrice = priceMap.get(pos.stockCode) ?? pos.currentPrice;
    const info = stockInfoMap.get(pos.stockCode);
    const rank = top20Codes.indexOf(pos.stockCode);
    const signal = checkSellSignal(pos, currentPrice, rank, tradingDate, config);

    if (signal) {
      // Check limit-down: cannot sell at 跌停
      if (info && isLimitDown(currentPrice, info.prevClose, pos.stockCode, info.name)) {
        skippedLimitDown.push(pos.stockCode);
        remainingPositions.push(pos);
        continue;
      }

      const amount = pos.shares * currentPrice;
      const commission = calcCommission(amount, false, config);
      const netAmount = amount - commission;
      const realizedPnl = netAmount - pos.shares * pos.avgCost;
      const scoreAtTime =
        top20.find((c) => c.stockCode === pos.stockCode)?.totalScore ?? 0;

      newTrades.push({
        id: makeTradeId(tradingDate, pos.stockCode),
        date: tradingDate,
        stockCode: pos.stockCode,
        stockName: pos.stockName,
        action: "sell",
        price: currentPrice,
        shares: pos.shares,
        amount,
        commission,
        netAmount,
        sellReason: signal,
        scoreAtTime,
        realizedPnl,
      });

      portfolio.cashBalance += netAmount;
    } else {
      remainingPositions.push(pos);
    }
  }

  portfolio.positions = remainingPositions;

  // === Market filter check (opt-marketfilter) ===
  let skipBuy = false;
  if (config.MARKET_FILTER_ENABLED) {
    try {
      const indices = await fetchMarketIndices();
      const sh = indices.find((i) => i.code === "000001");
      const sz = indices.find((i) => i.code === "399001");
      const cy = indices.find((i) => i.code === "399006");
      const avg = ((sh?.changePercent ?? 0) + (sz?.changePercent ?? 0) + (cy?.changePercent ?? 0)) / 3;
      if (avg < -0.5) {
        skipBuy = true;
      }
    } catch {
      // If market data fetch fails, don't block buying
    }
  }

  // === Dynamic allocation (opt-drawdown) ===
  let allocationPctOverride: number | undefined;
  if (config.DYNAMIC_ALLOCATION_ENABLED) {
    const allDates = await listSnapshots();
    let consecutiveLoss = 0;
    for (let i = allDates.length - 1; i >= 0; i--) {
      const snap = await readSnapshot(allDates[i]);
      if (snap && snap.dailyReturn < 0) consecutiveLoss++;
      else break;
    }
    if (consecutiveLoss >= 3) {
      allocationPctOverride = 0.50;
    }
  }

  // === Buy phase ===
  if (!skipBuy) {
    const allocation = calcTargetAllocation(top20, portfolio.totalAssets, config, allocationPctOverride);
    const heldCodes = new Set(portfolio.positions.map((p) => p.stockCode));

    for (const [code, target] of allocation) {
      if (heldCodes.has(code)) continue; // already holding

      const price = priceMap.get(code);
      if (!price || price <= 0) continue;

      // Check limit-up: cannot buy at 涨停
      const info = stockInfoMap.get(code);
      if (info && isLimitUp(price, info.prevClose, code, info.name)) {
        skippedLimitUp.push(code);
        continue;
      }

      // Calculate shares (round down to lot size)
      const rawShares = Math.floor(target.targetValue / price);
      const shares =
        Math.floor(rawShares / config.LOT_SIZE) * config.LOT_SIZE;
      if (shares < config.LOT_SIZE) continue;

      const amount = shares * price;
      const commission = calcCommission(amount, true, config);
      const totalCost = amount + commission;

      if (totalCost > portfolio.cashBalance) continue; // not enough cash

      const scoreAtTime =
        top20.find((c) => c.stockCode === code)?.totalScore ?? 0;

      newTrades.push({
        id: makeTradeId(tradingDate, code),
        date: tradingDate,
        stockCode: code,
        stockName: target.stockName,
        action: "buy",
        price,
        shares,
        amount,
        commission,
        netAmount: totalCost,
        scoreAtTime,
      });

      portfolio.cashBalance -= totalCost;

      const newPos: Position = {
        stockCode: code,
        stockName: target.stockName,
        shares,
        avgCost: (amount + commission) / shares,
        buyDate: tradingDate,
        buyScore: scoreAtTime,
        currentPrice: price,
        marketValue: amount,
        unrealizedPnl: -commission,
        unrealizedPnlPct: -commission / amount,
        stopLossPrice: price * (1 - config.STOP_LOSS_PCT),
        takeProfitPrice: price * (1 + config.TAKE_PROFIT_PCT),
      };

      portfolio.positions.push(newPos);
      heldCodes.add(code);
    }
  }

  // Recalculate totals
  portfolio = updatePortfolioPrices(portfolio, priceMap);
  portfolio.tradingDate = tradingDate;

  // Persist
  await writePortfolio(portfolio);
  await appendTrades(newTrades);

  const buyCount = newTrades.filter((t) => t.action === "buy").length;
  const sellCount = newTrades.filter((t) => t.action === "sell").length;
  const parts: string[] = [];
  if (newTrades.length === 0 && skippedLimitUp.length === 0 && skippedLimitDown.length === 0) {
    if (skipBuy) {
      parts.push("市场弱势，暂停买入");
    } else {
      parts.push("本次无交易信号");
    }
  } else {
    if (buyCount > 0 || sellCount > 0)
      parts.push(`买入${buyCount}笔, 卖出${sellCount}笔`);
    if (skippedLimitUp.length > 0)
      parts.push(`${skippedLimitUp.length}只涨停无法买入`);
    if (skippedLimitDown.length > 0)
      parts.push(`${skippedLimitDown.length}只跌停无法卖出`);
    if (skipBuy && buyCount === 0)
      parts.push("市场弱势过滤已启用");
  }
  if (allocationPctOverride !== undefined) {
    parts.push(`连亏降仓至${(allocationPctOverride * 100).toFixed(0)}%`);
  }

  return { portfolio, newTrades, message: parts.join("; ") };
}

export async function takeDailySnapshot(
  portfolio: Portfolio,
  tradingDate: string,
  todayTradesCount: number
): Promise<DailySnapshot> {
  // Find previous snapshot for daily return calculation
  const allDates = await listSnapshots();
  let dailyReturn = 0;
  if (allDates.length > 0) {
    const lastDate = allDates[allDates.length - 1];
    if (lastDate !== tradingDate) {
      const lastSnap = await readSnapshot(lastDate);
      if (lastSnap && lastSnap.totalAssets > 0) {
        dailyReturn =
          (portfolio.totalAssets - lastSnap.totalAssets) /
          lastSnap.totalAssets;
      }
    }
  }

  const cumulativeReturn =
    (portfolio.totalAssets - portfolio.initialCapital) /
    portfolio.initialCapital;

  const snapshot: DailySnapshot = {
    date: tradingDate,
    totalAssets: portfolio.totalAssets,
    cashBalance: portfolio.cashBalance,
    positionCount: portfolio.positions.length,
    dailyReturn,
    cumulativeReturn,
    tradesCount: todayTradesCount,
  };

  await writeSnapshot(snapshot);
  return snapshot;
}
