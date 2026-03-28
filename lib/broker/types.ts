/** 交易权限 — 对应A股各板块 */
export type TradingPermission =
  | "sh_a"      // 上证主板 60xxxx
  | "sz_a"      // 深证主板 00xxxx
  | "chinext"   // 创业板 300xxx
  | "star"      // 科创板 688xxx
  | "bse";      // 北交所 8xxxxx / 4xxxxx

export const PERMISSION_LABELS: Record<TradingPermission, string> = {
  sh_a: "上证A股 (60xxxx)",
  sz_a: "深证A股 (00xxxx)",
  chinext: "创业板 (300xxx)",
  star: "科创板 (688xxx)",
  bse: "北交所 (8/4xxxxx)",
};

/** 券商账户 */
export interface BrokerAccount {
  id: string;
  /** 账户别名 */
  nickname: string;
  /** 券商类型 (目前只支持同花顺) */
  broker: "ths";
  /** 登录账号 */
  username: string;
  /** 密码 (本地JSON存储, 不上传) */
  password: string;
  /** 用户手动勾选的交易权限 */
  permissions: TradingPermission[];
  /** 是否启用托管给小牛 */
  delegateEnabled: boolean;
  /** 创建时间 */
  createdAt: string;
}

/** 模拟持仓 */
export interface BrokerPosition {
  stockCode: string;
  stockName: string;
  shares: number;
  availableShares: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  pnl: number;
  pnlPct: number;
}

/** 账户资产概览 */
export interface BrokerAssets {
  totalAssets: number;
  marketValue: number;
  cashBalance: number;
  todayPnl: number;
  positions: BrokerPosition[];
}

/** API 请求 / 响应 */
export interface BrokerAccountInput {
  nickname: string;
  username: string;
  password: string;
  permissions: TradingPermission[];
}
