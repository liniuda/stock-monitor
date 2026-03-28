import { NextRequest, NextResponse } from "next/server";
import { readTrades, listSnapshots, readSnapshot } from "@/lib/simulation/storage";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const type = req.nextUrl.searchParams.get("type") ?? "trades";
    const limitStr = req.nextUrl.searchParams.get("limit");
    const limit = limitStr ? parseInt(limitStr) : 50;

    if (type === "trades") {
      const trades = await readTrades();
      // Most recent first
      trades.reverse();
      const sliced = trades.slice(0, limit);
      return NextResponse.json({ data: sliced, timestamp: Date.now() });
    }

    if (type === "snapshots") {
      const dates = await listSnapshots();
      const recent = dates.slice(-limit);
      const snapshots = [];
      for (const date of recent) {
        const snap = await readSnapshot(date);
        if (snap) snapshots.push(snap);
      }
      return NextResponse.json({ data: snapshots, timestamp: Date.now() });
    }

    return NextResponse.json(
      { error: "无效的type参数", timestamp: Date.now() },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "读取历史失败",
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
