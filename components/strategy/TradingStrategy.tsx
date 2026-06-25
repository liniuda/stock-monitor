"use client";

import { useState } from "react";
import {
  INDICATORS,
  DAILY_CONDITIONS,
  INTRADAY_CONDITIONS,
  STRATEGY_RULES,
  CAPITAL_CONFIG,
  FEE_CONFIG,
  SELL_SIGNALS,
  LIMIT_RULES,
  ALLOCATION_STEPS,
  TOP_LAYER_PLANNED,
  DAILY_MAX,
  INTRADAY_MAX,
  TOTAL_MAX,
  buildCapitalConfig,
  buildSellSignals,
  buildAllocationSteps,
  ConditionDoc,
  StrategyRuleDoc,
  TradingConfigItem,
  SellSignalDoc,
} from "@/lib/strategy/strategy-doc";
import type { SimConfig } from "@/lib/simulation/types";
import staticConfig from "../../data/simulation/config.json";

const config = staticConfig as unknown as SimConfig;

// ============ 可折叠容器 ============

function CollapsibleSection({
  title,
  badge,
  defaultOpen = true,
  children,
}: {
  title: string;
  badge?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg border border-slate-700/50 bg-slate-900/50">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-800/30 transition-colors rounded-lg"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">{title}</span>
          {badge}
        </div>
        <span className="text-slate-500 text-xs">{open ? "▼" : "▶"}</span>
      </button>
      {open && <div className="px-4 pb-4 -mt-1">{children}</div>}
    </div>
  );
}

// ============ 权重进度条 ============

function WeightBar({ score, maxScore }: { score: number; maxScore: number }) {
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
  let color = "bg-slate-600";
  if (pct > 80) color = "bg-red-500";
  else if (pct > 60) color = "bg-orange-500";
  else if (pct > 30) color = "bg-yellow-500";
  else if (pct > 0) color = "bg-blue-500";

  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-slate-500 font-mono w-8 text-right">
        {score}分
      </span>
    </div>
  );
}

// ============ 条件卡片 ============

function ConditionCard({ condition }: { condition: ConditionDoc }) {
  return (
    <div className="rounded-md bg-slate-800/40 p-3 border border-slate-700/30">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 font-mono">
            #{condition.id}
          </span>
          <span className="text-sm text-slate-200 font-medium">
            {condition.name}
          </span>
        </div>
        <WeightBar score={condition.maxScore} maxScore={12} />
      </div>
      <p className="text-xs text-slate-400 mb-1">{condition.description}</p>
      <div className="flex items-start gap-1 mt-2">
        <span className="text-[10px] text-slate-600 shrink-0">公式:</span>
        <span className="text-[10px] text-slate-500 font-mono break-all">
          {condition.formula}
        </span>
      </div>
      <div className="flex items-center gap-1 mt-1">
        <span className="text-[10px] text-slate-600">数据:</span>
        <span className="text-[10px] text-slate-500">
          {condition.dataNeeded}
        </span>
      </div>
    </div>
  );
}

// ============ 策略规则卡片 ============

function StrategyRuleCard({ rule }: { rule: StrategyRuleDoc }) {
  return (
    <div className="rounded-md bg-slate-800/40 p-3 border border-slate-700/30">
      <div className="flex items-center justify-between mb-2">
        <span
          className={`inline-block px-2 py-0.5 rounded text-xs border ${rule.bgColor} ${rule.color} border-current/30`}
        >
          {rule.tag}
        </span>
        <span className="text-[10px] text-slate-600">
          最高潜在得分: {rule.maxPotentialScore}分
        </span>
      </div>
      <div className="space-y-1 mb-2">
        {rule.conditions.map((cond, i) => (
          <div key={i} className="flex items-start gap-1.5">
            <span className="text-[10px] text-slate-600 mt-0.5 shrink-0">
              {rule.conditions.length > 1 ? (i === 0 ? "A" : "B") : ""}
            </span>
            <span className="text-xs text-slate-300 font-mono">{cond}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500 leading-relaxed">
        {rule.description}
      </p>
    </div>
  );
}

// ============ 评分总览 ============

function ScoreOverview() {
  return (
    <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-4">
      <h2 className="text-base font-bold text-white mb-3">评分体系总览</h2>
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-md bg-slate-800/40 p-3 text-center border border-slate-700/30">
          <div className="text-2xl font-bold text-white">{TOTAL_MAX}</div>
          <div className="text-[10px] text-slate-500 mt-1">总分</div>
          <div className="w-full h-1.5 bg-slate-700 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full w-full" />
          </div>
        </div>
        <div className="rounded-md bg-slate-800/40 p-3 text-center border border-slate-700/30">
          <div className="text-2xl font-bold text-amber-400">{DAILY_MAX}</div>
          <div className="text-[10px] text-slate-500 mt-1">
            日线条件 ({DAILY_CONDITIONS.length}条)
          </div>
          <div className="w-full h-1.5 bg-slate-700 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full"
              style={{ width: `${(DAILY_MAX / TOTAL_MAX) * 100}%` }}
            />
          </div>
        </div>
        <div className="rounded-md bg-slate-800/40 p-3 text-center border border-slate-700/30">
          <div className="text-2xl font-bold text-cyan-400">{INTRADAY_MAX}</div>
          <div className="text-[10px] text-slate-500 mt-1">
            盘中条件 ({INTRADAY_CONDITIONS.length}条)
          </div>
          <div className="w-full h-1.5 bg-slate-700 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-cyan-500 rounded-full"
              style={{ width: `${(INTRADAY_MAX / TOTAL_MAX) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ 技术指标面板 ============

function IndicatorPanel() {
  return (
    <div className="mb-4">
      <h4 className="text-xs font-medium text-slate-400 mb-2">
        技术指标 ({INDICATORS.length}个)
      </h4>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
        {INDICATORS.map((ind) => (
          <div
            key={ind.abbr}
            className="rounded-md bg-slate-800/60 p-2.5 border border-slate-700/20"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-blue-400">
                {ind.abbr}
              </span>
              <span className="text-xs text-slate-300">{ind.name}</span>
              <span className="text-[10px] text-slate-600 ml-auto">
                {ind.params}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono mb-1 break-all">
              {ind.formula}
            </div>
            <div className="text-[10px] text-slate-400">{ind.usage}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ 主组件 ============

export default function TradingStrategy() {
  // Use static config (bundled at build time for GitHub Pages)

  // Use dynamic config values when available, fall back to static defaults
  const capitalConfig: TradingConfigItem[] = config ? buildCapitalConfig(config) : CAPITAL_CONFIG;
  const sellSignals: SellSignalDoc[] = config ? buildSellSignals(config) : SELL_SIGNALS;
  const allocationSteps: string[] = config ? buildAllocationSteps(config) : ALLOCATION_STEPS;

  // Dynamic feature flags
  const activeFeatures: { label: string; description: string }[] = [];
  if (config?.MARKET_FILTER_ENABLED) {
    activeFeatures.push({ label: "大盘趋势过滤", description: "上证MA5 > MA10时才允许买入" });
  }
  if (config?.DYNAMIC_ALLOCATION_ENABLED) {
    activeFeatures.push({ label: "动态仓位管理", description: "连续亏损3天以上, 总仓位从80%降至50%" });
  }
  if (config && config.SCORE_EXIT_BUFFER > 0) {
    activeFeatures.push({ label: "评分退出缓冲", description: `排名跌出Top ${config.TOP_N_THRESHOLD + config.SCORE_EXIT_BUFFER}才退出 (缓冲${config.SCORE_EXIT_BUFFER}名)` });
  }

  return (
    <div className="space-y-4">
      {/* ===== 选股策略 Section ===== */}
      <div className="rounded-lg border border-blue-500/20 bg-slate-900/50 p-4">
        <h2 className="text-base font-bold text-white mb-1">选股策略</h2>
        <p className="text-xs text-slate-500 mb-4">
          三层评分架构: 底层技术指标条件 → 中层策略组合规则 → 高层市场信息融合
        </p>
      </div>

      {/* 评分总览 */}
      <ScoreOverview />

      {/* 底层策略 */}
      <CollapsibleSection
        title="底层策略"
        badge={
          <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
            技术指标 + 条件判定
          </span>
        }
      >
        <IndicatorPanel />

        {/* 日线条件 */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-medium text-amber-400">
              日线条件 ({DAILY_CONDITIONS.length}条)
            </h4>
            <span className="text-[10px] text-slate-600">
              满分 {DAILY_MAX}分
            </span>
          </div>
          <div className="space-y-2">
            {DAILY_CONDITIONS.map((c) => (
              <ConditionCard key={c.id} condition={c} />
            ))}
          </div>
        </div>

        {/* 盘中条件 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-medium text-cyan-400">
              盘中条件 ({INTRADAY_CONDITIONS.length}条)
            </h4>
            <span className="text-[10px] text-slate-600">
              满分 {INTRADAY_MAX}分
            </span>
          </div>
          <div className="space-y-2">
            {INTRADAY_CONDITIONS.map((c) => (
              <ConditionCard key={c.id} condition={c} />
            ))}
          </div>
        </div>
      </CollapsibleSection>

      {/* 中层策略 */}
      <CollapsibleSection
        title="中层策略"
        badge={
          <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
            策略组合规则 ({STRATEGY_RULES.length}种)
          </span>
        }
      >
        <p className="text-xs text-slate-500 mb-3">
          将底层条件按逻辑组合为可识别的交易策略，每只股票可同时触发多个策略标签
        </p>
        <div className="space-y-2">
          {STRATEGY_RULES.map((rule) => (
            <StrategyRuleCard key={rule.tag} rule={rule} />
          ))}
        </div>
      </CollapsibleSection>

      {/* 高层策略 (占位) */}
      <CollapsibleSection
        title="高层策略"
        badge={
          <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            开发中
          </span>
        }
      >
        <p className="text-xs text-slate-500 mb-3">
          计划在底层技术指标和中层策略组合基础上，融入全网信息和市场宏观指标，形成最终日内权重得分
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {TOP_LAYER_PLANNED.map((item) => (
            <div
              key={item.name}
              className="rounded-md bg-slate-800/30 p-3 border border-dashed border-slate-700/40"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-slate-400 font-medium">
                  {item.name}
                </span>
                <span className="text-[10px] text-slate-600 bg-slate-800/60 px-1.5 py-0.5 rounded">
                  待开发
                </span>
              </div>
              <p className="text-[10px] text-slate-500">{item.description}</p>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* ===== 交易策略 Section ===== */}
      <div className="rounded-lg border border-amber-500/20 bg-slate-900/50 p-4 mt-6">
        <h2 className="text-base font-bold text-white mb-1">交易策略</h2>
        <p className="text-xs text-slate-500">
          资金管理、买卖规则、费率结构、涨跌停限制
        </p>
      </div>

      {/* 已启用的优化功能 */}
      {activeFeatures.length > 0 && (
        <div className="rounded-lg border border-green-500/20 bg-slate-900/50 p-4">
          <h3 className="text-sm font-bold text-green-400 mb-2">
            已启用优化 ({activeFeatures.length})
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
            {activeFeatures.map((f) => (
              <div
                key={f.label}
                className="rounded-md bg-green-500/5 p-2.5 border border-green-500/20"
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                  <span className="text-xs font-medium text-green-300">
                    {f.label}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 资金管理 */}
      <CollapsibleSection title="资金管理">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {capitalConfig.map((item) => (
            <div
              key={item.label}
              className="rounded-md bg-slate-800/40 p-3 border border-slate-700/30"
            >
              <div className="text-lg font-bold text-white">{item.value}</div>
              <div className="text-xs text-slate-400 mt-0.5">{item.label}</div>
              <div className="text-[10px] text-slate-600 mt-1">
                {item.description}
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* 买卖规则 */}
      <CollapsibleSection title="买卖规则">
        {/* 卖出信号 */}
        <div className="mb-4">
          <h4 className="text-xs font-medium text-slate-400 mb-2">
            卖出信号优先级
          </h4>
          <div className="space-y-1.5">
            {sellSignals.map((sig) => (
              <div
                key={sig.priority}
                className="flex items-start gap-3 rounded-md bg-slate-800/40 p-2.5 border border-slate-700/30"
              >
                <span
                  className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    sig.priority === 1
                      ? "bg-slate-600/40 text-slate-400"
                      : sig.priority === 2
                        ? "bg-red-500/20 text-red-400"
                        : sig.priority === 3
                          ? "bg-green-500/20 text-green-400"
                          : "bg-blue-500/20 text-blue-400"
                  }`}
                >
                  {sig.priority}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-200">
                      {sig.name}
                    </span>
                    <span className="text-[10px] text-slate-600 font-mono">
                      {sig.condition}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {sig.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 仓位分配 */}
        <div>
          <h4 className="text-xs font-medium text-slate-400 mb-2">
            仓位分配逻辑 (评分加权)
          </h4>
          <div className="rounded-md bg-slate-800/40 p-3 border border-slate-700/30">
            <div className="space-y-1.5">
              {allocationSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[10px] text-slate-600 font-mono shrink-0 mt-0.5">
                    {i + 1}.
                  </span>
                  <span className="text-xs text-slate-300">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* 费率结构 */}
      <CollapsibleSection title="费率结构">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {FEE_CONFIG.map((item) => (
            <div
              key={item.label}
              className="rounded-md bg-slate-800/40 p-3 border border-slate-700/30"
            >
              <div className="text-lg font-bold text-white">{item.value}</div>
              <div className="text-xs text-slate-400 mt-0.5">{item.label}</div>
              <div className="text-[10px] text-slate-600 mt-1">
                {item.description}
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* 涨跌停规则 */}
      <CollapsibleSection title="涨跌停规则">
        <div className="rounded-md bg-slate-800/40 border border-slate-700/30 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-800/60">
                <th className="text-left px-3 py-2 text-slate-400 font-medium">
                  板块
                </th>
                <th className="text-left px-3 py-2 text-slate-400 font-medium">
                  代码特征
                </th>
                <th className="text-center px-3 py-2 text-slate-400 font-medium">
                  涨跌幅限制
                </th>
                <th className="text-left px-3 py-2 text-slate-400 font-medium">
                  交易限制
                </th>
              </tr>
            </thead>
            <tbody>
              {LIMIT_RULES.map((rule, i) => (
                <tr
                  key={rule.board}
                  className={i % 2 === 0 ? "" : "bg-slate-800/30"}
                >
                  <td className="px-3 py-2 text-slate-200">{rule.board}</td>
                  <td className="px-3 py-2 text-slate-400 font-mono">
                    {rule.codePrefix}
                  </td>
                  <td className="px-3 py-2 text-center text-amber-400 font-mono">
                    {rule.limitPct}
                  </td>
                  <td className="px-3 py-2 text-slate-500">{rule.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleSection>
    </div>
  );
}
