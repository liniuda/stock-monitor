"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getMarketStatus } from "@/lib/market-hours";

export default function Header() {
  const [time, setTime] = useState("");
  const [status, setStatus] = useState({ label: "", isOpen: false });
  const pathname = usePathname();

  useEffect(() => {
    function update() {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
      setStatus(getMarketStatus());
    }
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  const navItems = [
    { href: "/", label: "首页" },
    { href: "/simulation", label: "小牛交易" },
    { href: "/strategy", label: "交易策略" },
    { href: "/review", label: "复盘日记" },
    { href: "/broker", label: "实盘账户" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-700/50 bg-slate-900/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-white">帮大牛突突量化的小牛</h1>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              status.isOpen
                ? "bg-green-500/20 text-green-400"
                : "bg-slate-600/30 text-slate-400"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                status.isOpen ? "bg-green-400 animate-pulse" : "bg-slate-500"
              }`}
            />
            {status.label}
          </span>
          <nav className="flex items-center gap-1 ml-4">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                    active
                      ? "bg-blue-600/20 text-blue-400 font-medium"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="font-mono text-sm text-slate-400">{time}</div>
      </div>
    </header>
  );
}
