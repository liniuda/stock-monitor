export interface KlineBar {
  date: string;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
}

export interface MACDResult {
  diff: number;
  dea: number;
  histogram: number;
}

export interface BollingerResult {
  upper: number;
  middle: number;
  lower: number;
}

export interface KDJResult {
  k: number;
  d: number;
  j: number;
}

export interface ConditionResult {
  id: number;
  name: string;
  passed: boolean;
  score: number;
  maxScore: number;
  detail: string;
}

export interface DailyScanResult {
  stockCode: string;
  stockName: string;
  conditions: ConditionResult[];
  dailyScore: number;
  error?: string;
}

export type StrategyTag = "趋势跟踪" | "均值回归" | "动量策略" | "量价异动" | "统计套利";

export interface FiveMinContext {
  hasGoldenCross: boolean;
  trendDirection: "up" | "down" | "flat";
}

export interface IntradayResult {
  stockCode: string;
  stockName: string;
  conditions: ConditionResult[];
  intradayScore: number;
  totalScore: number;
  dailyScore: number;
  strategyTags?: StrategyTag[];
  reason?: string;
}

export type ScanStatusType = "idle" | "scanning" | "done" | "error";

export interface ScanStatus {
  status: ScanStatusType;
  progress: number;
  total: number;
  results: DailyScanResult[];
  tradingDate: string;
  startedAt?: number;
  completedAt?: number;
  errorMessage?: string;
}
