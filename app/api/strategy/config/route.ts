import { NextResponse } from "next/server";
import { readConfig } from "@/lib/simulation/config-storage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = await readConfig();
    return NextResponse.json({ data: config, timestamp: Date.now() });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "读取配置失败", timestamp: Date.now() },
      { status: 500 }
    );
  }
}
