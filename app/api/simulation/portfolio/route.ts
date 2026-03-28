import { NextResponse } from "next/server";
import { readPortfolio, writePortfolio, initPortfolio } from "@/lib/simulation/storage";
import { updatePortfolioPrices } from "@/lib/simulation/engine";
import { fetchCurrentPrices } from "@/lib/simulation/price";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let portfolio = await readPortfolio();
    if (!portfolio) {
      portfolio = initPortfolio();
      await writePortfolio(portfolio);
    }

    // Update prices for held positions
    if (portfolio.positions.length > 0) {
      const codes = portfolio.positions.map((p) => p.stockCode);
      const priceData = await fetchCurrentPrices(codes);
      const priceMap = new Map<string, number>();
      for (const [code, { price }] of priceData) {
        priceMap.set(code, price);
      }
      portfolio = updatePortfolioPrices(portfolio, priceMap);
      await writePortfolio(portfolio);
    }

    return NextResponse.json({ data: portfolio, timestamp: Date.now() });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "读取组合失败",
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
