import { promises as fs } from "fs";
import path from "path";
import {
  Portfolio,
  TradeRecord,
  DailySnapshot,
  SimConfig,
  SIM_CONFIG,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data", "simulation");
const SNAPSHOTS_DIR = path.join(DATA_DIR, "snapshots");
const PORTFOLIO_FILE = path.join(DATA_DIR, "portfolio.json");
const TRADES_FILE = path.join(DATA_DIR, "trades.json");

export async function ensureDataDir(): Promise<void> {
  await fs.mkdir(SNAPSHOTS_DIR, { recursive: true });
}

export function initPortfolio(config: SimConfig = SIM_CONFIG): Portfolio {
  return {
    initialCapital: config.INITIAL_CAPITAL,
    cashBalance: config.INITIAL_CAPITAL,
    totalMarketValue: 0,
    totalAssets: config.INITIAL_CAPITAL,
    totalPnl: 0,
    totalPnlPct: 0,
    positions: [],
    lastUpdated: new Date().toISOString(),
    tradingDate: "",
  };
}

export async function readPortfolio(): Promise<Portfolio | null> {
  try {
    const raw = await fs.readFile(PORTFOLIO_FILE, "utf-8");
    return JSON.parse(raw) as Portfolio;
  } catch {
    return null;
  }
}

export async function writePortfolio(p: Portfolio): Promise<void> {
  await ensureDataDir();
  const tmp = PORTFOLIO_FILE + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(p, null, 2), "utf-8");
  await fs.rename(tmp, PORTFOLIO_FILE);
}

export async function readTrades(): Promise<TradeRecord[]> {
  try {
    const raw = await fs.readFile(TRADES_FILE, "utf-8");
    return JSON.parse(raw) as TradeRecord[];
  } catch {
    return [];
  }
}

export async function appendTrades(trades: TradeRecord[]): Promise<void> {
  if (trades.length === 0) return;
  await ensureDataDir();
  const existing = await readTrades();
  existing.push(...trades);
  const tmp = TRADES_FILE + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(existing, null, 2), "utf-8");
  await fs.rename(tmp, TRADES_FILE);
}

export async function readSnapshot(
  date: string
): Promise<DailySnapshot | null> {
  try {
    const file = path.join(SNAPSHOTS_DIR, `${date}.json`);
    const raw = await fs.readFile(file, "utf-8");
    return JSON.parse(raw) as DailySnapshot;
  } catch {
    return null;
  }
}

export async function writeSnapshot(s: DailySnapshot): Promise<void> {
  await ensureDataDir();
  const file = path.join(SNAPSHOTS_DIR, `${s.date}.json`);
  await fs.writeFile(file, JSON.stringify(s, null, 2), "utf-8");
}

export async function listSnapshots(): Promise<string[]> {
  try {
    await ensureDataDir();
    const files = await fs.readdir(SNAPSHOTS_DIR);
    return files
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(".json", ""))
      .sort();
  } catch {
    return [];
  }
}

export async function resetAll(): Promise<Portfolio> {
  await ensureDataDir();
  const p = initPortfolio();
  await fs.writeFile(PORTFOLIO_FILE, JSON.stringify(p, null, 2), "utf-8");
  await fs.writeFile(TRADES_FILE, "[]", "utf-8");
  // Remove all snapshot files
  try {
    const files = await fs.readdir(SNAPSHOTS_DIR);
    await Promise.all(
      files.map((f) => fs.unlink(path.join(SNAPSHOTS_DIR, f)))
    );
  } catch {
    // ignore
  }
  return p;
}
