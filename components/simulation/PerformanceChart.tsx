"use client";

import { useState } from "react";
import { DailySnapshot, SIM_CONFIG } from "@/lib/simulation/types";

interface Props {
  snapshots: DailySnapshot[];
}

export default function PerformanceChart({ snapshots }: Props) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (snapshots.length < 2) {
    return (
      <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-4">
        <h2 className="text-base font-bold text-white mb-3">收益曲线</h2>
        <div className="text-center py-8 text-slate-500 text-sm">
          至少需要2个交易日快照数据才能绘制曲线
        </div>
      </div>
    );
  }

  const baseline = SIM_CONFIG.INITIAL_CAPITAL;
  const values = snapshots.map((s) => s.totalAssets);
  const minVal = Math.min(...values, baseline) * 0.998;
  const maxVal = Math.max(...values, baseline) * 1.002;
  const range = maxVal - minVal || 1;

  const W = 800;
  const H = 200;
  const PAD_X = 0;
  const PAD_Y = 10;

  const chartW = W - PAD_X * 2;
  const chartH = H - PAD_Y * 2;

  const points = snapshots.map((s, i) => ({
    x: PAD_X + (i / (snapshots.length - 1)) * chartW,
    y: PAD_Y + (1 - (s.totalAssets - minVal) / range) * chartH,
  }));

  const baselineY = PAD_Y + (1 - (baseline - minVal) / range) * chartH;

  // Build SVG path
  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  // Area fill below/above baseline
  const areaPath =
    linePath +
    ` L ${points[points.length - 1].x} ${baselineY}` +
    ` L ${points[0].x} ${baselineY} Z`;

  const lastVal = values[values.length - 1];
  const isPositive = lastVal >= baseline;

  const hovered = hoverIdx !== null ? snapshots[hoverIdx] : null;

  return (
    <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-4">
      <h2 className="text-base font-bold text-white mb-3">
        收益曲线
        {hovered && (
          <span className="text-xs text-slate-400 font-normal ml-3">
            {hovered.date} | 总资产:{" "}
            <span className="font-mono">
              {hovered.totalAssets.toLocaleString("zh-CN", {
                maximumFractionDigits: 0,
              })}
            </span>{" "}
            | 累计:
            <span
              className={`font-mono ml-1 ${
                hovered.cumulativeReturn >= 0
                  ? "text-red-400"
                  : "text-green-400"
              }`}
            >
              {(hovered.cumulativeReturn * 100).toFixed(2)}%
            </span>
          </span>
        )}
      </h2>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        onMouseLeave={() => setHoverIdx(null)}
      >
        {/* Baseline */}
        <line
          x1={PAD_X}
          y1={baselineY}
          x2={W - PAD_X}
          y2={baselineY}
          stroke="#475569"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        {/* Area fill */}
        <path
          d={areaPath}
          fill={isPositive ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.08)"}
        />
        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={isPositive ? "#ef4444" : "#22c55e"}
          strokeWidth="2"
        />
        {/* Data points (invisible hitboxes) */}
        {points.map((p, i) => (
          <g key={i}>
            <rect
              x={
                i === 0
                  ? p.x
                  : i === points.length - 1
                    ? p.x - chartW / (snapshots.length - 1)
                    : p.x - chartW / (snapshots.length - 1) / 2
              }
              y={0}
              width={chartW / (snapshots.length - 1)}
              height={H}
              fill="transparent"
              onMouseEnter={() => setHoverIdx(i)}
            />
            {hoverIdx === i && (
              <>
                <line
                  x1={p.x}
                  y1={PAD_Y}
                  x2={p.x}
                  y2={H - PAD_Y}
                  stroke="#64748b"
                  strokeWidth="1"
                />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="3"
                  fill={isPositive ? "#ef4444" : "#22c55e"}
                />
              </>
            )}
          </g>
        ))}
      </svg>
      <div className="flex justify-between text-[10px] text-slate-600 mt-1 px-1">
        <span>{snapshots[0].date}</span>
        <span className="text-slate-500">
          基准: {baseline.toLocaleString("zh-CN")}
        </span>
        <span>{snapshots[snapshots.length - 1].date}</span>
      </div>
    </div>
  );
}
