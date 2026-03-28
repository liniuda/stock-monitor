import { fetchSectorStocks } from "@/lib/stock-api";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") ?? "50", 10);

  if (!code) {
    return NextResponse.json(
      { error: "Missing sector code", data: { list: [], total: 0 }, timestamp: Date.now() },
      { status: 400 }
    );
  }

  try {
    const data = await fetchSectorStocks(code, page, pageSize);
    return NextResponse.json({ data, timestamp: Date.now() });
  } catch (e) {
    console.error("Sector stocks API error:", e);
    return NextResponse.json(
      { error: "Failed to fetch sector stocks", data: { list: [], total: 0 }, timestamp: Date.now() },
      { status: 500 }
    );
  }
}
