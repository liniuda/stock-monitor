import { NextRequest, NextResponse } from "next/server";
import { fetchFiveMinKline } from "@/lib/recommend/kline";
import { evaluateIntradayConditions } from "@/lib/recommend/conditions";
import { getDailyScanResult } from "@/lib/recommend/scanner";
import { IntradayResult } from "@/lib/recommend/types";
import {
  analyzeFiveMin,
  deriveStockStrategies,
  buildReasonText,
} from "@/lib/recommend/strategy";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const codesParam = req.nextUrl.searchParams.get("codes");
    if (!codesParam) {
      return NextResponse.json(
        { data: [], timestamp: Date.now() },
        { status: 400 }
      );
    }

    const codes = codesParam
      .split(",")
      .filter((c) => /^\d{6}$/.test(c))
      .slice(0, 20);

    const results: IntradayResult[] = [];

    const settled = await Promise.allSettled(
      codes.map(async (code) => {
        const bars5min = await fetchFiveMinKline(code);
        const { conditions, intradayScore } =
          evaluateIntradayConditions(bars5min);
        const daily = getDailyScanResult(code);
        const dailyScore = daily?.dailyScore ?? 0;
        const stockName = daily?.stockName ?? code;

        // Strategy analysis
        const ctx = analyzeFiveMin(bars5min);
        const allConditions = [...(daily?.conditions ?? []), ...conditions];
        const strategyTags = deriveStockStrategies(allConditions, ctx);
        const reason = buildReasonText(strategyTags, allConditions, ctx);

        return {
          stockCode: code,
          stockName,
          conditions,
          intradayScore,
          dailyScore,
          totalScore: dailyScore + intradayScore,
          strategyTags,
          reason,
        } satisfies IntradayResult;
      })
    );

    for (const r of settled) {
      if (r.status === "fulfilled") {
        results.push(r.value);
      }
    }

    results.sort((a, b) => b.totalScore - a.totalScore);

    return NextResponse.json({ data: results, timestamp: Date.now() });
  } catch (err) {
    return NextResponse.json(
      {
        data: [],
        error: err instanceof Error ? err.message : "盘中检查异常",
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
