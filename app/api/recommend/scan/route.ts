import { NextRequest, NextResponse } from "next/server";
import { startDailyScan, getScanStatus } from "@/lib/recommend/scanner";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const action = req.nextUrl.searchParams.get("action");

    // Check existing status first
    const existing = getScanStatus();

    if (action === "start") {
      // Force clear cache and start fresh
      const { clearScanCache } = await import("@/lib/recommend/scanner");
      clearScanCache();
      const status = await startDailyScan();
      return NextResponse.json({ data: status, timestamp: Date.now() });
    }

    if (!existing) {
      const status = await startDailyScan();
      return NextResponse.json({ data: status, timestamp: Date.now() });
    }

    return NextResponse.json({ data: existing, timestamp: Date.now() });
  } catch (err) {
    return NextResponse.json(
      {
        data: {
          status: "error",
          progress: 0,
          total: 0,
          results: [],
          tradingDate: "",
          errorMessage: err instanceof Error ? err.message : "扫描服务异常",
        },
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
