import { MarketIndex, Sector, Stock } from "./types";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

// ============ Tencent API for Market Indices ============

export async function fetchMarketIndices(): Promise<MarketIndex[]> {
  const res = await fetch(
    "https://qt.gtimg.cn/q=sh000001,sz399001,sz399006",
    { headers: { "User-Agent": UA }, cache: "no-store" }
  );
  const buf = await res.arrayBuffer();
  const text = new TextDecoder("gbk").decode(buf);

  // Format: v_sh000001="1~上证指数~000001~price~prevClose~open~volume~...~change~changePct~high~low~..."
  const lines = text.split(";").filter((l) => l.includes("="));
  return lines.map((line) => {
    const parts = line.split("~");
    return {
      code: parts[2] ?? "",
      name: parts[1] ?? "",
      price: parseFloat(parts[3]) || 0,
      prevClose: parseFloat(parts[4]) || 0,
      open: parseFloat(parts[5]) || 0,
      volume: parseInt(parts[6]) || 0,
      change: parseFloat(parts[31]) || 0,
      changePercent: parseFloat(parts[32]) || 0,
      high: parseFloat(parts[33]) || 0,
      low: parseFloat(parts[34]) || 0,
      amount: parseFloat(parts[37]) * 10000 || 0, // 万元 -> 元
    };
  });
}

// ============ Sina API for Sectors ============

function parseSinaSectorResponse(text: string): Sector[] {
  const match = text.match(/=\s*(\{[\s\S]*\})/);
  if (!match) return [];

  let obj: Record<string, string>;
  try {
    obj = JSON.parse(match[1]);
  } catch {
    return [];
  }

  return Object.entries(obj).map(([code, value]) => {
    const parts = value.split(",");
    return {
      code,
      name: parts[1] ?? "",
      changePercent: parseFloat(parts[5]) || 0,
      change: parseFloat(parts[4]) || 0,
      price: parseFloat(parts[3]) || 0,
      amount: parseFloat(parts[7]) || 0,
      volume: parseInt(parts[6]) || 0,
      amplitude: 0,
      turnoverRate: 0,
      leadingStock: parts[12] ?? "",
      leadingStockChange: parseFloat(parts[9]) || 0,
      mainNetInflow: 0,
      mainNetInflowPercent: 0,
    };
  });
}

export async function fetchSectors(): Promise<{
  list: Sector[];
  total: number;
}> {
  const res = await fetch(
    "https://vip.stock.finance.sina.com.cn/q/view/newSinaHy.php",
    { headers: { "User-Agent": UA }, cache: "no-store" }
  );
  const buf = await res.arrayBuffer();
  const text = new TextDecoder("gbk").decode(buf);

  const list = parseSinaSectorResponse(text);
  list.sort((a, b) => b.changePercent - a.changePercent);

  return { list, total: list.length };
}

export async function fetchConceptSectors(): Promise<{
  list: Sector[];
  total: number;
}> {
  const res = await fetch(
    "https://vip.stock.finance.sina.com.cn/q/view/newFLJK.php?param=class",
    { headers: { "User-Agent": UA }, cache: "no-store" }
  );
  const buf = await res.arrayBuffer();
  const text = new TextDecoder("gbk").decode(buf);

  const list = parseSinaSectorResponse(text);
  list.sort((a, b) => b.changePercent - a.changePercent);

  return { list, total: list.length };
}

// ============ Sina API for Sector Stocks ============

interface SinaStockItem {
  symbol: string;
  code: string;
  name: string;
  trade: string;
  pricechange: number;
  changepercent: number;
  settlement: string;
  open: string;
  high: string;
  low: string;
  volume: number;
  amount: number;
  mktcap: number;
  nmc: number;
  turnoverratio: number;
  per: number;
  pb: number;
}

export async function fetchSectorStocks(
  sectorCode: string,
  page: number = 1,
  pageSize: number = 50
): Promise<{ list: Stock[]; total: number }> {
  const url = `https://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/Market_Center.getHQNodeData?page=${page}&num=${pageSize}&sort=changepercent&asc=0&node=${sectorCode}`;

  const res = await fetch(url, {
    headers: { "User-Agent": UA },
    cache: "no-store",
  });
  const items: SinaStockItem[] = await res.json();

  if (!Array.isArray(items)) return { list: [], total: 0 };

  const list: Stock[] = items.map((item) => ({
    code: item.code,
    name: item.name,
    price: parseFloat(item.trade) || 0,
    changePercent: item.changepercent || 0,
    change: item.pricechange || 0,
    volume: item.volume || 0,
    amount: item.amount || 0,
    amplitude: 0,
    turnoverRate: item.turnoverratio || 0,
    volumeRatio: 0,
    high: parseFloat(item.high) || 0,
    low: parseFloat(item.low) || 0,
    open: parseFloat(item.open) || 0,
    prevClose: parseFloat(item.settlement) || 0,
    totalMarketCap: (item.mktcap || 0) * 10000, // 万元 -> 元
  }));

  // Sina doesn't return total count directly; estimate from full page
  const total = items.length < pageSize ? (page - 1) * pageSize + items.length : page * pageSize + 1;

  return { list, total };
}
