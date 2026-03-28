const BASE = "https://push2.eastmoney.com/api/qt";
const UT = "bd1d9ddb04089700cf9c27f6f7426281";

interface EastMoneyRawResponse {
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

// JSONP fetch for endpoints blocked by TLS fingerprinting on Node.js
function jsonpFetch(url: string): Promise<EastMoneyRawResponse> {
  return new Promise((resolve, reject) => {
    const callbackName = `emcb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("JSONP timeout"));
    }, 10000);

    function cleanup() {
      clearTimeout(timeout);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any)[callbackName];
      const el = document.getElementById(callbackName);
      if (el) el.remove();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any)[callbackName] = (data: EastMoneyRawResponse) => {
      cleanup();
      resolve(data);
    };

    const script = document.createElement("script");
    script.id = callbackName;
    script.src = `${url}&cb=${callbackName}`;
    script.onerror = () => {
      cleanup();
      reject(new Error("JSONP load error"));
    };
    document.head.appendChild(script);
  });
}

export async function fetchMarketIndicesClient() {
  const fields = "f2,f3,f4,f5,f6,f7,f8,f12,f14,f15,f16,f17,f18";
  const url = `${BASE}/ulist.np/get?secids=1.000001,0.399001,0.399006&fields=${fields}&ut=${UT}&fltt=2`;

  const json = await jsonpFetch(url);
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

export async function fetchSectorsClient(page: number = 1) {
  const fields = "f2,f3,f4,f6,f7,f8,f12,f14,f20,f62,f184,f204";
  const url = `${BASE}/clist/get?fs=m:90+t:2+f:!50&pn=${page}&pz=100&po=1&fid=f3&fields=${fields}&ut=${UT}&fltt=2`;

  const json = await jsonpFetch(url);
  if (!json.data?.diff) return { list: [], total: 0 };
  const rawItems = normalizeDiff(json.data.diff);

  const list = rawItems.map((item) => ({
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

  return { list, total: json.data.total ?? 0 };
}

export async function fetchSectorStocksClient(
  sectorCode: string,
  page: number = 1,
  pageSize: number = 50
) {
  const fields = "f2,f3,f4,f5,f6,f7,f8,f10,f12,f14,f15,f16,f17,f18,f20";
  const url = `${BASE}/clist/get?fs=b:${sectorCode}+f:!50&pn=${page}&pz=${pageSize}&po=1&fid=f3&fields=${fields}&ut=${UT}&fltt=2`;

  const json = await jsonpFetch(url);
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
