import { KlineBar, ConditionResult } from "./types";
import { calcMA, calcMACD, calcBollinger, calcRSI, calcKDJ } from "./indicators";

function isValid(v: number): boolean {
  return Number.isFinite(v);
}

// ============ Daily Conditions (total 60pts) ============

/** Condition 1 (10pts): Previous day close > MA5 */
export function checkMA5Breakout(bars: KlineBar[]): ConditionResult {
  const base: ConditionResult = {
    id: 1,
    name: "MA5突破",
    passed: false,
    score: 0,
    maxScore: 10,
    detail: "",
  };

  if (bars.length < 6) {
    base.detail = "历史数据不足";
    return base;
  }

  const ma5 = calcMA(bars, 5);
  const n = bars.length;
  const prevClose = bars[n - 1].close;
  const prevMA5 = ma5[n - 1];

  if (!isValid(prevMA5)) {
    base.detail = "MA5无效";
    return base;
  }

  base.detail = `收盘${prevClose.toFixed(2)} vs MA5 ${prevMA5.toFixed(2)}`;

  if (prevClose > prevMA5) {
    base.passed = true;
    base.score = 10;
  }

  return base;
}

/** Condition 2 (12pts): MACD DIFF<DEA and DIFF-DEA approaching 0 over t-3..t-1 */
export function checkMACDConvergence(bars: KlineBar[]): ConditionResult {
  const base: ConditionResult = {
    id: 2,
    name: "MACD收敛",
    passed: false,
    score: 0,
    maxScore: 12,
    detail: "",
  };

  if (bars.length < 35) {
    base.detail = "历史数据不足(需35根K线)";
    return base;
  }

  const macd = calcMACD(bars);
  const n = bars.length;

  const r1 = macd[n - 3];
  const r2 = macd[n - 2];
  const r3 = macd[n - 1];

  if (!isValid(r1.diff) || !isValid(r1.dea) || !isValid(r2.diff) || !isValid(r2.dea) || !isValid(r3.diff) || !isValid(r3.dea)) {
    base.detail = "MACD指标无效";
    return base;
  }

  const gap1 = r1.diff - r1.dea;
  const gap2 = r2.diff - r2.dea;
  const gap3 = r3.diff - r3.dea;

  base.detail = `DIFF-DEA: ${gap1.toFixed(4)}→${gap2.toFixed(4)}→${gap3.toFixed(4)}`;

  if (
    r3.diff < r3.dea &&
    Math.abs(gap3) < Math.abs(gap2) &&
    Math.abs(gap2) < Math.abs(gap1)
  ) {
    base.passed = true;
    base.score = 12;
  }

  return base;
}

/** Condition 3 (10pts): Previous day volume > MA5 volume * 130% */
export function checkVolumeSurge(bars: KlineBar[]): ConditionResult {
  const base: ConditionResult = {
    id: 3,
    name: "量能放大",
    passed: false,
    score: 0,
    maxScore: 10,
    detail: "",
  };

  if (bars.length < 6) {
    base.detail = "历史数据不足";
    return base;
  }

  const n = bars.length;
  const prevVol = bars[n - 1].volume;

  let sumVol = 0;
  for (let i = n - 6; i <= n - 2; i++) {
    if (i < 0 || bars[i].volume <= 0) {
      base.detail = "存在停牌日，量能数据不完整";
      return base;
    }
    sumVol += bars[i].volume;
  }
  const avgVol5 = sumVol / 5;

  const ratio = prevVol / avgVol5;
  base.detail = `量比MA5: ${(ratio * 100).toFixed(0)}% (阈值130%)`;

  if (prevVol > avgVol5 * 1.3) {
    base.passed = true;
    base.score = 10;
  }

  return base;
}

/** Condition 4 (8pts): Previous day low < Bollinger lower band */
export function checkBollBreak(bars: KlineBar[]): ConditionResult {
  const base: ConditionResult = {
    id: 4,
    name: "BOLL下轨",
    passed: false,
    score: 0,
    maxScore: 8,
    detail: "",
  };

  if (bars.length < 20) {
    base.detail = "历史数据不足(需20根K线)";
    return base;
  }

  const boll = calcBollinger(bars);
  const n = bars.length;
  const prevLow = bars[n - 1].low;
  const lower = boll[n - 1].lower;

  if (!isValid(lower)) {
    base.detail = "BOLL指标无效";
    return base;
  }

  base.detail = `最低价${prevLow.toFixed(2)} vs 下轨${lower.toFixed(2)}`;

  if (prevLow < lower) {
    base.passed = true;
    base.score = 8;
  }

  return base;
}

/** Condition 5 (8pts): RSI(14) bouncing from oversold zone (<30) */
export function checkRSIBounce(bars: KlineBar[]): ConditionResult {
  const base: ConditionResult = {
    id: 5,
    name: "RSI超卖反弹",
    passed: false,
    score: 0,
    maxScore: 8,
    detail: "",
  };

  if (bars.length < 16) {
    base.detail = "历史数据不足(需16根K线)";
    return base;
  }

  const rsi = calcRSI(bars, 14);
  const n = bars.length;
  const prevRSI = rsi[n - 2];
  const curRSI = rsi[n - 1];

  if (!isValid(prevRSI) || !isValid(curRSI)) {
    base.detail = "RSI指标无效";
    return base;
  }

  base.detail = `前RSI: ${prevRSI.toFixed(1)}, 当RSI: ${curRSI.toFixed(1)}`;

  if (prevRSI < 30 && curRSI > prevRSI) {
    base.passed = true;
    base.score = 8;
  }

  return base;
}

/** Condition 8 (7pts): KDJ J-line crosses above K-line from oversold zone */
export function checkKDJGoldenCross(bars: KlineBar[]): ConditionResult {
  const base: ConditionResult = {
    id: 8,
    name: "KDJ金叉",
    passed: false,
    score: 0,
    maxScore: 7,
    detail: "",
  };

  if (bars.length < 20) {
    base.detail = "历史数据不足(需20根K线)";
    return base;
  }

  const kdj = calcKDJ(bars, 9);
  const n = bars.length;
  const prev = kdj[n - 2];
  const cur = kdj[n - 1];

  if (!isValid(prev.k) || !isValid(cur.k)) {
    base.detail = "KDJ指标无效";
    return base;
  }

  base.detail = `K:${cur.k.toFixed(1)} D:${cur.d.toFixed(1)} J:${cur.j.toFixed(1)}`;

  // J crosses above K from oversold zone (K<20 or J<20)
  if (prev.j < prev.k && cur.j > cur.k && (prev.k < 20 || prev.j < 20)) {
    base.passed = true;
    base.score = 7;
  }

  return base;
}

/** Condition 9 (5pts): Gap up - today open > yesterday close * 1.01 AND > yesterday high */
export function checkGapUp(bars: KlineBar[]): ConditionResult {
  const base: ConditionResult = {
    id: 9,
    name: "跳空缺口",
    passed: false,
    score: 0,
    maxScore: 5,
    detail: "",
  };

  if (bars.length < 2) {
    base.detail = "历史数据不足";
    return base;
  }

  const n = bars.length;
  const today = bars[n - 1];
  const yesterday = bars[n - 2];

  base.detail = `今开${today.open.toFixed(2)} 昨收${yesterday.close.toFixed(2)} 昨高${yesterday.high.toFixed(2)}`;

  if (today.open > yesterday.close * 1.01 && today.open > yesterday.high) {
    base.passed = true;
    base.score = 5;
  }

  return base;
}

// ============ Intraday Conditions (total 40pts) ============

/** Condition 6 (12pts): Price > open AND 2 consecutive 5-min volumes increasing */
export function checkIntradayVolume(bars5min: KlineBar[]): ConditionResult {
  const base: ConditionResult = {
    id: 6,
    name: "盘中放量",
    passed: false,
    score: 0,
    maxScore: 12,
    detail: "",
  };

  if (bars5min.length < 3) {
    base.detail = "5分钟K线不足3根";
    return base;
  }

  const m = bars5min.length;
  const curPrice = bars5min[m - 1].close;
  const openPrice = bars5min[0].open;
  const vol1 = bars5min[m - 2].volume;
  const vol2 = bars5min[m - 1].volume;

  const aboveOpen = curPrice > openPrice;
  const volIncreasing = vol2 > vol1 && vol1 > bars5min[m - 3].volume;

  base.detail = `价${curPrice.toFixed(2)}${aboveOpen ? ">" : "≤"}开${openPrice.toFixed(2)}, 量${volIncreasing ? "连续放大" : "未连续放大"}`;

  if (aboveOpen && volIncreasing) {
    base.passed = true;
    base.score = 12;
  }

  return base;
}

/** Condition 7 (10pts): Current price > previous 5-min bar close */
export function checkPriceMomentum(bars5min: KlineBar[]): ConditionResult {
  const base: ConditionResult = {
    id: 7,
    name: "价格动量",
    passed: false,
    score: 0,
    maxScore: 10,
    detail: "",
  };

  if (bars5min.length < 2) {
    base.detail = "5分钟K线不足2根";
    return base;
  }

  const m = bars5min.length;
  const curPrice = bars5min[m - 1].close;
  const prevClose = bars5min[m - 2].close;

  base.detail = `当前${curPrice.toFixed(2)} vs 前5min收${prevClose.toFixed(2)}`;

  if (curPrice >= prevClose) {
    base.passed = true;
    base.score = 10;
  }

  return base;
}

/** Condition 10 (10pts): 5min MA5 > MA10 (golden cross) */
export function checkFiveMinMAGoldenCross(bars5min: KlineBar[]): ConditionResult {
  const base: ConditionResult = {
    id: 10,
    name: "5min均线金叉",
    passed: false,
    score: 0,
    maxScore: 10,
    detail: "",
  };

  if (bars5min.length < 10) {
    base.detail = "5分钟K线不足10根";
    return base;
  }

  const ma5 = calcMA(bars5min, 5);
  const ma10 = calcMA(bars5min, 10);
  const last = bars5min.length - 1;

  const curMA5 = ma5[last];
  const curMA10 = ma10[last];

  if (!isValid(curMA5) || !isValid(curMA10)) {
    base.detail = "均线指标无效";
    return base;
  }

  base.detail = `MA5:${curMA5.toFixed(3)} vs MA10:${curMA10.toFixed(3)}`;

  if (curMA5 > curMA10) {
    base.passed = true;
    base.score = 10;
  }

  return base;
}

/** Condition 11 (8pts): Last 3 5min bars show increasing close AND increasing volume */
export function checkVolumePriceSurge(bars5min: KlineBar[]): ConditionResult {
  const base: ConditionResult = {
    id: 11,
    name: "量增价涨",
    passed: false,
    score: 0,
    maxScore: 8,
    detail: "",
  };

  if (bars5min.length < 3) {
    base.detail = "5分钟K线不足3根";
    return base;
  }

  const m = bars5min.length;
  const b1 = bars5min[m - 3];
  const b2 = bars5min[m - 2];
  const b3 = bars5min[m - 1];

  const priceUp = b3.close > b2.close && b2.close > b1.close;
  const volUp = b3.volume > b2.volume && b2.volume > b1.volume;

  base.detail = `价${b1.close.toFixed(2)}→${b2.close.toFixed(2)}→${b3.close.toFixed(2)}, 量${volUp ? "连续放大" : "未连续"}`;

  if (priceUp && volUp) {
    base.passed = true;
    base.score = 8;
  }

  return base;
}

// ============ Evaluate Functions ============

/** Evaluate all daily conditions (7 conditions, max 60pts) */
export function evaluateDailyConditions(bars: KlineBar[]): {
  conditions: ConditionResult[];
  dailyScore: number;
} {
  const conditions = [
    checkMA5Breakout(bars),
    checkMACDConvergence(bars),
    checkVolumeSurge(bars),
    checkBollBreak(bars),
    checkRSIBounce(bars),
    checkKDJGoldenCross(bars),
    checkGapUp(bars),
  ];
  const dailyScore = conditions.reduce((sum, c) => sum + c.score, 0);
  return { conditions, dailyScore };
}

/** Evaluate all intraday conditions (4 conditions, max 40pts) */
export function evaluateIntradayConditions(bars5min: KlineBar[]): {
  conditions: ConditionResult[];
  intradayScore: number;
} {
  const conditions = [
    checkIntradayVolume(bars5min),
    checkPriceMomentum(bars5min),
    checkFiveMinMAGoldenCross(bars5min),
    checkVolumePriceSurge(bars5min),
  ];
  const intradayScore = conditions.reduce((sum, c) => sum + c.score, 0);
  return { conditions, intradayScore };
}
