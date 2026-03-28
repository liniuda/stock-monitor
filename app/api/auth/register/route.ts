import { NextResponse } from "next/server";
import { findUserByUsername, addUser } from "@/lib/auth/storage";
import { hashPassword } from "@/lib/auth/password";
import { signToken, authCookieOptions } from "@/lib/auth/jwt";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "用户名和密码不能为空" }, { status: 400 });
    }
    if (username.length < 2 || username.length > 20) {
      return NextResponse.json({ error: "用户名长度需要在2-20个字符之间" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "密码长度不能少于6位" }, { status: 400 });
    }

    const existing = await findUserByUsername(username);
    if (existing) {
      return NextResponse.json({ error: "用户名已存在" }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    const user = {
      id: `user-${Date.now()}`,
      username,
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    await addUser(user);

    const token = await signToken({ userId: user.id, username: user.username });
    const res = NextResponse.json({
      data: { id: user.id, username: user.username },
      timestamp: Date.now(),
    });
    res.cookies.set(authCookieOptions(token));
    return res;
  } catch (e) {
    console.error("Register error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "注册失败" },
      { status: 500 }
    );
  }
}
