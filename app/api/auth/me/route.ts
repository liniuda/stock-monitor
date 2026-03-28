import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { JWT_COOKIE_NAME } from "@/lib/auth/types";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(JWT_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  return NextResponse.json({
    data: { id: payload.userId, username: payload.username },
    timestamp: Date.now(),
  });
}
