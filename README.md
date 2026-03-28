# 小牛量化 — A股智能量化交易系统

基于 Next.js 的 A 股智能量化交易系统，集成市场监控、智能选股、模拟交易、复盘优化和实盘账户管理。

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 16.1.6 | 全栈框架 (SSR + API Routes) |
| React | 19.2.3 | UI 框架 |
| TypeScript | 5.x | 类型安全 |
| Tailwind CSS | 4.x | 样式系统 |
| SWR | 2.4.1 | 数据获取与缓存 |
| 东方财富 API | - | A股行情数据源 |

## 快速开始

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 生产启动
npm start
```

访问 http://localhost:3000

## 项目结构

```
stock-monitor/
├── app/                       # 页面路由 + API 路由
│   ├── page.tsx               # 首页 (市场总览)
│   ├── simulation/page.tsx    # 小牛交易 (模拟交易)
│   ├── strategy/page.tsx      # 交易策略
│   ├── review/page.tsx        # 复盘日记
│   ├── broker/page.tsx        # 实盘账户
│   ├── sectors/[code]/page.tsx# 板块详情 (动态路由)
│   └── api/                   # 后端 API (详见下方)
│
├── components/                # React 组件
│   ├── broker/                # 实盘账户组件
│   ├── strategy/              # 交易策略组件
│   ├── Header.tsx             # 顶部导航栏
│   └── ...                    # 其他业务组件
│
├── lib/                       # 核心逻辑库
│   ├── broker/                # 券商账户管理
│   ├── recommend/             # 推荐扫描引擎
│   ├── simulation/            # 模拟交易引擎
│   ├── strategy/              # 策略文档
│   ├── stock-api.ts           # 东财行情 API (服务端)
│   ├── client-fetch.ts        # 东财行情 API (客户端 JSONP)
│   ├── hooks.ts               # SWR Hooks
│   ├── format.ts              # 数据格式化工具
│   ├── market-hours.ts        # A股交易时间判断
│   └── types.ts               # 公共类型定义
│
└── data/                      # 本地 JSON 数据存储
    ├── broker/accounts.json   # 券商账户
    └── simulation/
        ├── portfolio.json     # 持仓组合
        ├── trades.json        # 交易记录
        ├── snapshots.json     # 每日快照
        ├── config.json        # 交易配置 (动态)
        └── reviews/{date}.json# 每日复盘日记
```

## 功能模块

### 1. 市场监控 (首页)

实时展示大盘指数、行业板块涨跌、资金流向，支持点击进入板块详情查看个股。

### 2. 智能推荐 (扫描引擎)

全 A 股扫描，基于 11 项技术指标条件 (MA, MACD, BOLL, RSI, KDJ 等) 计算评分，分为日线 7 条 (满分 60) + 盘中 4 条 (满分 40)，总分 100 分排名选股。

### 3. 模拟交易 (小牛交易)

基于评分排名的自动交易引擎，包含止盈止损、评分退出、仓位管理、T+1 限制、涨跌停限制等完整 A 股交易规则。

### 4. 复盘日记

每日收盘后自动生成交易复盘，分析买卖原因，提供 6 类优化建议。点击"采纳优化"可自动更新交易引擎配置。

### 5. 交易策略

展示当前使用的选股策略和交易策略，所有配置参数从运行时配置动态读取，优化采纳后实时更新显示。

### 6. 实盘账户

支持关联同花顺账户，手动勾选交易权限 (上证/深证/创业板/科创板/北交所)，"托管小牛操作"开关。当前为待连接状态，预留 easytrader / QMT 接口。

## API 接口文档

所有接口基础路径: `http://localhost:3000`

通用响应格式:
```typescript
{
  data?: T              // 成功时返回数据
  error?: string        // 失败时返回错误信息
  message?: string      // 操作提示 (部分接口)
  timestamp: number     // 毫秒级时间戳
}
```

---

### 一、市场行情

#### 1.1 `GET /api/market` — 获取大盘指数

**请求参数:** 无

**响应字段:**
```typescript
{
  data: MarketIndex[]
  timestamp: number
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| data[].code | string | 指数代码, 如 "000001" |
| data[].name | string | 指数名称, 如 "上证指数" |
| data[].price | number | 当前点位 |
| data[].change | number | 涨跌点数 |
| data[].changePercent | number | 涨跌幅 (%) |
| data[].volume | number | 成交量 (手) |
| data[].amount | number | 成交额 (元) |
| data[].high | number | 最高价 |
| data[].low | number | 最低价 |
| data[].open | number | 开盘价 |
| data[].prevClose | number | 昨收价 |

**示例:**
```bash
curl http://localhost:3000/api/market
```
```json
{
  "data": [
    {
      "code": "000001",
      "name": "上证指数",
      "price": 3250.50,
      "change": 27.30,
      "changePercent": 0.85,
      "volume": 312500000,
      "amount": 425000000000,
      "high": 3265.10,
      "low": 3220.80,
      "open": 3223.20,
      "prevClose": 3223.20
    }
  ],
  "timestamp": 1709712000000
}
```

---

#### 1.2 `GET /api/sectors` — 获取板块列表

**请求参数:**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| type | string | 否 | "industry" | "industry" 行业板块 / "concept" 概念板块 |

**响应字段:**

| 字段 | 类型 | 说明 |
|------|------|------|
| data.list[] | Sector[] | 板块列表 |
| data.total | number | 板块总数 |
| data.list[].code | string | 板块代码 |
| data.list[].name | string | 板块名称 |
| data.list[].changePercent | number | 涨跌幅 (%) |
| data.list[].change | number | 涨跌点数 |
| data.list[].price | number | 板块指数 |
| data.list[].amount | number | 成交额 (元) |
| data.list[].volume | number | 成交量 (手) |
| data.list[].amplitude | number | 振幅 (%) |
| data.list[].turnoverRate | number | 换手率 (%) |
| data.list[].leadingStock | string | 领涨股名称 |
| data.list[].leadingStockChange | number | 领涨股涨幅 (%) |
| data.list[].mainNetInflow | number | 主力净流入 (元) |
| data.list[].mainNetInflowPercent | number | 主力净流入占比 (%) |

**示例:**
```bash
curl "http://localhost:3000/api/sectors?type=concept"
```

---

#### 1.3 `GET /api/sector-stocks` — 获取板块个股

**请求参数:**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| code | string | 是 | - | 板块代码 |
| page | number | 否 | 1 | 页码 |
| pageSize | number | 否 | 50 | 每页条数 |

**响应字段:**

| 字段 | 类型 | 说明 |
|------|------|------|
| data.list[] | Stock[] | 股票列表 |
| data.total | number | 股票总数 |
| data.list[].code | string | 股票代码, 如 "600519" |
| data.list[].name | string | 股票名称, 如 "贵州茅台" |
| data.list[].price | number | 当前价 |
| data.list[].changePercent | number | 涨跌幅 (%) |
| data.list[].change | number | 涨跌额 |
| data.list[].volume | number | 成交量 (手) |
| data.list[].amount | number | 成交额 (元) |
| data.list[].amplitude | number | 振幅 (%) |
| data.list[].turnoverRate | number | 换手率 (%) |
| data.list[].volumeRatio | number | 量比 |
| data.list[].high | number | 最高价 |
| data.list[].low | number | 最低价 |
| data.list[].open | number | 开盘价 |
| data.list[].prevClose | number | 昨收价 |
| data.list[].totalMarketCap | number | 总市值 (元) |

**示例:**
```bash
curl "http://localhost:3000/api/sector-stocks?code=BK0477&page=1&pageSize=20"
```

---

### 二、智能推荐

#### 2.1 `GET /api/recommend/scan` — 全 A 股日线扫描

**请求参数:**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| action | string | 否 | "start" 清除缓存并启动新扫描; 不传则返回当前扫描状态 |

**响应字段:**

| 字段 | 类型 | 说明 |
|------|------|------|
| data.status | string | "idle" / "scanning" / "done" / "error" |
| data.progress | number | 已扫描股票数 |
| data.total | number | 总股票数 |
| data.tradingDate | string | 交易日期 YYYYMMDD |
| data.startedAt | number? | 扫描开始时间戳 |
| data.completedAt | number? | 扫描完成时间戳 |
| data.errorMessage | string? | 错误信息 |
| data.results[] | DailyScanResult[] | 扫描结果 |
| data.results[].stockCode | string | 股票代码 |
| data.results[].stockName | string | 股票名称 |
| data.results[].dailyScore | number | 日线评分 (满分 60) |
| data.results[].error | string? | 该股票扫描错误 |
| data.results[].conditions[] | ConditionResult[] | 条件命中详情 |
| data.results[].conditions[].id | number | 条件编号 (1-11) |
| data.results[].conditions[].name | string | 条件名称 |
| data.results[].conditions[].passed | boolean | 是否命中 |
| data.results[].conditions[].score | number | 获得分数 |
| data.results[].conditions[].maxScore | number | 该条件满分 |
| data.results[].conditions[].detail | string | 触发详情说明 |

**示例:**
```bash
# 启动新扫描
curl "http://localhost:3000/api/recommend/scan?action=start"

# 查询扫描进度
curl "http://localhost:3000/api/recommend/scan"
```

---

#### 2.2 `GET /api/recommend/intraday` — 盘中实时评分

**请求参数:**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| codes | string | 是 | 逗号分隔股票代码, 最多 20 个, 如 "600519,000001,300750" |

**响应字段:**

| 字段 | 类型 | 说明 |
|------|------|------|
| data[].stockCode | string | 股票代码 |
| data[].stockName | string | 股票名称 |
| data[].dailyScore | number | 日线评分 (满分 60) |
| data[].intradayScore | number | 盘中评分 (满分 40) |
| data[].totalScore | number | 总评分 (满分 100) |
| data[].strategyTags | string[]? | 策略标签: "趋势跟踪" / "均值回归" / "动量策略" / "量价异动" / "统计套利" |
| data[].reason | string? | 推荐理由 |
| data[].conditions[] | ConditionResult[] | 盘中条件命中详情 (同上) |

**示例:**
```bash
curl "http://localhost:3000/api/recommend/intraday?codes=600519,000001,300750"
```

---

### 三、模拟交易

#### 3.1 `GET /api/simulation/portfolio` — 获取持仓组合

**请求参数:** 无 (不存在时自动初始化)

**响应字段:**

| 字段 | 类型 | 说明 |
|------|------|------|
| data.initialCapital | number | 初始资金 (默认 1000000) |
| data.cashBalance | number | 现金余额 |
| data.totalMarketValue | number | 持仓总市值 |
| data.totalAssets | number | 总资产 = 现金 + 市值 |
| data.totalPnl | number | 总盈亏金额 |
| data.totalPnlPct | number | 总收益率 (%) |
| data.lastUpdated | string | 最后更新时间 ISO 格式 |
| data.tradingDate | string | 交易日期 |
| data.positions[] | Position[] | 持仓列表 |
| data.positions[].stockCode | string | 股票代码 |
| data.positions[].stockName | string | 股票名称 |
| data.positions[].shares | number | 持仓股数 |
| data.positions[].avgCost | number | 持仓均价 |
| data.positions[].buyDate | string | 买入日期 |
| data.positions[].buyScore | number | 买入时评分 |
| data.positions[].currentPrice | number | 当前价格 |
| data.positions[].marketValue | number | 持仓市值 |
| data.positions[].unrealizedPnl | number | 浮动盈亏金额 |
| data.positions[].unrealizedPnlPct | number | 浮动盈亏比例 |
| data.positions[].stopLossPrice | number | 止损价位 |
| data.positions[].takeProfitPrice | number | 止盈价位 |

**示例:**
```bash
curl http://localhost:3000/api/simulation/portfolio
```

---

#### 3.2 `GET /api/simulation/execute` — 自动执行交易

市场开盘时间内, 扫描完成后自动触发。如果今日已执行或条件不满足, 返回 skipped。

**响应字段 (已跳过):**
```json
{
  "data": { "skipped": true, "reason": "今日已执行过交易", "tradingDate": "20260306" },
  "timestamp": 1709712000000
}
```

#### 3.3 `POST /api/simulation/execute` — 手动执行交易

**请求体:** 无

**响应字段:**

| 字段 | 类型 | 说明 |
|------|------|------|
| data.portfolio | Portfolio | 执行后的持仓组合 (字段同 3.1) |
| data.newTrades[] | TradeRecord[] | 本次新产生的交易 |
| data.message | string | 执行结果消息 |
| data.newTrades[].id | string | 交易唯一 ID |
| data.newTrades[].date | string | 交易日期 |
| data.newTrades[].stockCode | string | 股票代码 |
| data.newTrades[].stockName | string | 股票名称 |
| data.newTrades[].action | string | "buy" 买入 / "sell" 卖出 |
| data.newTrades[].price | number | 成交价格 |
| data.newTrades[].shares | number | 成交股数 |
| data.newTrades[].amount | number | 成交金额 |
| data.newTrades[].commission | number | 手续费 |
| data.newTrades[].netAmount | number | 净金额 (含手续费) |
| data.newTrades[].scoreAtTime | number | 成交时评分 |
| data.newTrades[].sellReason | string? | 卖出原因: "take_profit" / "stop_loss" / "score_drop" |
| data.newTrades[].realizedPnl | number? | 已实现盈亏 (仅卖出时) |

**示例:**
```bash
curl -X POST http://localhost:3000/api/simulation/execute
```

---

#### 3.4 `GET /api/simulation/history` — 获取历史记录

**请求参数:**

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| type | string | 否 | "trades" | "trades" 交易记录 / "snapshots" 每日快照 |
| limit | number | 否 | 50 | 返回条数 |

**响应字段 (type="trades"):**
```typescript
{ data: TradeRecord[], timestamp: number }
// TradeRecord 字段同 3.3
```

**响应字段 (type="snapshots"):**

| 字段 | 类型 | 说明 |
|------|------|------|
| data[].date | string | 日期 YYYYMMDD |
| data[].totalAssets | number | 当日总资产 |
| data[].cashBalance | number | 当日现金 |
| data[].positionCount | number | 持仓数量 |
| data[].dailyReturn | number | 当日收益率 |
| data[].cumulativeReturn | number | 累计收益率 |
| data[].tradesCount | number | 当日交易笔数 |

**示例:**
```bash
# 最近 20 条交易
curl "http://localhost:3000/api/simulation/history?type=trades&limit=20"

# 最近 30 天快照
curl "http://localhost:3000/api/simulation/history?type=snapshots&limit=30"
```

---

#### 3.5 `POST /api/simulation/reset` — 重置模拟数据

清空持仓、交易记录、快照, 恢复初始资金。

**请求体:** 无

**响应:** 返回重置后的空 Portfolio (字段同 3.1)

**示例:**
```bash
curl -X POST http://localhost:3000/api/simulation/reset
```

---

### 四、复盘日记

#### 4.1 `GET /api/simulation/review` — 获取/生成复盘

**请求参数:**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| action | string | 否 | "list" 列出所有复盘日期; "generate" 生成复盘 |
| date | string | 否 | 指定日期 YYYYMMDD, 不传则为今日 |

**响应字段 (action="list"):**
```json
{ "data": ["20260304", "20260305", "20260306"], "timestamp": 1709712000000 }
```

**响应字段 (action="generate" 或获取指定日期):**

| 字段 | 类型 | 说明 |
|------|------|------|
| data.date | string | 复盘日期 YYYYMMDD |
| data.createdAt | string | 创建时间 ISO 格式 |
| data.totalTrades | number | 当日交易总笔数 |
| data.realizedPnl | number | 当日已实现盈亏 |
| data.cumulativeReturn | number | 累计收益率 |
| data.market | MarketContext | 市场环境 |
| data.market.shIndex | number | 上证指数 |
| data.market.szIndex | number | 深证成指 |
| data.market.cyIndex | number | 创业板指 |
| data.market.marketTrend | string | "strong" / "weak" / "neutral" |
| data.market.summary | string | 市场环境描述 |
| data.tradeReviews[] | TradeReview[] | 交易逐笔点评 |
| data.tradeReviews[].tradeId | string | 关联交易 ID |
| data.tradeReviews[].stockCode | string | 股票代码 |
| data.tradeReviews[].stockName | string | 股票名称 |
| data.tradeReviews[].action | string | "buy" / "sell" |
| data.tradeReviews[].price | number | 成交价格 |
| data.tradeReviews[].shares | number | 成交股数 |
| data.tradeReviews[].rating | string | "good" 好 / "neutral" 中性 / "bad" 差 |
| data.tradeReviews[].reason | string | 点评理由 |
| data.strategySummary | string | 策略整体总结 |
| data.optimizations[] | StrategyOptimization[] | 优化建议列表 |
| data.optimizations[].id | string | 优化 ID, 如 "opt-stoploss-1709712000000" |
| data.optimizations[].title | string | 优化标题 |
| data.optimizations[].description | string | 优化描述 |
| data.optimizations[].currentValue | string | 当前配置值 (文字描述) |
| data.optimizations[].suggestedValue | string | 建议配置值 (文字描述) |
| data.optimizations[].confirmed | boolean \| null | null=待确认, true=已采纳, false=已拒绝 |

**示例:**
```bash
# 列出所有复盘日期
curl "http://localhost:3000/api/simulation/review?action=list"

# 生成今日复盘
curl "http://localhost:3000/api/simulation/review?action=generate"

# 获取指定日期复盘
curl "http://localhost:3000/api/simulation/review?date=20260306"
```

---

#### 4.2 `POST /api/simulation/review` — 确认/拒绝优化建议

确认后自动更新交易引擎配置。

**请求体:**
```json
{
  "action": "confirm",
  "date": "20260306",
  "optimizationId": "opt-stoploss-1709712000000",
  "confirmed": true
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| action | string | 是 | 固定为 "confirm" |
| date | string | 是 | 复盘日期 YYYYMMDD |
| optimizationId | string | 是 | 优化建议 ID |
| confirmed | boolean | 是 | true 采纳 / false 拒绝 |

**响应字段:**

| 字段 | 类型 | 说明 |
|------|------|------|
| data | DailyReview | 更新后的复盘数据 |
| configResult | object \| null | 配置变更结果 (仅 confirmed=true 时) |
| configResult.success | boolean | 是否成功 |
| configResult.changes | object | 变更详情, key 为配置项名, value 为 { from, to } |
| configResult.message | string | 变更描述 |

**支持的 6 种优化类型:**

| 优化 ID 前缀 | 变更配置项 | 变更内容 | 说明 |
|--------------|-----------|----------|------|
| opt-stoploss | STOP_LOSS_PCT | 0.05 → 0.07 | 止损比例从 5% 放宽到 7% |
| opt-takeprofit | TAKE_PROFIT_PCT | 0.08 → 0.12 | 止盈比例从 8% 提高到 12% |
| opt-marketfilter | MARKET_FILTER_ENABLED | false → true | 启用大盘趋势过滤 (上证 MA5>MA10 才允许买入) |
| opt-concentration | TOP_N_THRESHOLD | 20 → 12 | 持仓集中度从 Top20 缩窄到 Top12 |
| opt-drawdown | DYNAMIC_ALLOCATION_ENABLED | false → true | 连续亏损 3 天以上, 总仓位从 80% 降至 50% |
| opt-scorethreshold | SCORE_EXIT_BUFFER | 0 → 5 | 评分退出缓冲, 排名跌出 Top25 才退出 (原 Top20) |

**示例:**
```bash
# 采纳止损优化
curl -X POST http://localhost:3000/api/simulation/review \
  -H "Content-Type: application/json" \
  -d '{"action":"confirm","date":"20260306","optimizationId":"opt-stoploss-1709712000000","confirmed":true}'
```
```json
{
  "data": { "...复盘数据..." },
  "configResult": {
    "success": true,
    "changes": { "STOP_LOSS_PCT": { "from": 0.05, "to": 0.07 } },
    "message": "配置已更新: STOP_LOSS_PCT: 0.05 → 0.07"
  },
  "timestamp": 1709712000000
}
```

---

### 五、交易策略配置

#### 5.1 `GET /api/strategy/config` — 获取运行时配置

**请求参数:** 无

**响应字段:**

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| data.INITIAL_CAPITAL | number | 1000000 | 初始资金 (元) |
| data.TAKE_PROFIT_PCT | number | 0.08 | 止盈比例 (8%) |
| data.STOP_LOSS_PCT | number | 0.05 | 止损比例 (5%) |
| data.TOP_N_THRESHOLD | number | 20 | 选股 Top N |
| data.MAX_POSITION_PCT | number | 0.20 | 单股最大仓位 (20%) |
| data.MIN_POSITION_PCT | number | 0.02 | 单股最小仓位 (2%) |
| data.ALLOCATION_PCT | number | 0.80 | 总配置比例 (80%) |
| data.BUY_COMMISSION | number | 0.0003 | 买入佣金率 (0.03%) |
| data.SELL_COMMISSION | number | 0.0013 | 卖出佣金率 (0.13%, 含印花税) |
| data.MIN_COMMISSION | number | 5 | 最低佣金 (元) |
| data.LOT_SIZE | number | 100 | 交易单位 (股/手) |
| data.MARKET_FILTER_ENABLED | boolean | false | 大盘趋势过滤开关 |
| data.DYNAMIC_ALLOCATION_ENABLED | boolean | false | 动态仓位管理开关 |
| data.SCORE_EXIT_BUFFER | number | 0 | 评分退出缓冲名次 |

**示例:**
```bash
curl http://localhost:3000/api/strategy/config
```

---

### 六、实盘账户

#### 6.1 `GET /api/broker` — 获取账户列表

**请求参数:**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| assets | string | 否 | "1" 时同时返回资产信息和连接状态 |

**响应字段 (无 assets 参数):**

| 字段 | 类型 | 说明 |
|------|------|------|
| data[].id | string | 账户 ID, 如 "broker-1709712000000" |
| data[].nickname | string | 账户别名 |
| data[].broker | string | 券商类型, 固定 "ths" (同花顺) |
| data[].username | string | 登录账号 |
| data[].password | string | 固定返回 "***" (脱敏) |
| data[].permissions | string[] | 交易权限数组 |
| data[].delegateEnabled | boolean | 是否启用小牛托管 |
| data[].createdAt | string | 创建时间 ISO 格式 |

**响应字段 (assets=1, 额外字段):**

| 字段 | 类型 | 说明 |
|------|------|------|
| data[].connected | boolean | 券商是否已连接 |
| data[].assets | BrokerAssets \| null | 资产信息, 未连接时为 null |
| data[].assets.totalAssets | number | 总资产 (元) |
| data[].assets.marketValue | number | 总市值 (元) |
| data[].assets.cashBalance | number | 可用资金 (元) |
| data[].assets.todayPnl | number | 今日盈亏 (元) |
| data[].assets.positions[] | BrokerPosition[] | 持仓列表 |
| data[].assets.positions[].stockCode | string | 股票代码 |
| data[].assets.positions[].stockName | string | 股票名称 |
| data[].assets.positions[].shares | number | 持仓股数 |
| data[].assets.positions[].availableShares | number | 可卖股数 (T+1) |
| data[].assets.positions[].avgCost | number | 持仓成本价 |
| data[].assets.positions[].currentPrice | number | 当前价格 |
| data[].assets.positions[].marketValue | number | 持仓市值 |
| data[].assets.positions[].pnl | number | 盈亏金额 |
| data[].assets.positions[].pnlPct | number | 盈亏比例 (%) |

**示例:**
```bash
# 不含资产
curl http://localhost:3000/api/broker

# 含资产和连接状态
curl "http://localhost:3000/api/broker?assets=1"
```

---

#### 6.2 `POST /api/broker` — 账户管理

支持 4 种操作, 通过 `action` 字段区分。

**操作一: 添加账户 (action="add")**

```json
{
  "action": "add",
  "nickname": "我的主账户",
  "username": "138xxxx1234",
  "password": "trading_password",
  "permissions": ["sh_a", "sz_a", "chinext"]
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| action | string | 是 | "add" |
| nickname | string | 否 | 账户别名, 不填则用 username |
| username | string | 是 | 登录账号 (手机号/资金账号) |
| password | string | 是 | 交易密码 |
| permissions | string[] | 否 | 交易权限, 默认 ["sh_a", "sz_a"] |

**操作二: 更新账户 (action="update")**

```json
{
  "action": "update",
  "id": "broker-1709712000000",
  "permissions": ["sh_a", "sz_a", "chinext", "star"]
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| action | string | 是 | "update" |
| id | string | 是 | 账户 ID |
| nickname | string | 否 | 更新别名 |
| username | string | 否 | 更新账号 |
| password | string | 否 | 更新密码 |
| permissions | string[] | 否 | 更新权限 |

**操作三: 切换托管 (action="toggle_delegate")**

```json
{ "action": "toggle_delegate", "id": "broker-1709712000000", "enabled": true }
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| action | string | 是 | "toggle_delegate" |
| id | string | 是 | 账户 ID |
| enabled | boolean | 是 | true 启用托管 / false 关闭托管 |

**操作四: 删除账户 (action="delete")**

```json
{ "action": "delete", "id": "broker-1709712000000" }
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| action | string | 是 | "delete" |
| id | string | 是 | 账户 ID |

**所有操作统一响应:**
```json
{
  "data": [{ "...账户列表 (密码脱敏)..." }],
  "message": "账户添加成功",
  "timestamp": 1709712000000
}
```

**交易权限标识:**

| 标识 | 板块 | 股票代码前缀 | 涨跌幅限制 |
|------|------|-------------|-----------|
| sh_a | 上证A股 | 60xxxx | ±10% |
| sz_a | 深证A股 | 00xxxx | ±10% |
| chinext | 创业板 | 300xxx | ±20% |
| star | 科创板 | 688xxx | ±20% |
| bse | 北交所 | 8xxxxx / 4xxxxx | ±30% |

---

## 数据存储

所有数据以 JSON 格式存储在项目 `data/` 目录下，无数据库依赖。写入采用原子操作 (先写临时文件再重命名) 确保数据完整性。

## 架构说明

```
                      ┌─────────────────────┐
                      │    东方财富 API       │
                      │  (行情/K线/板块数据)   │
                      └──────────┬──────────┘
                                 │
┌──────────────┐    ┌────────────▼────────────┐    ┌──────────────┐
│   浏览器 UI   │◄──►│   Next.js (Node.js)     │◄──►│  本地 JSON    │
│  React + SWR  │    │   API Routes + SSR      │    │  data/*.json  │
└──────────────┘    └────────────┬────────────┘    └──────────────┘
                                 │
                      ┌──────────▼──────────┐
                      │   Python 服务 (规划)  │
                      │  easytrader / QMT    │
                      │  (实盘下单, 待对接)    │
                      └─────────────────────┘
```

- **前端**: React 19 + Tailwind CSS, SWR 管理数据获取和缓存
- **后端**: Next.js API Routes (Node.js), 处理行情获取、交易逻辑、数据存储
- **数据源**: 东方财富推送 API (push2.eastmoney.com)
- **实盘对接**: 预留 Python 微服务接口, 计划通过 easytrader / QMT 连接券商
