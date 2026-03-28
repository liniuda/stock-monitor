import { KlineBar, MACDResult, BollingerResult, KDJResult } from "./types";

function isValid(v: number): boolean {
  return Number.isFinite(v);
}

/** Simple Moving Average on close prices */
export function calcMA(bars: KlineBar[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < bars.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
    } else {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += bars[j].close;
      }
      result.push(sum / period);
    }
  }
  return result;
}

/** Simple Moving Average on volume */
export function calcVolumeMA(bars: KlineBar[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < bars.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
    } else {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += bars[j].volume;
      }
      result.push(sum / period);
    }
  }
  return result;
}

/** Exponential Moving Average on a values array */
export function calcEMA(values: number[], period: number): number[] {
  const result: number[] = [];
  const k = 2 / (period + 1);

  // SMA seed for the first `period` values
  let seed = 0;
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      seed += values[i];
      result.push(NaN);
    } else if (i === period - 1) {
      seed += values[i];
      result.push(seed / period);
    } else {
      const prev = result[i - 1];
      if (!isValid(prev)) {
        result.push(NaN);
      } else {
        result.push(values[i] * k + prev * (1 - k));
      }
    }
  }
  return result;
}

/** MACD(12, 26, 9) */
export function calcMACD(bars: KlineBar[]): MACDResult[] {
  const closes = bars.map((b) => b.close);
  const ema12 = calcEMA(closes, 12);
  const ema26 = calcEMA(closes, 26);

  // DIF = EMA12 - EMA26
  const dif: number[] = [];
  for (let i = 0; i < bars.length; i++) {
    if (isValid(ema12[i]) && isValid(ema26[i])) {
      dif.push(ema12[i] - ema26[i]);
    } else {
      dif.push(NaN);
    }
  }

  // DEA = EMA9 of DIF (only on valid DIF values)
  // Find the first valid DIF index
  let firstValid = -1;
  for (let i = 0; i < dif.length; i++) {
    if (isValid(dif[i])) {
      firstValid = i;
      break;
    }
  }

  const dea: number[] = new Array(bars.length).fill(NaN);
  if (firstValid >= 0) {
    // Calculate EMA9 on valid DIF portion
    const validDif = dif.slice(firstValid);
    const ema9 = calcEMA(validDif, 9);
    for (let i = 0; i < ema9.length; i++) {
      dea[firstValid + i] = ema9[i];
    }
  }

  const result: MACDResult[] = [];
  for (let i = 0; i < bars.length; i++) {
    const d = dif[i];
    const e = dea[i];
    result.push({
      diff: d,
      dea: e,
      histogram: isValid(d) && isValid(e) ? (d - e) * 2 : NaN,
    });
  }

  return result;
}

/** Bollinger Bands (period=20, multiplier=2) */
export function calcBollinger(
  bars: KlineBar[],
  period = 20,
  mult = 2
): BollingerResult[] {
  const result: BollingerResult[] = [];
  for (let i = 0; i < bars.length; i++) {
    if (i < period - 1) {
      result.push({ upper: NaN, middle: NaN, lower: NaN });
    } else {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += bars[j].close;
      }
      const middle = sum / period;

      let variance = 0;
      for (let j = i - period + 1; j <= i; j++) {
        const diff = bars[j].close - middle;
        variance += diff * diff;
      }
      const stddev = Math.sqrt(variance / period);

      result.push({
        upper: middle + mult * stddev,
        middle,
        lower: middle - mult * stddev,
      });
    }
  }
  return result;
}

/** RSI (Relative Strength Index) using Wilder smoothing */
export function calcRSI(bars: KlineBar[], period = 14): number[] {
  const result: number[] = new Array(bars.length).fill(NaN);
  if (bars.length < period + 1) return result;

  // Calculate price changes
  const changes: number[] = [];
  for (let i = 0; i < bars.length; i++) {
    if (i === 0) {
      changes.push(0);
    } else {
      changes.push(bars[i].close - bars[i - 1].close);
    }
  }

  // First average: simple mean of first `period` changes (starting from index 1)
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const c = changes[i];
    if (c > 0) avgGain += c;
    else avgLoss += Math.abs(c);
  }
  avgGain /= period;
  avgLoss /= period;

  if (avgLoss === 0) {
    result[period] = 100;
  } else {
    result[period] = 100 - 100 / (1 + avgGain / avgLoss);
  }

  // Subsequent values: Wilder smoothing
  for (let i = period + 1; i < bars.length; i++) {
    const c = changes[i];
    const gain = c > 0 ? c : 0;
    const loss = c < 0 ? Math.abs(c) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      result[i] = 100;
    } else {
      result[i] = 100 - 100 / (1 + avgGain / avgLoss);
    }
  }

  return result;
}

/** KDJ indicator (period=9, smoothing 2/3) */
export function calcKDJ(bars: KlineBar[], period = 9): KDJResult[] {
  const result: KDJResult[] = [];
  let prevK = 50;
  let prevD = 50;

  for (let i = 0; i < bars.length; i++) {
    if (i < period - 1) {
      result.push({ k: NaN, d: NaN, j: NaN });
      continue;
    }

    // Find highest high and lowest low in the period window
    let highestHigh = -Infinity;
    let lowestLow = Infinity;
    for (let j = i - period + 1; j <= i; j++) {
      if (bars[j].high > highestHigh) highestHigh = bars[j].high;
      if (bars[j].low < lowestLow) lowestLow = bars[j].low;
    }

    const range = highestHigh - lowestLow;
    const rsv = range === 0 ? 50 : ((bars[i].close - lowestLow) / range) * 100;

    const k = (2 / 3) * prevK + (1 / 3) * rsv;
    const d = (2 / 3) * prevD + (1 / 3) * k;
    const j = 3 * k - 2 * d;

    result.push({ k, d, j });
    prevK = k;
    prevD = d;
  }

  return result;
}
