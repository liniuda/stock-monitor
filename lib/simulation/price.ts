const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

function getTencentCode(code: string): string {
  if (code.startsWith("6")) return `sh${code}`;
  return `sz${code}`;
}

export interface StockPrice {
  price: number;
  name: string;
  prevClose: number;
}

/**
 * Get limit-up/down percentage based on stock code and name.
 * 科创板(688): 20%, 创业板(300): 20%, ST: 5%, others: 10%
 */
export function getLimitPct(code: string, name: string): number {
  if (name.includes("ST")) return 0.05;
  if (code.startsWith("688")) return 0.20;
  if (code.startsWith("300")) return 0.20;
  return 0.10;
}

/**
 * Check if a stock is at limit-up (涨停, cannot buy).
 */
export function isLimitUp(price: number, prevClose: number, code: string, name: string): boolean {
  if (prevClose <= 0) return false;
  const limitPct = getLimitPct(code, name);
  const limitPrice = Math.round(prevClose * (1 + limitPct) * 100) / 100;
  return price >= limitPrice;
}

/**
 * Check if a stock is at limit-down (跌停, cannot sell).
 */
export function isLimitDown(price: number, prevClose: number, code: string, name: string): boolean {
  if (prevClose <= 0) return false;
  const limitPct = getLimitPct(code, name);
  const limitPrice = Math.round(prevClose * (1 - limitPct) * 100) / 100;
  return price <= limitPrice;
}

/**
 * Batch fetch current prices from Tencent Finance API.
 * Format: v_sh600000="1~浦发银行~600000~10.50~10.30~..."
 * Field[3]=current price, Field[4]=prevClose
 */
export async function fetchCurrentPrices(
  codes: string[]
): Promise<Map<string, StockPrice>> {
  const result = new Map<string, StockPrice>();
  if (codes.length === 0) return result;

  const BATCH = 50;
  for (let i = 0; i < codes.length; i += BATCH) {
    const batch = codes.slice(i, i + BATCH);
    const tcCodes = batch.map((c) => getTencentCode(c)).join(",");
    const url = `https://qt.gtimg.cn/q=${tcCodes}`;

    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA },
        signal: AbortSignal.timeout(10000),
      });
      const buf = await res.arrayBuffer();
      const text = new TextDecoder("gbk").decode(buf);

      const lines = text.split(";").filter((l) => l.includes("~"));
      for (const line of lines) {
        const parts = line.split("~");
        if (parts.length < 5) continue;
        const code = parts[2];
        const name = parts[1];
        const price = parseFloat(parts[3]);
        const prevClose = parseFloat(parts[4]);
        if (code && price > 0) {
          result.set(code, { price, name, prevClose: prevClose || 0 });
        }
      }
    } catch {
      // skip failed batch
    }
  }

  return result;
}
