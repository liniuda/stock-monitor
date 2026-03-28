import { KlineBar, ConditionResult, StrategyTag, FiveMinContext } from "./types";
import { calcMA } from "./indicators";
import { Sector } from "../types";

/** Analyze 5-min bars for golden cross and trend direction */
export function analyzeFiveMin(bars5min: KlineBar[]): FiveMinContext {
  const defaultCtx: FiveMinContext = { hasGoldenCross: false, trendDirection: "flat" };

  if (bars5min.length < 10) return defaultCtx;

  const ma5 = calcMA(bars5min, 5);
  const ma10 = calcMA(bars5min, 10);
  const last = bars5min.length - 1;

  const curMA5 = ma5[last];
  const curMA10 = ma10[last];

  const hasGoldenCross =
    Number.isFinite(curMA5) && Number.isFinite(curMA10) && curMA5 > curMA10;

  let trendDirection: FiveMinContext["trendDirection"] = "flat";
  if (bars5min.length >= 3) {
    const c1 = bars5min[last - 2].close;
    const c2 = bars5min[last - 1].close;
    const c3 = bars5min[last].close;
    if (c3 > c2 && c2 > c1) trendDirection = "up";
    else if (c3 < c2 && c2 < c1) trendDirection = "down";
  }

  return { hasGoldenCross, trendDirection };
}

/** Derive strategy tags from condition results */
export function deriveStockStrategies(
  conditions: ConditionResult[],
  ctx?: FiveMinContext
): StrategyTag[] {
  const tags: StrategyTag[] = [];
  const passed = new Set(conditions.filter((c) => c.passed).map((c) => c.id));

  // 趋势跟踪: MA5(1) + MACD(2) + (5min金叉(10) or ctx.goldenCross)
  if (
    passed.has(1) &&
    passed.has(2) &&
    (passed.has(10) || ctx?.hasGoldenCross)
  ) {
    tags.push("趋势跟踪");
  } else if (passed.has(8) && passed.has(10)) {
    // KDJ金叉 + 5min金叉 also qualifies
    tags.push("趋势跟踪");
  }

  // 均值回归: BOLL下轨(4) OR RSI超卖(5)
  if (passed.has(4) || passed.has(5)) {
    tags.push("均值回归");
  }

  // 动量策略: 价格动量(7) + MA5(1), OR 量增价涨(11)
  if ((passed.has(7) && passed.has(1)) || passed.has(11)) {
    tags.push("动量策略");
  }

  // 量价异动: 量能放大(3) + (盘中放量(6) OR 量增价涨(11))
  if (passed.has(3) && (passed.has(6) || passed.has(11))) {
    tags.push("量价异动");
  }

  // 统计套利(简化): BOLL下轨(4) + 量能未放大
  if (passed.has(4) && !passed.has(3)) {
    tags.push("统计套利");
  }

  return tags;
}

/** Build a short Chinese reason text */
export function buildReasonText(
  tags: StrategyTag[],
  conditions: ConditionResult[],
  ctx?: FiveMinContext
): string {
  if (tags.length === 0) {
    // Even without strategy tags, summarize passed conditions
    const passedNames = conditions
      .filter((c) => c.passed)
      .map((c) => c.name);
    if (passedNames.length === 0) return "";
    return passedNames.join("、") + "信号触发";
  }

  const passed = new Set(conditions.filter((c) => c.passed).map((c) => c.id));
  const parts: string[] = [];

  for (const tag of tags.slice(0, 2)) {
    switch (tag) {
      case "趋势跟踪": {
        const signals: string[] = [];
        if (passed.has(1)) signals.push("MA5突破");
        if (passed.has(2)) signals.push("MACD收敛");
        if (passed.has(8)) signals.push("KDJ金叉");
        const cross = passed.has(10) ? "，5min均线金叉确认" : "";
        parts.push(signals.join("+") + cross + "，趋势向好");
        break;
      }
      case "均值回归": {
        const signals: string[] = [];
        if (passed.has(4)) signals.push("触及BOLL下轨");
        if (passed.has(5)) signals.push("RSI超卖反弹");
        parts.push(signals.join("，") + "，超跌回归机会");
        break;
      }
      case "动量策略": {
        const signals: string[] = [];
        if (passed.has(7)) signals.push("价格动量强劲");
        if (passed.has(11)) signals.push("5min量价共振");
        if (passed.has(9)) signals.push("跳空高开");
        const trend = ctx?.trendDirection === "up" ? "，短线持续走高" : "";
        parts.push(signals.join("，") + trend);
        break;
      }
      case "量价异动": {
        const signals: string[] = [];
        if (passed.has(3)) signals.push("日线量能放大");
        if (passed.has(6)) signals.push("盘中持续放量");
        if (passed.has(11)) signals.push("5min量增价涨");
        parts.push(signals.join("+") + "，量价配合良好");
        break;
      }
      case "统计套利":
        parts.push("价格偏离均值但量能未放大，关注价差收敛");
        break;
    }
  }

  // Append gap-up signal if present but not covered by tags
  if (passed.has(9) && !parts.some((p) => p.includes("跳空"))) {
    parts.push("跳空高开确认强势");
  }

  return parts.join("；");
}

/** Derive strategy tags for a sector based on its metrics */
export function deriveSectorTags(sector: Sector): StrategyTag[] {
  const tags: StrategyTag[] = [];

  if (sector.changePercent > 2 && sector.leadingStockChange > 5) {
    tags.push("趋势跟踪");
  }

  if (sector.changePercent < -2) {
    tags.push("均值回归");
  }

  if (sector.leadingStockChange > 7) {
    tags.push("动量策略");
  }

  if (sector.amount > 5e8 && sector.changePercent > 1) {
    tags.push("量价异动");
  }

  if (
    Math.abs(sector.changePercent) < 0.5 &&
    sector.leadingStockChange > 5
  ) {
    tags.push("统计套利");
  }

  return tags;
}
