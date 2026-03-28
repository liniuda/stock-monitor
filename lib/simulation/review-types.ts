/** 单笔交易复盘评价 */
export interface TradeReview {
  tradeId: string;
  stockCode: string;
  stockName: string;
  action: "buy" | "sell";
  price: number;
  shares: number;
  /** 合理性评级: good / neutral / bad */
  rating: "good" | "neutral" | "bad";
  /** 评价原因 */
  reason: string;
}

/** 策略优化建议 */
export interface StrategyOptimization {
  id: string;
  /** 优化点标题 */
  title: string;
  /** 详细描述 */
  description: string;
  /** 当前值 */
  currentValue: string;
  /** 建议值 */
  suggestedValue: string;
  /** 是否已确认（null=待确认, true=已采纳, false=已拒绝） */
  confirmed: boolean | null;
}

/** 大盘分析 */
export interface MarketContext {
  /** 上证涨跌幅 */
  shIndex: number;
  /** 深证涨跌幅 */
  szIndex: number;
  /** 创业板涨跌幅 */
  cyIndex: number;
  /** 整体市场判断 */
  marketTrend: "strong" | "weak" | "neutral";
  /** 大盘概述 */
  summary: string;
}

/** 每日复盘日记 */
export interface DailyReview {
  date: string;
  createdAt: string;
  /** 当日交易笔数 */
  totalTrades: number;
  /** 当日已实现盈亏 */
  realizedPnl: number;
  /** 组合总收益率 */
  cumulativeReturn: number;
  /** 大盘分析 */
  market: MarketContext;
  /** 每笔交易复盘 */
  tradeReviews: TradeReview[];
  /** 策略反思总结 */
  strategySummary: string;
  /** 优化建议列表 */
  optimizations: StrategyOptimization[];
}
