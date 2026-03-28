import { NextResponse } from "next/server";
import { resetAll } from "@/lib/simulation/storage";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const portfolio = await resetAll();
    return NextResponse.json({ data: portfolio, timestamp: Date.now() });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "重置失败",
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
