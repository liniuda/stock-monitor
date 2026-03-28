import { fetchMarketIndices } from "@/lib/stock-api";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const data = await fetchMarketIndices();
    return NextResponse.json({ data, timestamp: Date.now() });
  } catch (e) {
    console.error("Market API error:", e);
    return NextResponse.json(
      { error: "Failed to fetch market data", data: [], timestamp: Date.now() },
      { status: 500 }
    );
  }
}
