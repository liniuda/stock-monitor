export interface SimConfig {
  INITIAL_CAPITAL: number;
  TAKE_PROFIT_PCT: number;
  STOP_LOSS_PCT: number;
  TOP_N_THRESHOLD: number;
  MAX_POSITION_PCT: number;
  MIN_POSITION_PCT: number;
  ALLOCATION_PCT: number;
  BUY_COMMISSION: number;
  SELL_COMMISSION: number;
  MIN_COMMISSION: number;
  LOT_SIZE: number;
  // New fields for auto-applied optimizations
  MARKET_FILTER_ENABLED: boolean;
  DYNAMIC_ALLOCATION_ENABLED: boolean;
  SCORE_EXIT_BUFFER: number;
}

export const DEFAULT_CONFIG: SimConfig = {
  INITIAL_CAPITAL: 1_000_000,
  TAKE_PROFIT_PCT: 0.08,
  STOP_LOSS_PCT: 0.05,
  TOP_N_THRESHOLD: 20,
  MAX_POSITION_PCT: 0.20,
  MIN_POSITION_PCT: 0.02,
  ALLOCATION_PCT: 0.80,
  BUY_COMMISSION: 0.0003,
  SELL_COMMISSION: 0.0013,
  MIN_COMMISSION: 5,
  LOT_SIZE: 100,
  MARKET_FILTER_ENABLED: false,
  DYNAMIC_ALLOCATION_ENABLED: false,
  SCORE_EXIT_BUFFER: 0,
};

/** @deprecated Use getConfig() from config-storage.ts for dynamic config. Kept for backward compatibility. */
export const SIM_CONFIG = DEFAULT_CONFIG;

export interface Position {
  stockCode: string;
  stockName: string;
  shares: number;
  avgCost: number;
  buyDate: string;
  buyScore: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnl: number;
  unrealizedPnlPct: number;
  stopLossPrice: number;
  takeProfitPrice: number;
}

export interface Portfolio {
  initialCapital: number;
  cashBalance: number;
  totalMarketValue: number;
  totalAssets: number;
  totalPnl: number;
  totalPnlPct: number;
  positions: Position[];
  lastUpdated: string;
  tradingDate: string;
}

export interface TradeRecord {
  id: string;
  date: string;
  stockCode: string;
  stockName: string;
  action: "buy" | "sell";
  price: number;
  shares: number;
  amount: number;
  commission: number;
  netAmount: number;
  sellReason?: "take_profit" | "stop_loss" | "score_drop";
  scoreAtTime: number;
  realizedPnl?: number;
}

export interface DailySnapshot {
  date: string;
  totalAssets: number;
  cashBalance: number;
  positionCount: number;
  dailyReturn: number;
  cumulativeReturn: number;
  tradesCount: number;
}

export interface ExecutionResult {
  portfolio: Portfolio;
  newTrades: TradeRecord[];
  message: string;
}
