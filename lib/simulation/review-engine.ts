import {
  DailyReview,
  TradeReview,
  MarketContext,
  StrategyOptimization,
} from "./review-types";
import { TradeRecord, Portfolio, SimConfig } from "./types";
import { readTrades } from "./storage";
import { readPortfolio } from "./storage";
import { fetchCurrentPrices, StockPrice } from "./price";
import { fetchMarketIndices } from "../stock-api";
import { listSnapshots, readSnapshot } from "./storage";
import { readConfig } from "./config-storage";

// ============ Market Context Analysis ============

async function analyzeMarket(): Promise<MarketContext> {
  try {
    const indices = await fetchMarketIndices();
    const sh = indices.find((i) => i.code === "000001");
    const sz = indices.find((i) => i.code === "399001");
    const cy = indices.find((i) => i.code === "399006");

    const shPct = sh?.changePercent ?? 0;
    const szPct = sz?.changePercent ?? 0;
    const cyPct = cy?.changePercent ?? 0;
    const avg = (shPct + szPct + cyPct) / 3;

    let marketTrend: "strong" | "weak" | "neutral" = "neutral";
    if (avg > 0.5) marketTrend = "strong";
    else if (avg < -0.5) marketTrend = "weak";

    const parts: string[] = [];
    parts.push(
      `上证${shPct >= 0 ? "+" : ""}${shPct.toFixed(2)}%`,
      `深证${szPct >= 0 ? "+" : ""}${szPct.toFixed(2)}%`,
      `创业板${cyPct >= 0 ? "+" : ""}${cyPct.toFixed(2)}%`
    );

    if (marketTrend === "strong") {
      parts.push("市场整体偏强，适合趋势跟踪策略");
    } else if (marketTrend === "weak") {
      parts.push("市场整体偏弱，需注意控制仓位和风险");
    } else {
      parts.push("市场震荡整理，短线操作难度较大");
    }

    return {
      shIndex: shPct,
      szIndex: szPct,
      cyIndex: cyPct,
      marketTrend,
      summary: parts.join("。"),
    };
  } catch {
    return {
      shIndex: 0,
      szIndex: 0,
      cyIndex: 0,
      marketTrend: "neutral",
      summary: "大盘数据获取失败",
    };
  }
}

// ============ Trade Review Logic ============

function reviewBuyTrade(
  trade: TradeRecord,
  stockInfo: StockPrice | undefined,
  market: MarketContext,
  config: SimConfig
): TradeReview {
  const reasons: string[] = [];
  let rating: "good" | "neutral" | "bad" = "neutral";

  // 1. Score-based evaluation
  if (trade.scoreAtTime >= 40) {
    reasons.push(`买入评分${trade.scoreAtTime}分(高分)，信号较强`);
    rating = "good";
  } else if (trade.scoreAtTime >= 20) {
    reasons.push(`买入评分${trade.scoreAtTime}分(中等)，信号一般`);
  } else {
    reasons.push(`买入评分仅${trade.scoreAtTime}分(偏低)，信号较弱`);
    rating = "bad";
  }

  // 2. Market alignment
  if (market.marketTrend === "weak") {
    reasons.push("当日大盘偏弱，逆势买入风险较高");
    if (rating === "good") rating = "neutral";
    if (rating === "neutral") rating = "bad";
  } else if (market.marketTrend === "strong") {
    reasons.push("大盘走强，顺势买入合理");
  }

  // 3. Price vs day range (if available)
  if (stockInfo && stockInfo.prevClose > 0) {
    const changePct =
      ((trade.price - stockInfo.prevClose) / stockInfo.prevClose) * 100;
    if (changePct > 5) {
      reasons.push(
        `买入价已较昨收涨${changePct.toFixed(1)}%，追高风险较大`
      );
      if (rating !== "bad") rating = "neutral";
    } else if (changePct < -2) {
      reasons.push(
        `买入价较昨收跌${Math.abs(changePct).toFixed(1)}%，低位建仓合理`
      );
      if (rating !== "bad") rating = "good";
    }
  }

  // 4. Position cost
  const positionCost = trade.amount + trade.commission;
  const portfolioPct = (positionCost / config.INITIAL_CAPITAL) * 100;
  if (portfolioPct > 15) {
    reasons.push(
      `单笔仓位占总资金${portfolioPct.toFixed(1)}%，仓位偏重`
    );
  }

  return {
    tradeId: trade.id,
    stockCode: trade.stockCode,
    stockName: trade.stockName,
    action: "buy",
    price: trade.price,
    shares: trade.shares,
    rating,
    reason: reasons.join("；"),
  };
}

function reviewSellTrade(
  trade: TradeRecord,
  market: MarketContext
): TradeReview {
  const reasons: string[] = [];
  let rating: "good" | "neutral" | "bad" = "neutral";
  const pnl = trade.realizedPnl ?? 0;
  const pnlPct =
    trade.amount > 0 ? (pnl / (trade.shares * trade.price)) * 100 : 0;

  const reasonLabels: Record<string, string> = {
    take_profit: "止盈",
    stop_loss: "止损",
    score_drop: "评分跌出Top20",
  };
  const sellLabel = trade.sellReason
    ? reasonLabels[trade.sellReason] ?? trade.sellReason
    : "未知";

  // 1. Sell reason evaluation
  if (trade.sellReason === "take_profit") {
    reasons.push(`触发止盈卖出，盈利${pnl.toFixed(0)}元(${pnlPct.toFixed(1)}%)，纪律执行到位`);
    rating = "good";
    if (market.marketTrend === "strong") {
      reasons.push("但大盘走强，可能错过后续涨幅，可考虑移动止盈");
    }
  } else if (trade.sellReason === "stop_loss") {
    reasons.push(`触发止损卖出，亏损${Math.abs(pnl).toFixed(0)}元(${pnlPct.toFixed(1)}%)，止损纪律执行`);
    if (market.marketTrend === "weak") {
      reasons.push("大盘偏弱环境下止损是正确决策");
      rating = "good";
    } else {
      reasons.push("需反思买入时机是否过高");
      rating = "neutral";
    }
  } else if (trade.sellReason === "score_drop") {
    reasons.push(
      `${sellLabel}卖出，${pnl >= 0 ? "盈利" : "亏损"}${Math.abs(pnl).toFixed(0)}元`
    );
    if (pnl >= 0) {
      reasons.push("评分下降但仍有盈利，卖出合理");
      rating = "good";
    } else {
      reasons.push("评分下降且亏损，说明选股信号衰减较快，需关注持仓周期");
      rating = "neutral";
    }
  }

  return {
    tradeId: trade.id,
    stockCode: trade.stockCode,
    stockName: trade.stockName,
    action: "sell",
    price: trade.price,
    shares: trade.shares,
    rating,
    reason: reasons.join("；"),
  };
}

// ============ Strategy Optimization Suggestions ============

async function generateOptimizations(
  todayTrades: TradeRecord[],
  portfolio: Portfolio,
  market: MarketContext,
  config: SimConfig
): Promise<{ summary: string; optimizations: StrategyOptimization[] }> {
  const optimizations: StrategyOptimization[] = [];
  const summaryParts: string[] = [];

  const sells = todayTrades.filter((t) => t.action === "sell");
  const buys = todayTrades.filter((t) => t.action === "buy");
  const stopLosses = sells.filter((t) => t.sellReason === "stop_loss");
  const takeProfits = sells.filter((t) => t.sellReason === "take_profit");
  const scoreDrop = sells.filter((t) => t.sellReason === "score_drop");

  // Check historical win rate from snapshots
  const allDates = await listSnapshots();
  let totalDays = allDates.length;
  let lossDays = 0;
  for (const d of allDates.slice(-10)) {
    const snap = await readSnapshot(d);
    if (snap && snap.dailyReturn < 0) lossDays++;
  }

  // 1. Too many stop losses today
  if (stopLosses.length >= 3) {
    const totalLoss = stopLosses.reduce(
      (s, t) => s + Math.abs(t.realizedPnl ?? 0),
      0
    );
    optimizations.push({
      id: `opt-stoploss-${Date.now()}`,
      title: "止损触发过于频繁",
      description: `今日${stopLosses.length}笔止损，合计亏损${totalLoss.toFixed(0)}元。可能止损阈值过紧，或买入时机偏高。建议放宽止损比例或增加入场确认条件。`,
      currentValue: `止损 -${(config.STOP_LOSS_PCT * 100).toFixed(0)}%`,
      suggestedValue: "止损 -7%",
      confirmed: null,
    });
    summaryParts.push(
      `止损频繁(${stopLosses.length}笔)，策略可能过于激进`
    );
  }

  // 2. Take profit might be too low if market is strong
  if (takeProfits.length >= 2 && market.marketTrend === "strong") {
    optimizations.push({
      id: `opt-takeprofit-${Date.now()}`,
      title: "强势行情下止盈过早",
      description: `大盘走强时触发${takeProfits.length}笔止盈。强势行情中可考虑采用移动止盈(trailing stop)或提高止盈比例，减少卖飞行为。`,
      currentValue: `止盈 +${(config.TAKE_PROFIT_PCT * 100).toFixed(0)}%`,
      suggestedValue: "止盈 +12% 或移动止盈",
      confirmed: null,
    });
    summaryParts.push("大盘强势但频繁止盈，可能卖飞");
  }

  // 3. Buying in weak market
  if (buys.length > 0 && market.marketTrend === "weak") {
    optimizations.push({
      id: `opt-marketfilter-${Date.now()}`,
      title: "弱势市场仍在买入",
      description: `大盘整体偏弱(上证${market.shIndex.toFixed(2)}%)，今日仍买入${buys.length}笔。建议增加大盘趋势过滤条件：当三大指数均线下行时降低仓位或暂停买入。`,
      currentValue: "无大盘过滤",
      suggestedValue: "大盘MA5下穿MA10时暂停买入",
      confirmed: null,
    });
    summaryParts.push("大盘走弱仍在建仓，风控需加强");
  }

  // 4. Too many positions
  if (portfolio.positions.length >= 18) {
    optimizations.push({
      id: `opt-concentration-${Date.now()}`,
      title: "持仓过于分散",
      description: `当前持仓${portfolio.positions.length}只，持仓过分散可能稀释收益。建议将Top N阈值从20降低到10-15只，集中资金到高确信度标的。`,
      currentValue: `Top ${config.TOP_N_THRESHOLD} 选股`,
      suggestedValue: "Top 12 选股",
      confirmed: null,
    });
    summaryParts.push("持仓分散，考虑集中持仓");
  }

  // 5. Consecutive loss days
  if (totalDays >= 3 && lossDays >= Math.min(totalDays, 5)) {
    optimizations.push({
      id: `opt-drawdown-${Date.now()}`,
      title: "连续亏损需降低仓位",
      description: `近${Math.min(totalDays, 10)}个交易日中有${lossDays}天亏损。建议启动风控机制：连续3日亏损时将总仓位上限从80%降至50%，待回暖后恢复。`,
      currentValue: `最大仓位 ${(config.ALLOCATION_PCT * 100).toFixed(0)}%`,
      suggestedValue: "动态仓位: 连亏降至50%",
      confirmed: null,
    });
    summaryParts.push("近期连续亏损，建议降仓避险");
  }

  // 6. Score drop sells too frequent
  if (scoreDrop.length >= 3) {
    optimizations.push({
      id: `opt-scorethreshold-${Date.now()}`,
      title: "评分换手过于频繁",
      description: `今日${scoreDrop.length}只因评分跌出Top20而卖出，频繁换股增加交易成本。建议增加评分缓冲区：排名25以外才触发卖出，避免在Top20边缘反复进出。`,
      currentValue: `排名>${config.TOP_N_THRESHOLD}则卖出`,
      suggestedValue: "排名>25则卖出(缓冲区)",
      confirmed: null,
    });
    summaryParts.push("评分换手频繁，增加交易摩擦成本");
  }

  // Default summary
  if (summaryParts.length === 0) {
    if (todayTrades.length === 0) {
      summaryParts.push("今日无交易，持仓稳定");
    } else {
      summaryParts.push("今日交易执行正常，暂无明显策略问题");
    }
    const totalPnl = sells.reduce((s, t) => s + (t.realizedPnl ?? 0), 0);
    if (totalPnl > 0) {
      summaryParts.push(`已实现盈利${totalPnl.toFixed(0)}元，策略运行良好`);
    } else if (totalPnl < 0) {
      summaryParts.push(
        `已实现亏损${Math.abs(totalPnl).toFixed(0)}元，需持续关注`
      );
    }
  }

  return {
    summary: summaryParts.join("。") + "。",
    optimizations,
  };
}

// ============ Main Review Generator ============

export async function generateDailyReview(
  tradingDate: string
): Promise<DailyReview> {
  const config = await readConfig();

  // 1. Load today's trades
  const allTrades = await readTrades();
  const todayTrades = allTrades.filter((t) => t.date === tradingDate);

  // 2. Load portfolio
  const portfolio = await readPortfolio();

  // 3. Market analysis
  const market = await analyzeMarket();

  // 4. Fetch stock info for trade review
  const tradeCodes = [...new Set(todayTrades.map((t) => t.stockCode))];
  const stockInfoMap =
    tradeCodes.length > 0
      ? await fetchCurrentPrices(tradeCodes)
      : new Map<string, StockPrice>();

  // 5. Review each trade
  const tradeReviews: TradeReview[] = todayTrades.map((trade) => {
    if (trade.action === "buy") {
      return reviewBuyTrade(trade, stockInfoMap.get(trade.stockCode), market, config);
    }
    return reviewSellTrade(trade, market);
  });

  // 6. Generate optimization suggestions
  const { summary, optimizations } = await generateOptimizations(
    todayTrades,
    portfolio ?? {
      initialCapital: config.INITIAL_CAPITAL,
      cashBalance: config.INITIAL_CAPITAL,
      totalMarketValue: 0,
      totalAssets: config.INITIAL_CAPITAL,
      totalPnl: 0,
      totalPnlPct: 0,
      positions: [],
      lastUpdated: "",
      tradingDate: "",
    },
    market,
    config
  );

  // 7. Calculate realized pnl
  const realizedPnl = todayTrades
    .filter((t) => t.action === "sell")
    .reduce((s, t) => s + (t.realizedPnl ?? 0), 0);

  return {
    date: tradingDate,
    createdAt: new Date().toISOString(),
    totalTrades: todayTrades.length,
    realizedPnl,
    cumulativeReturn: portfolio?.totalPnlPct ?? 0,
    market,
    tradeReviews,
    strategySummary: summary,
    optimizations,
  };
}
