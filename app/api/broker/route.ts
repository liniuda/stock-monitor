import { NextRequest, NextResponse } from "next/server";
import {
  readAccounts,
  addAccount,
  updateAccount,
  deleteAccount,
} from "@/lib/broker/storage";
import { fetchAccountAssets } from "@/lib/broker/mock-broker";
import type { BrokerAccount, BrokerAccountInput } from "@/lib/broker/types";

export const dynamic = "force-dynamic";

/** GET — list all accounts (optionally with mock assets) */
export async function GET(req: NextRequest) {
  try {
    const withAssets = req.nextUrl.searchParams.get("assets") === "1";
    const accounts = await readAccounts();

    if (withAssets) {
      const enriched = await Promise.all(
        accounts.map(async (acc) => {
          const assets = await fetchAccountAssets();
          return { ...acc, password: "***", assets, connected: assets !== null };
        })
      );
      return NextResponse.json({ data: enriched, timestamp: Date.now() });
    }

    // Strip passwords from response
    const safe = accounts.map((a) => ({ ...a, password: "***" }));
    return NextResponse.json({ data: safe, timestamp: Date.now() });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "读取账户失败" },
      { status: 500 }
    );
  }
}

/** POST — add / update / delete / toggle delegate */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body as { action: string };

    if (action === "add") {
      const { nickname, username, password, permissions } =
        body as { action: string } & BrokerAccountInput;

      if (!username || !password) {
        return NextResponse.json(
          { error: "用户名和密码不能为空" },
          { status: 400 }
        );
      }

      const newAccount: BrokerAccount = {
        id: `broker-${Date.now()}`,
        nickname: nickname || username,
        broker: "ths",
        username,
        password,
        permissions: permissions || ["sh_a", "sz_a"],
        delegateEnabled: false,
        createdAt: new Date().toISOString(),
      };

      const accounts = await addAccount(newAccount);
      const safe = accounts.map((a) => ({ ...a, password: "***" }));
      return NextResponse.json({
        data: safe,
        message: "账户添加成功",
        timestamp: Date.now(),
      });
    }

    if (action === "update") {
      const { id, ...patch } = body as { action: string; id: string } & Partial<BrokerAccountInput>;
      const accounts = await updateAccount(id, patch);
      const safe = accounts.map((a) => ({ ...a, password: "***" }));
      return NextResponse.json({
        data: safe,
        message: "账户更新成功",
        timestamp: Date.now(),
      });
    }

    if (action === "toggle_delegate") {
      const { id, enabled } = body as {
        action: string;
        id: string;
        enabled: boolean;
      };
      const accounts = await updateAccount(id, {
        delegateEnabled: enabled,
      });
      const safe = accounts.map((a) => ({ ...a, password: "***" }));
      return NextResponse.json({
        data: safe,
        message: enabled ? "已启用托管" : "已关闭托管",
        timestamp: Date.now(),
      });
    }

    if (action === "delete") {
      const { id } = body as { action: string; id: string };
      const accounts = await deleteAccount(id);
      const safe = accounts.map((a) => ({ ...a, password: "***" }));
      return NextResponse.json({
        data: safe,
        message: "账户已删除",
        timestamp: Date.now(),
      });
    }

    return NextResponse.json({ error: "未知操作" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "操作失败" },
      { status: 500 }
    );
  }
}
