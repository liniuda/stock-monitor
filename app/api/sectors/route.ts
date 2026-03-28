import { fetchSectors, fetchConceptSectors } from "@/lib/stock-api";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") ?? "industry";
  try {
    const data =
      type === "concept" ? await fetchConceptSectors() : await fetchSectors();
    return NextResponse.json({ data, timestamp: Date.now() });
  } catch (e) {
    console.error("Sectors API error:", e);
    return NextResponse.json(
      { error: "Failed to fetch sectors", data: { list: [], total: 0 }, timestamp: Date.now() },
      { status: 500 }
    );
  }
}
