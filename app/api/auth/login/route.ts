import { NextResponse } from "next/server";
import { findUserByUsername } from "@/lib/auth/storage";
import { verifyPassword } from "@/lib/auth/password";
import { signToken, authCookieOptions } from "@/lib/auth/jwt";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "用户名和密码不能为空" }, { status: 400 });
    }

    const user = await findUserByUsername(username);
    if (!user) {
      return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "用户名或密码错误" }, { status: 401 });
    }

    const token = await signToken({ userId: user.id, username: user.username });
    const res = NextResponse.json({
      data: { id: user.id, username: user.username },
      timestamp: Date.now(),
    });
    res.cookies.set(authCookieOptions(token));
    return res;
  } catch (e) {
    console.error("Login error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "登录失败" },
      { status: 500 }
    );
  }
}
