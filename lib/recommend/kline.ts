import { KlineBar } from "./types";

const HEADERS = {
  Referer: "https://web.ifzq.gtimg.cn",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

function getTencentCode(code: string): string {
  if (code.startsWith("6")) return `sh${code}`;
  return `sz${code}`;
}

/**
 * Fetch daily K-line from Tencent Finance API.
 * Returns last 60 trading days of forward-adjusted (前复权) data.
 * Response format: ["date", "open", "close", "high", "low", "volume"]
 */
export async function fetchDailyKline(code: string): Promise<KlineBar[]> {
  const tc = getTencentCode(code);
  const url = `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${tc},day,,,60,qfq`;

  const res = await fetch(url, {
    headers: HEADERS,
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) throw new Error(`Tencent K-line API error: ${res.status}`);

  const json = await res.json();
  if (json.code !== 0) throw new Error(`Tencent API code: ${json.code}`);

  const stockKey = Object.keys(json.data || {})[0];
  if (!stockKey) throw new Error(`No data key for ${code}`);

  const stockData = json.data[stockKey];
  // Try 'day' first, then 'qfqday' for adjusted data
  const klines: string[][] = stockData?.day || stockData?.qfqday || [];

  if (klines.length === 0) {
    throw new Error(`No K-line data for ${code}`);
  }

  return klines.map((k) => ({
    date: k[0],
    open: parseFloat(k[1]),
    close: parseFloat(k[2]),
    high: parseFloat(k[3]),
    low: parseFloat(k[4]),
    volume: parseFloat(k[5]),
  }));
}

interface MinuteTick {
  time: number; // HHMM as integer
  price: number;
  cumVolume: number;
}

/**
 * Fetch intraday minute data from Tencent, aggregate into 5-min bars.
 * Minute data format: "HHMM price cumVolume cumAmount"
 */
export async function fetchFiveMinKline(code: string): Promise<KlineBar[]> {
  const tc = getTencentCode(code);
  const url = `https://web.ifzq.gtimg.cn/appstock/app/minute/query?code=${tc}`;

  const res = await fetch(url, {
    headers: HEADERS,
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) throw new Error(`Tencent minute API error: ${res.status}`);

  const json = await res.json();
  const stockKey = Object.keys(json.data || {})[0];
  if (!stockKey) return [];

  const stockData = json.data[stockKey];
  const rawData: string[] = stockData?.data?.data || [];

  if (rawData.length === 0) return [];

  // Parse minute ticks
  const ticks: MinuteTick[] = rawData.map((line) => {
    const parts = line.split(" ");
    return {
      time: parseInt(parts[0]),
      price: parseFloat(parts[1]),
      cumVolume: parseInt(parts[2]),
    };
  });

  // Define 5-minute interval boundaries
  // Morning: 0930-1130, Afternoon: 1300-1500
  const intervals = [
    935, 940, 945, 950, 955, 1000, 1005, 1010, 1015, 1020, 1025, 1030, 1035,
    1040, 1045, 1050, 1055, 1100, 1105, 1110, 1115, 1120, 1125, 1130, 1305,
    1310, 1315, 1320, 1325, 1330, 1335, 1340, 1345, 1350, 1355, 1400, 1405,
    1410, 1415, 1420, 1425, 1430, 1435, 1440, 1445, 1450, 1455, 1500,
  ];

  const bars: KlineBar[] = [];
  let tickIdx = 0;

  for (const endTime of intervals) {
    const barTicks: MinuteTick[] = [];
    while (tickIdx < ticks.length && ticks[tickIdx].time <= endTime) {
      barTicks.push(ticks[tickIdx]);
      tickIdx++;
    }

    if (barTicks.length === 0) continue;

    const prices = barTicks.map((t) => t.price);
    const firstVol =
      bars.length > 0
        ? ticks[ticks.indexOf(barTicks[0]) - 1]?.cumVolume ?? 0
        : 0;
    const lastVol = barTicks[barTicks.length - 1].cumVolume;

    bars.push({
      date: String(endTime),
      open: prices[0],
      close: prices[prices.length - 1],
      high: Math.max(...prices),
      low: Math.min(...prices),
      volume: lastVol - firstVol,
    });
  }

  return bars;
}
