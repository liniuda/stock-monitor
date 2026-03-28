import { NextResponse } from "next/server";
import { clearCookieOptions } from "@/lib/auth/jwt";

export async function POST() {
  const res = NextResponse.json({ data: null, message: "已退出登录", timestamp: Date.now() });
  res.cookies.set(clearCookieOptions());
  return res;
}
