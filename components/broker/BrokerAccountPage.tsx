"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import type {
  BrokerAccount,
  BrokerAssets,
  BrokerPosition,
  TradingPermission,
} from "@/lib/broker/types";
import { PERMISSION_LABELS } from "@/lib/broker/types";

// ---- fetcher ----

type AccountWithAssets = Omit<BrokerAccount, "password"> & {
  password: string;
  assets?: BrokerAssets | null;
  connected?: boolean;
};

const fetcher = (url: string) =>
  fetch(url)
    .then((r) => r.json())
    .then((d) => d.data as AccountWithAssets[]);

// ---- helpers ----

async function postBroker(body: Record<string, unknown>) {
  const res = await fetch("/api/broker", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

const ALL_PERMISSIONS: TradingPermission[] = [
  "sh_a",
  "sz_a",
  "chinext",
  "star",
  "bse",
];

// ============ 添加账户表单 ============

function AddAccountForm({ onDone }: { onDone: () => void }) {
  const [nickname, setNickname] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [perms, setPerms] = useState<TradingPermission[]>(["sh_a", "sz_a"]);
  const [loading, setLoading] = useState(false);

  const togglePerm = (p: TradingPermission) => {
    setPerms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const handleSubmit = async () => {
    if (!username || !password) return;
    setLoading(true);
    await postBroker({
      action: "add",
      nickname,
      username,
      password,
      permissions: perms,
    });
    setLoading(false);
    setNickname("");
    setUsername("");
    setPassword("");
    setPerms(["sh_a", "sz_a"]);
    onDone();
  };

  return (
    <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-4 space-y-3">
      <h3 className="text-sm font-bold text-white">添加同花顺账户</h3>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div>
          <label className="text-[10px] text-slate-500 block mb-1">
            账户别名
          </label>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="我的主账户"
            className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-500 block mb-1">
            登录账号
          </label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="手机号/资金账号"
            className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="text-[10px] text-slate-500 block mb-1">
            登录密码
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="交易密码"
            className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* 权限选择 */}
      <div>
        <label className="text-[10px] text-slate-500 block mb-1.5">
          交易权限 (手动勾选已开通的板块)
        </label>
        <div className="flex flex-wrap gap-2">
          {ALL_PERMISSIONS.map((p) => (
            <button
              key={p}
              onClick={() => togglePerm(p)}
              className={`px-2.5 py-1 rounded text-[11px] border transition-colors ${
                perms.includes(p)
                  ? "bg-blue-600/20 text-blue-400 border-blue-500/40"
                  : "bg-slate-800 text-slate-500 border-slate-700 hover:border-slate-600"
              }`}
            >
              {PERMISSION_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || !username || !password}
        className="px-4 py-1.5 rounded-md bg-blue-600 text-white text-xs font-medium hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "添加中..." : "添加账户"}
      </button>
    </div>
  );
}

// ============ 持仓表格 ============

function PositionTable({ positions }: { positions: BrokerPosition[] }) {
  if (positions.length === 0) {
    return (
      <div className="text-xs text-slate-600 py-3 text-center">暂无持仓</div>
    );
  }

  return (
    <div className="rounded-md bg-slate-800/40 border border-slate-700/30 overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-800/60">
            <th className="text-left px-3 py-2 text-slate-400 font-medium">
              股票
            </th>
            <th className="text-right px-3 py-2 text-slate-400 font-medium">
              持仓
            </th>
            <th className="text-right px-3 py-2 text-slate-400 font-medium">
              成本
            </th>
            <th className="text-right px-3 py-2 text-slate-400 font-medium">
              现价
            </th>
            <th className="text-right px-3 py-2 text-slate-400 font-medium">
              市值
            </th>
            <th className="text-right px-3 py-2 text-slate-400 font-medium">
              盈亏
            </th>
          </tr>
        </thead>
        <tbody>
          {positions.map((pos) => (
            <tr key={pos.stockCode} className="hover:bg-slate-800/30">
              <td className="px-3 py-2">
                <div className="text-slate-200">{pos.stockName}</div>
                <div className="text-[10px] text-slate-600 font-mono">
                  {pos.stockCode}
                </div>
              </td>
              <td className="px-3 py-2 text-right text-slate-300 font-mono">
                {pos.shares}
              </td>
              <td className="px-3 py-2 text-right text-slate-400 font-mono">
                {pos.avgCost.toFixed(2)}
              </td>
              <td className="px-3 py-2 text-right text-slate-300 font-mono">
                {pos.currentPrice.toFixed(2)}
              </td>
              <td className="px-3 py-2 text-right text-slate-300 font-mono">
                {(pos.marketValue / 10000).toFixed(2)}万
              </td>
              <td
                className={`px-3 py-2 text-right font-mono ${
                  pos.pnl >= 0 ? "text-red-400" : "text-green-400"
                }`}
              >
                {pos.pnl >= 0 ? "+" : ""}
                {pos.pnl.toFixed(0)} ({pos.pnlPct >= 0 ? "+" : ""}
                {pos.pnlPct.toFixed(2)}%)
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============ 单个账户卡片 ============

function AccountCard({
  account,
  onRefresh,
}: {
  account: AccountWithAssets;
  onRefresh: () => void;
}) {
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    await postBroker({
      action: "toggle_delegate",
      id: account.id,
      enabled: !account.delegateEnabled,
    });
    setToggling(false);
    onRefresh();
  };

  const handleDelete = async () => {
    if (!confirm("确定删除该账户?")) return;
    setDeleting(true);
    await postBroker({ action: "delete", id: account.id });
    setDeleting(false);
    onRefresh();
  };

  const assets = account.assets;
  const connected = account.connected === true && assets != null;

  return (
    <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 overflow-hidden">
      {/* header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">
                {account.nickname || account.username}
              </span>
              <span className="text-[10px] text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded">
                同花顺
              </span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded ${
                  connected
                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                }`}
              >
                {connected ? "已连接" : "待连接"}
              </span>
            </div>
            <div className="text-[10px] text-slate-600 mt-0.5">
              {account.username}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 权限标签 */}
          <div className="hidden lg:flex items-center gap-1">
            {account.permissions.map((p) => (
              <span
                key={p}
                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 border border-slate-700/50"
              >
                {PERMISSION_LABELS[p].split(" ")[0]}
              </span>
            ))}
          </div>

          {/* 托管小牛 toggle */}
          <button
            onClick={handleToggle}
            disabled={toggling}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              account.delegateEnabled
                ? "bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-600/30"
                : "bg-slate-800 text-slate-500 border border-slate-700 hover:border-slate-600"
            }`}
          >
            {toggling
              ? "..."
              : account.delegateEnabled
                ? "托管中"
                : "托管小牛操作"}
          </button>

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-2 py-1.5 rounded-md text-xs text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            {deleting ? "..." : "删除"}
          </button>
        </div>
      </div>

      {/* 资产概览 */}
      {connected && assets ? (
        <div className="px-4 pb-2">
          <div className="grid grid-cols-4 gap-3 mb-2">
            <div>
              <div className="text-[10px] text-slate-600">总资产</div>
              <div className="text-sm font-bold text-white font-mono">
                {(assets.totalAssets / 10000).toFixed(2)}万
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-600">总市值</div>
              <div className="text-sm text-slate-300 font-mono">
                {(assets.marketValue / 10000).toFixed(2)}万
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-600">可用资金</div>
              <div className="text-sm text-slate-300 font-mono">
                {(assets.cashBalance / 10000).toFixed(2)}万
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-600">今日盈亏</div>
              <div
                className={`text-sm font-mono ${
                  assets.todayPnl >= 0 ? "text-red-400" : "text-green-400"
                }`}
              >
                {assets.todayPnl >= 0 ? "+" : ""}
                {assets.todayPnl.toFixed(0)}
              </div>
            </div>
          </div>

          {/* 展开持仓 */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors mb-2"
          >
            {expanded
              ? "收起持仓 ▲"
              : `查看持仓 (${assets.positions.length}) ▼`}
          </button>

          {expanded && <PositionTable positions={assets.positions} />}
        </div>
      ) : (
        <div className="px-4 pb-4">
          <div className="rounded-md border border-dashed border-slate-700/40 bg-slate-800/20 p-4 text-center">
            <p className="text-xs text-slate-500 mb-1">券商尚未连接</p>
            <p className="text-[10px] text-slate-600">
              接入 easytrader / QMT 后将自动显示真实持仓和资产数据
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============ 主页面组件 ============

export default function BrokerAccountPage() {
  const [showForm, setShowForm] = useState(false);

  const { data: accounts, mutate } = useSWR<AccountWithAssets[]>(
    "/api/broker?assets=1",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30_000 }
  );

  const refresh = useCallback(() => {
    mutate();
  }, [mutate]);

  const list = accounts ?? [];

  // count delegate-enabled
  const delegatedCount = list.filter((a) => a.delegateEnabled).length;

  return (
    <div className="space-y-4">
      {/* 顶部概览 */}
      <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white mb-1">实盘账户</h2>
            <p className="text-xs text-slate-500">
              关联同花顺实盘账户, 托管给小牛自动交易
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] text-slate-600">已关联</div>
              <div className="text-sm font-bold text-white">{list.length}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-600">托管中</div>
              <div
                className={`text-sm font-bold ${delegatedCount > 0 ? "text-green-400" : "text-slate-500"}`}
              >
                {delegatedCount}
              </div>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs font-medium hover:bg-blue-500 transition-colors"
            >
              {showForm ? "取消" : "+ 添加账户"}
            </button>
          </div>
        </div>
      </div>

      {/* 添加表单 */}
      {showForm && (
        <AddAccountForm
          onDone={() => {
            setShowForm(false);
            refresh();
          }}
        />
      )}

      {/* 账户列表 */}
      {list.length === 0 && !showForm && (
        <div className="rounded-lg border border-dashed border-slate-700/50 bg-slate-900/30 p-8 text-center">
          <p className="text-sm text-slate-500 mb-2">暂未关联实盘账户</p>
          <p className="text-[10px] text-slate-600">
            点击上方 "添加账户" 关联你的同花顺账户
          </p>
        </div>
      )}

      {list.map((account) => (
        <AccountCard key={account.id} account={account} onRefresh={refresh} />
      ))}

      {/* 底部说明 */}
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
        <h3 className="text-xs font-bold text-amber-400 mb-1.5">
          使用说明
        </h3>
        <ul className="text-[10px] text-slate-500 space-y-1 list-disc list-inside">
          <li>
            账户信息存储在本地 JSON 文件中, 不会上传到任何服务器
          </li>
          <li>
            交易权限需手动勾选你已在券商开通的板块, 小牛会据此过滤交易标的
          </li>
          <li>
            开启 "托管小牛操作" 后, 小牛将使用现有交易策略自动下单
            (当前为模拟模式)
          </li>
          <li>
            实盘对接功能 (easytrader / QMT) 将在后续版本中实现
          </li>
        </ul>
      </div>
    </div>
  );
}
