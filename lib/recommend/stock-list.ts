interface AStockItem {
  code: string;
  name: string;
}

const HEADERS = {
  Referer: "https://finance.sina.com.cn",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
};

let cachedList: AStockItem[] | null = null;
let cachedAt = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function fetchNodePages(node: string): Promise<AStockItem[]> {
  const all: AStockItem[] = [];
  const MAX_PAGES = 60;

  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = `https://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/Market_Center.getHQNodeData?page=${page}&num=100&sort=symbol&asc=1&node=${node}&symbol=&_s_r_a=auto`;

    try {
      const res = await fetch(url, {
        headers: HEADERS,
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) break;

      const data: Array<{ code: string; name: string }> = await res.json();
      if (!Array.isArray(data) || data.length === 0) break;

      for (const item of data) {
        if (item.code && /^\d{6}$/.test(item.code)) {
          all.push({ code: item.code, name: item.name });
        }
      }

      if (data.length < 100) break;
    } catch {
      break;
    }
  }

  return all;
}

export async function fetchAllAShares(): Promise<AStockItem[]> {
  const now = Date.now();
  if (cachedList && now - cachedAt < CACHE_TTL) {
    return cachedList;
  }

  const [shStocks, szStocks] = await Promise.all([
    fetchNodePages("sh_a"),
    fetchNodePages("sz_a"),
  ]);

  // Deduplicate by code
  const map = new Map<string, AStockItem>();
  for (const s of [...shStocks, ...szStocks]) {
    if (!map.has(s.code)) {
      map.set(s.code, s);
    }
  }

  const list = Array.from(map.values());

  if (list.length === 0) {
    throw new Error("Empty A-share stock list from Sina");
  }

  cachedList = list;
  cachedAt = now;

  return list;
}
