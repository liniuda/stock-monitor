import { MarketIndex, Sector, Stock } from "./types";

const EAST_MONEY_HEADERS = {
  Referer: "https://www.eastmoney.com",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "*/*",
  "Accept-Language": "zh-CN,zh;q=0.9",
};

const BASE = "https://push2.eastmoney.com/api/qt";
const UT = "bd1d9ddb04089700cf9c27f6f7426281";

interface EastMoneyResponse {
  data?: {
    diff?: Record<string, unknown>[] | Record<string, Record<string, unknown>>;
    total?: number;
  };
  rc?: number;
}

function normalizeDiff(
  diff: Record<string, unknown>[] | Record<string, Record<string, unknown>>
): Record<string, unknown>[] {
  if (Array.isArray(diff)) return diff;
  return Object.values(diff);
}

async function emFetch(url: string, retries = 3): Promise<EastMoneyResponse> {
  let lastError: Error | null = null;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: EAST_MONEY_HEADERS,
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
      return await res.json();
    } catch (e) {
      lastError = e as Error;
      if (i < retries - 1) {
        await new Promise((r) => setTimeout(r, 300 * (i + 1)));
      }
    }
  }
  throw lastError;
}

export async function fetchMarketIndices(): Promise<MarketIndex[]> {
  const fields = "f2,f3,f4,f5,f6,f7,f8,f12,f14,f15,f16,f17,f18";
  const url = `${BASE}/ulist.np/get?secids=1.000001,0.399001,0.399006&fields=${fields}&ut=${UT}&fltt=2`;

  const json = await emFetch(url);
  if (!json.data?.diff) return [];
  const items = normalizeDiff(json.data.diff);

  return items.map((item) => ({
    code: String(item.f12 ?? ""),
    name: String(item.f14 ?? ""),
    price: Number(item.f2) || 0,
    change: Number(item.f4) || 0,
    changePercent: Number(item.f3) || 0,
    volume: Number(item.f5) || 0,
    amount: Number(item.f6) || 0,
    high: Number(item.f15) || 0,
    low: Number(item.f16) || 0,
    open: Number(item.f17) || 0,
    prevClose: Number(item.f18) || 0,
  }));
}

async function fetchSectorPage(page: number): Promise<{ items: Sector[]; total: number }> {
  const fields = "f2,f3,f4,f6,f7,f8,f12,f14,f20,f62,f184,f204";
  const url = `${BASE}/clist/get?fs=m:90+t:2+f:!50&pn=${page}&pz=100&po=1&fid=f3&fields=${fields}&ut=${UT}&fltt=2`;

  const json = await emFetch(url, 5);
  if (!json.data?.diff) return { items: [], total: 0 };
  const rawItems = normalizeDiff(json.data.diff);

  const items = rawItems.map((item) => ({
    code: String(item.f12 ?? ""),
    name: String(item.f14 ?? ""),
    changePercent: Number(item.f3) || 0,
    change: Number(item.f4) || 0,
    price: Number(item.f2) || 0,
    amount: Number(item.f6) || 0,
    volume: 0,
    amplitude: Number(item.f7) || 0,
    turnoverRate: Number(item.f8) || 0,
    leadingStock: String(item.f204 ?? ""),
    leadingStockChange: 0,
    mainNetInflow: Number(item.f62) || 0,
    mainNetInflowPercent: Number(item.f184) || 0,
  }));

  return { items, total: json.data.total ?? 0 };
}

export async function fetchSectors(page: number = 1): Promise<{ list: Sector[]; total: number }> {
  const result = await fetchSectorPage(page);
  return { list: result.items, total: result.total };
}

export async function fetchSectorStocks(
  sectorCode: string,
  page: number = 1,
  pageSize: number = 50
): Promise<{ list: Stock[]; total: number }> {
  const fields = "f2,f3,f4,f5,f6,f7,f8,f10,f12,f14,f15,f16,f17,f18,f20";
  const url = `${BASE}/clist/get?fs=b:${sectorCode}+f:!50&pn=${page}&pz=${pageSize}&po=1&fid=f3&fields=${fields}&ut=${UT}&fltt=2`;

  const json = await emFetch(url, 5);
  if (!json.data?.diff) return { list: [], total: 0 };
  const items = normalizeDiff(json.data.diff);

  const list = items.map((item) => ({
    code: String(item.f12 ?? ""),
    name: String(item.f14 ?? ""),
    price: Number(item.f2) || 0,
    changePercent: Number(item.f3) || 0,
    change: Number(item.f4) || 0,
    volume: Number(item.f5) || 0,
    amount: Number(item.f6) || 0,
    amplitude: Number(item.f7) || 0,
    turnoverRate: Number(item.f8) || 0,
    volumeRatio: Number(item.f10) || 0,
    high: Number(item.f15) || 0,
    low: Number(item.f16) || 0,
    open: Number(item.f17) || 0,
    prevClose: Number(item.f18) || 0,
    totalMarketCap: Number(item.f20) || 0,
  }));

  return { list, total: json.data.total ?? 0 };
}
