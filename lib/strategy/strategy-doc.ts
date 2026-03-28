import type { SimConfig } from "@/lib/simulation/types";

// ============ 类型定义 ============

export interface ConditionDoc {
  id: number;
  name: string;
  maxScore: number;
  category: "daily" | "intraday";
  formula: string;
  description: string;
  dataNeeded: string;
}

export interface IndicatorDoc {
  name: string;
  abbr: string;
  params: string;
  formula: string;
  usage: string;
}

export interface StrategyRuleDoc {
  tag: string;
  color: string;
  bgColor: string;
  conditions: string[];
  description: string;
  maxPotentialScore: number;
}

export interface TradingConfigItem {
  label: string;
  value: string;
  description: string;
}

export interface LimitRuleDoc {
  board: string;
  codePrefix: string;
  limitPct: string;
  note: string;
}

export interface SellSignalDoc {
  priority: number;
  name: string;
  condition: string;
  description: string;
}

// ============ 技术指标 ============

export const INDICATORS: IndicatorDoc[] = [
  {
    name: "移动平均线",
    abbr: "MA",
    params: "周期: 5, 10",
    formula: "MA(N) = (C1 + C2 + ... + CN) / N",
    usage: "判断短期趋势方向，收盘价站上MA5为多头信号",
  },
  {
    name: "指数移动平均",
    abbr: "EMA",
    params: "周期: 12, 26, 9",
    formula: "EMA = 前EMA × (1-k) + 当日收盘 × k, k=2/(N+1)",
    usage: "MACD计算基础，对近期价格赋予更高权重",
  },
  {
    name: "MACD",
    abbr: "MACD",
    params: "快线12, 慢线26, 信号线9",
    formula: "DIF = EMA12 - EMA26, DEA = EMA9(DIF), 柱状 = (DIF-DEA)×2",
    usage: "DIF与DEA收敛预示趋势反转，金叉/死叉判定买卖时机",
  },
  {
    name: "布林带",
    abbr: "BOLL",
    params: "周期20, 倍数2σ",
    formula: "中轨 = MA20, 上轨 = MA20+2σ, 下轨 = MA20-2σ",
    usage: "价格触及下轨视为超跌，上轨视为超买",
  },
  {
    name: "相对强弱指数",
    abbr: "RSI",
    params: "周期14, Wilder平滑",
    formula: "RSI = 100 - 100/(1 + avgGain/avgLoss)",
    usage: "RSI<30超卖区域，>70超买区域",
  },
  {
    name: "随机指标",
    abbr: "KDJ",
    params: "周期9, K/D平滑2/3",
    formula: "RSV = (C-L9)/(H9-L9)×100, K = 2/3×prevK + 1/3×RSV, D = 2/3×prevD + 1/3×K, J = 3K-2D",
    usage: "J线从超卖区(K<20或J<20)上穿K线形成金叉",
  },
];

// ============ 日线条件 (7条, 满分60分) ============

export const DAILY_CONDITIONS: ConditionDoc[] = [
  {
    id: 1,
    name: "MA5突破",
    maxScore: 10,
    category: "daily",
    formula: "前一日收盘价 > MA5",
    description: "收盘价站上5日均线，短期趋势转多",
    dataNeeded: "至少6根日K线",
  },
  {
    id: 2,
    name: "MACD收敛",
    maxScore: 12,
    category: "daily",
    formula: "DIF < DEA 且 |DIF-DEA| 连续3日缩小",
    description: "MACD快慢线差距逐步收窄，即将金叉",
    dataNeeded: "至少35根日K线",
  },
  {
    id: 3,
    name: "量能放大",
    maxScore: 10,
    category: "daily",
    formula: "前日成交量 > MA5成交量 × 130%",
    description: "成交量显著放大，资金关注度提升",
    dataNeeded: "至少6根日K线",
  },
  {
    id: 4,
    name: "BOLL下轨",
    maxScore: 8,
    category: "daily",
    formula: "前日最低价 < 布林带下轨 (MA20-2σ)",
    description: "价格触及布林带下轨，统计意义上的超跌",
    dataNeeded: "至少20根日K线",
  },
  {
    id: 5,
    name: "RSI超卖反弹",
    maxScore: 8,
    category: "daily",
    formula: "前根RSI(14) < 30 且 当前RSI > 前根RSI",
    description: "RSI从超卖区开始反弹，卖压衰竭",
    dataNeeded: "至少16根日K线",
  },
  {
    id: 8,
    name: "KDJ金叉",
    maxScore: 7,
    category: "daily",
    formula: "J线从下方穿过K线 且 处于超卖区(K<20或J<20)",
    description: "KDJ在超卖区形成金叉，底部反转信号",
    dataNeeded: "至少20根日K线",
  },
  {
    id: 9,
    name: "跳空缺口",
    maxScore: 5,
    category: "daily",
    formula: "今开 > 昨收×1.01 且 今开 > 昨高",
    description: "向上跳空高开，资金强势抢筹",
    dataNeeded: "至少2根日K线",
  },
];

// ============ 盘中条件 (4条, 满分40分) ============

export const INTRADAY_CONDITIONS: ConditionDoc[] = [
  {
    id: 6,
    name: "盘中放量",
    maxScore: 12,
    category: "intraday",
    formula: "5min收盘价 > 开盘价 且 连续2根5min成交量递增",
    description: "盘中价格站上开盘价且量能持续放大",
    dataNeeded: "至少3根5分钟K线",
  },
  {
    id: 7,
    name: "价格动量",
    maxScore: 10,
    category: "intraday",
    formula: "当前5min收盘价 >= 前一根5min收盘价",
    description: "短期价格保持上升动能",
    dataNeeded: "至少2根5分钟K线",
  },
  {
    id: 10,
    name: "5min均线金叉",
    maxScore: 10,
    category: "intraday",
    formula: "5分钟线 MA5 > MA10",
    description: "分钟级别短期均线上穿长期均线",
    dataNeeded: "至少10根5分钟K线",
  },
  {
    id: 11,
    name: "量增价涨",
    maxScore: 8,
    category: "intraday",
    formula: "最近3根5min K线收盘价连续上升 且 成交量连续上升",
    description: "量价齐升共振，买盘持续涌入",
    dataNeeded: "至少3根5分钟K线",
  },
];

// ============ 策略组合规则 (5个策略) ============

export const STRATEGY_RULES: StrategyRuleDoc[] = [
  {
    tag: "趋势跟踪",
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    conditions: [
      "路径A: MA5突破(1) + MACD收敛(2) + [5min金叉(10) 或 五分钟金叉信号]",
      "路径B: KDJ金叉(8) + 5min均线金叉(10)",
    ],
    description:
      "多技术指标共振确认上升趋势形成，适合顺势交易。需要日线和盘中信号共同验证。",
    maxPotentialScore: 32,
  },
  {
    tag: "均值回归",
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    conditions: ["BOLL下轨(4) 触发", "或 RSI超卖反弹(5) 触发"],
    description:
      "价格偏离均值过大后的回归交易。利用布林带下轨或RSI超卖信号捕捉超跌反弹机会。",
    maxPotentialScore: 16,
  },
  {
    tag: "动量策略",
    color: "text-orange-400",
    bgColor: "bg-orange-500/20",
    conditions: [
      "路径A: 价格动量(7) + MA5突破(1)",
      "路径B: 量增价涨(11) 触发",
    ],
    description:
      "追踪价格短期强势动量。当价格持续走高且技术面确认时入场。",
    maxPotentialScore: 28,
  },
  {
    tag: "量价异动",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20",
    conditions: [
      "量能放大(3) + [盘中放量(6) 或 量增价涨(11)]",
    ],
    description:
      "日线级别量能放大，叠加盘中持续放量确认。量价配合良好，资金持续流入。",
    maxPotentialScore: 30,
  },
  {
    tag: "统计套利",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/20",
    conditions: ["BOLL下轨(4) 触发 且 量能放大(3) 未触发"],
    description:
      "价格偏离均值但量能未放大，关注价差收敛。低波动环境下的均值回归套利。",
    maxPotentialScore: 8,
  },
];

// ============ 交易配置 ============

export const CAPITAL_CONFIG: TradingConfigItem[] = [
  { label: "初始资金", value: "100万", description: "模拟账户起始资金" },
  { label: "止盈线", value: "+8%", description: "持仓盈利达8%自动止盈" },
  { label: "止损线", value: "-5%", description: "持仓亏损达5%自动止损" },
  { label: "最大仓位", value: "20%", description: "单只股票最大占比" },
  { label: "最小仓位", value: "2%", description: "低于此比例不建仓" },
  { label: "配置比例", value: "80%", description: "最多投入80%资金, 留20%现金" },
  { label: "入围门槛", value: "Top 20", description: "仅持有评分前20只股票" },
];

/** Generate CAPITAL_CONFIG from live SimConfig values */
export function buildCapitalConfig(c: SimConfig): TradingConfigItem[] {
  return [
    { label: "初始资金", value: `${(c.INITIAL_CAPITAL / 10000).toFixed(0)}万`, description: "模拟账户起始资金" },
    { label: "止盈线", value: `+${(c.TAKE_PROFIT_PCT * 100).toFixed(0)}%`, description: `持仓盈利达${(c.TAKE_PROFIT_PCT * 100).toFixed(0)}%自动止盈` },
    { label: "止损线", value: `-${(c.STOP_LOSS_PCT * 100).toFixed(0)}%`, description: `持仓亏损达${(c.STOP_LOSS_PCT * 100).toFixed(0)}%自动止损` },
    { label: "最大仓位", value: `${(c.MAX_POSITION_PCT * 100).toFixed(0)}%`, description: "单只股票最大占比" },
    { label: "最小仓位", value: `${(c.MIN_POSITION_PCT * 100).toFixed(0)}%`, description: "低于此比例不建仓" },
    { label: "配置比例", value: `${(c.ALLOCATION_PCT * 100).toFixed(0)}%`, description: `最多投入${(c.ALLOCATION_PCT * 100).toFixed(0)}%资金, 留${((1 - c.ALLOCATION_PCT) * 100).toFixed(0)}%现金` },
    { label: "入围门槛", value: `Top ${c.TOP_N_THRESHOLD}`, description: `仅持有评分前${c.TOP_N_THRESHOLD}只股票` },
  ];
}

/** Generate SELL_SIGNALS from live SimConfig values */
export function buildSellSignals(c: SimConfig): SellSignalDoc[] {
  const exitThreshold = c.TOP_N_THRESHOLD + (c.SCORE_EXIT_BUFFER || 0);
  return [
    {
      priority: 1,
      name: "T+1限制",
      condition: "buyDate === todayDate",
      description: "买入当日不可卖出, 遵循A股T+1交收规则",
    },
    {
      priority: 2,
      name: "止损触发",
      condition: `currentPrice <= stopLossPrice (买入价 × ${(1 - c.STOP_LOSS_PCT).toFixed(2)})`,
      description: `亏损达${(c.STOP_LOSS_PCT * 100).toFixed(0)}%立即止损, 保护本金, 最高优先级`,
    },
    {
      priority: 3,
      name: "止盈触发",
      condition: `currentPrice >= takeProfitPrice (买入价 × ${(1 + c.TAKE_PROFIT_PCT).toFixed(2)})`,
      description: `盈利达${(c.TAKE_PROFIT_PCT * 100).toFixed(0)}%锁定利润`,
    },
    {
      priority: 4,
      name: "评分退出",
      condition: `排名跌出Top ${exitThreshold} (rank < 0 或 rank >= ${exitThreshold})`,
      description: c.SCORE_EXIT_BUFFER > 0
        ? `股票排名跌出Top ${exitThreshold} (Top ${c.TOP_N_THRESHOLD} + 缓冲${c.SCORE_EXIT_BUFFER}) 退出`
        : "股票评分下降失去竞争力, 腾出仓位给更优标的",
    },
  ];
}

/** Generate ALLOCATION_STEPS from live SimConfig values */
export function buildAllocationSteps(c: SimConfig): string[] {
  return [
    `可投资金额 = 总资产 × ${(c.ALLOCATION_PCT * 100).toFixed(0)}%`,
    "个股权重 = 个股评分 / 所有入围股评分之和",
    "目标市值 = 权重 × 可投资金额",
    `约束: 目标市值 < 总资产×${(c.MIN_POSITION_PCT * 100).toFixed(0)}% 则跳过 (仓位太小)`,
    `约束: 目标市值 > 总资产×${(c.MAX_POSITION_PCT * 100).toFixed(0)}% 则截断 (集中度限制)`,
    `买入股数向下取整到${c.LOT_SIZE}股整数倍`,
  ];
}

export const FEE_CONFIG: TradingConfigItem[] = [
  { label: "买入佣金", value: "0.03%", description: "券商佣金" },
  { label: "卖出佣金", value: "0.13%", description: "含印花税0.1% + 券商0.03%" },
  { label: "最低佣金", value: "5元", description: "单笔最低手续费" },
  { label: "交易单位", value: "100股/手", description: "买入需为整手倍数" },
];

// ============ 卖出信号优先级 ============

export const SELL_SIGNALS: SellSignalDoc[] = [
  {
    priority: 1,
    name: "T+1限制",
    condition: "buyDate === todayDate",
    description: "买入当日不可卖出, 遵循A股T+1交收规则",
  },
  {
    priority: 2,
    name: "止损触发",
    condition: "currentPrice <= stopLossPrice (买入价 × 0.95)",
    description: "亏损达5%立即止损, 保护本金, 最高优先级",
  },
  {
    priority: 3,
    name: "止盈触发",
    condition: "currentPrice >= takeProfitPrice (买入价 × 1.08)",
    description: "盈利达8%锁定利润",
  },
  {
    priority: 4,
    name: "评分退出",
    condition: "排名跌出Top 20 (rank < 0 或 rank >= 20)",
    description: "股票评分下降失去竞争力, 腾出仓位给更优标的",
  },
];

// ============ 涨跌停规则 ============

export const LIMIT_RULES: LimitRuleDoc[] = [
  { board: "科创板", codePrefix: "688xxx", limitPct: "±20%", note: "涨停不可买入, 跌停不可卖出" },
  { board: "创业板", codePrefix: "300xxx", limitPct: "±20%", note: "涨停不可买入, 跌停不可卖出" },
  { board: "ST股票", codePrefix: "名称含ST", limitPct: "±5%", note: "涨停不可买入, 跌停不可卖出" },
  { board: "主板", codePrefix: "60xxxx / 00xxxx", limitPct: "±10%", note: "涨停不可买入, 跌停不可卖出" },
];

// ============ 仓位分配说明 ============

export const ALLOCATION_STEPS = [
  "可投资金额 = 总资产 × 80%",
  "个股权重 = 个股评分 / 所有入围股评分之和",
  "目标市值 = 权重 × 可投资金额",
  "约束: 目标市值 < 总资产×2% 则跳过 (仓位太小)",
  "约束: 目标市值 > 总资产×20% 则截断 (集中度限制)",
  "买入股数向下取整到100股整数倍",
];

// ============ 高层策略占位 ============

export const TOP_LAYER_PLANNED = [
  { name: "全网新闻监控", description: "交易前后搜索财经媒体、公告、研报等全网消息" },
  { name: "概念板块成交额", description: "结合概念板块的成交额和趋势判断行业热度" },
  { name: "市场情绪指标", description: "综合大盘指数、涨跌比、资金流向等盘面指标" },
  { name: "融合评分调整", description: "将新闻情绪和板块热度融入个股日内权重得分" },
];

// ============ 计算总分 ============

export const DAILY_MAX = DAILY_CONDITIONS.reduce((s, c) => s + c.maxScore, 0); // 60
export const INTRADAY_MAX = INTRADAY_CONDITIONS.reduce((s, c) => s + c.maxScore, 0); // 40
export const TOTAL_MAX = DAILY_MAX + INTRADAY_MAX; // 100
