import { Position, SimConfig, SIM_CONFIG } from "./types";

export function calcCommission(amount: number, isBuy: boolean, config: SimConfig = SIM_CONFIG): number {
  const rate = isBuy ? config.BUY_COMMISSION : config.SELL_COMMISSION;
  return Math.max(amount * rate, config.MIN_COMMISSION);
}

export type SellReason = "take_profit" | "stop_loss" | "score_drop";

export function checkSellSignal(
  position: Position,
  currentPrice: number,
  currentRank: number,
  todayDate: string,
  config: SimConfig = SIM_CONFIG
): SellReason | null {
  // T+1: cannot sell on buy day
  if (position.buyDate === todayDate) return null;

  // Stop loss has highest priority
  if (currentPrice <= position.stopLossPrice) return "stop_loss";

  // Take profit
  if (currentPrice >= position.takeProfitPrice) return "take_profit";

  // Score dropped out of top N (with optional buffer zone)
  const exitThreshold = config.TOP_N_THRESHOLD + (config.SCORE_EXIT_BUFFER || 0);
  if (currentRank < 0 || currentRank >= exitThreshold) {
    return "score_drop";
  }

  return null;
}

export interface AllocationCandidate {
  stockCode: string;
  stockName: string;
  totalScore: number;
  currentPrice: number;
}

export function calcTargetAllocation(
  candidates: AllocationCandidate[],
  totalAssets: number,
  config: SimConfig = SIM_CONFIG,
  allocationPctOverride?: number
): Map<string, { targetValue: number; stockName: string; price: number }> {
  const result = new Map<
    string,
    { targetValue: number; stockName: string; price: number }
  >();

  if (candidates.length === 0) return result;

  const scoreSum = candidates.reduce((s, c) => s + c.totalScore, 0);
  if (scoreSum <= 0) return result;

  const allocPct = allocationPctOverride ?? config.ALLOCATION_PCT;
  const investableTotal = totalAssets * allocPct;
  const minValue = totalAssets * config.MIN_POSITION_PCT;
  const maxValue = totalAssets * config.MAX_POSITION_PCT;

  for (const c of candidates) {
    const weight = c.totalScore / scoreSum;
    let targetValue = weight * investableTotal;

    // Clamp to min/max
    if (targetValue < minValue) continue; // too small, skip
    if (targetValue > maxValue) targetValue = maxValue;

    // Must afford at least 1 lot
    const lotCost = c.currentPrice * config.LOT_SIZE;
    if (lotCost <= 0 || targetValue < lotCost) continue;

    result.set(c.stockCode, {
      targetValue,
      stockName: c.stockName,
      price: c.currentPrice,
    });
  }

  return result;
}
