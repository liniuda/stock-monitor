import { NextRequest, NextResponse } from "next/server";
import { generateDailyReview } from "@/lib/simulation/review-engine";
import {
  readReview,
  writeReview,
  listReviewDates,
  updateOptimizationConfirm,
} from "@/lib/simulation/review-storage";
import { applyOptimization } from "@/lib/simulation/config-storage";

export const dynamic = "force-dynamic";

function getCurrentTradingDate(): string {
  const now = new Date();
  const beijing = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const day = beijing.getUTCDay();
  if (day === 0) beijing.setUTCDate(beijing.getUTCDate() - 2);
  if (day === 6) beijing.setUTCDate(beijing.getUTCDate() - 1);
  const yyyy = beijing.getUTCFullYear();
  const mm = String(beijing.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(beijing.getUTCDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

/**
 * GET /api/simulation/review
 * ?date=20260306       → get specific date review
 * ?action=list         → list all review dates
 * ?action=generate     → generate today's review (auto or manual)
 */
export async function GET(req: NextRequest) {
  try {
    const action = req.nextUrl.searchParams.get("action");
    const date = req.nextUrl.searchParams.get("date");

    // List all review dates
    if (action === "list") {
      const dates = await listReviewDates();
      return NextResponse.json({ data: dates, timestamp: Date.now() });
    }

    // Generate review for today
    if (action === "generate") {
      const tradingDate = date || getCurrentTradingDate();
      const review = await generateDailyReview(tradingDate);
      await writeReview(review);
      return NextResponse.json({ data: review, timestamp: Date.now() });
    }

    // Get specific date review
    if (date) {
      const review = await readReview(date);
      if (!review) {
        return NextResponse.json(
          { error: "该日期无复盘记录", timestamp: Date.now() },
          { status: 404 }
        );
      }
      return NextResponse.json({ data: review, timestamp: Date.now() });
    }

    // Default: get today's review, or generate if not exists
    const tradingDate = getCurrentTradingDate();
    let review = await readReview(tradingDate);
    if (!review) {
      return NextResponse.json(
        { data: null, message: "今日复盘尚未生成", timestamp: Date.now() }
      );
    }
    return NextResponse.json({ data: review, timestamp: Date.now() });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "复盘失败", timestamp: Date.now() },
      { status: 500 }
    );
  }
}

/**
 * POST /api/simulation/review
 * Body: { action: "confirm", date, optimizationId, confirmed }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, date, optimizationId, confirmed } = body;

    if (action === "confirm" && date && optimizationId != null) {
      const review = await updateOptimizationConfirm(
        date,
        optimizationId,
        confirmed
      );
      if (!review) {
        return NextResponse.json(
          { error: "找不到对应复盘记录", timestamp: Date.now() },
          { status: 404 }
        );
      }

      // Auto-apply optimization to trading config when confirmed
      let configResult = null;
      if (confirmed === true) {
        configResult = await applyOptimization(optimizationId);
      }

      return NextResponse.json({
        data: review,
        configResult,
        timestamp: Date.now(),
      });
    }

    return NextResponse.json(
      { error: "无效请求", timestamp: Date.now() },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "操作失败", timestamp: Date.now() },
      { status: 500 }
    );
  }
}
