"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  formatPrice,
  type CoinPrediction,
} from "@/lib/mockData";
import SignalBadge from "@/components/SignalBadge";

type SortKey =
  | "name"
  | "price"
  | "change24h"
  | "upPct"
  | "downPct"
  | "signal"
  | "confidence"
  | "updated";

const SIGNAL_ORDER = { up: 0, wait: 1, down: 2 };

const COLUMNS: Array<{ key: SortKey; label: string; align: "left" | "right" }> = [
  { key: "name", label: "Coin", align: "left" },
  { key: "price", label: "Price", align: "right" },
  { key: "change24h", label: "24h %", align: "right" },
  { key: "upPct", label: "Up %", align: "right" },
  { key: "downPct", label: "Down %", align: "right" },
  { key: "signal", label: "Signal", align: "right" },
  { key: "confidence", label: "Confidence", align: "right" },
  { key: "updated", label: "Updated", align: "right" },
];

export function CoinAvatar({ name, hue, size = "md" }: { name: string; hue: number; size?: "md" | "lg" }) {
  const cls = size === "lg" ? "h-12 w-12 text-base" : "h-9 w-9 text-xs";
  return (
    <span
      aria-hidden
      className={`inline-flex ${cls} shrink-0 items-center justify-center rounded-full font-bold text-white ring-1 ring-white/15`}
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 72% 46%), hsl(${(hue + 40) % 360} 72% 30%))`,
      }}
    >
      {name.slice(0, 2)}
    </span>
  );
}

function ProbBar({ upPct }: { upPct: number }) {
  return (
    <span className="mt-1.5 flex h-1 w-20 overflow-hidden rounded-full bg-down/50 sm:w-24">
      <span className="h-full rounded-full bg-up" style={{ width: `${upPct}%` }} />
    </span>
  );
}

export default function CoinTable({ coins }: { coins: CoinPrediction[] }) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey>("confidence");
  const [direction, setDirection] = useState<1 | -1>(-1);

  const sorted = useMemo(() => {
    const rows = [...coins];
    rows.sort((a, b) => {
      const av = sortKey === "signal" ? SIGNAL_ORDER[a.signal] : a[sortKey];
      const bv = sortKey === "signal" ? SIGNAL_ORDER[b.signal] : b[sortKey];
      if (typeof av === "string" && typeof bv === "string")
        return av.localeCompare(bv) * direction;
      return (Number(av) - Number(bv)) * direction;
    });
    return rows;
  }, [coins, sortKey, direction]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setDirection((d) => (d === 1 ? -1 : 1));
    } else {
      setSortKey(key);
      setDirection(key === "name" || key === "updated" ? 1 : -1);
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-edge text-[11px] tracking-wider text-faint uppercase">
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 font-semibold whitespace-nowrap ${
                  col.align === "right" ? "text-right" : "text-left"
                }`}
              >
                <button
                  onClick={() => toggleSort(col.key)}
                  className={`inline-flex items-center gap-1 transition-colors hover:text-foreground ${
                    sortKey === col.key ? "text-accent" : ""
                  } ${col.align === "right" ? "flex-row-reverse" : ""}`}
                  aria-label={`Sort by ${col.label}`}
                >
                  {col.label}
                  <span className="text-[9px]">
                    {sortKey === col.key ? (direction === 1 ? "▲" : "▼") : "↕"}
                  </span>
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((coin) => (
            <tr
              key={coin.name}
              onClick={() => router.push(`/coin/${coin.name.toLowerCase()}`)}
              className="cursor-pointer border-b border-edge-soft transition-colors last:border-0 hover:bg-panel-2"
            >
              <td className="px-4 py-3.5">
                <span className="flex items-center gap-3">
                  <CoinAvatar name={coin.name} hue={coin.hue} />
                  <span>
                    <span className="block font-semibold text-foreground">{coin.name}</span>
                    <span className="block text-xs text-faint">{coin.symbol}</span>
                  </span>
                </span>
              </td>
              <td className="px-4 py-3.5 text-right font-mono font-medium tabular-nums">
                ${formatPrice(coin.price)}
              </td>
              <td
                className={`px-4 py-3.5 text-right font-mono font-medium tabular-nums ${
                  coin.change24h >= 0 ? "text-up" : "text-down"
                }`}
              >
                {coin.change24h >= 0 ? "+" : ""}
                {coin.change24h.toFixed(2)}%
              </td>
              <td className="px-4 py-3.5">
                <span className="flex flex-col items-end font-mono font-medium text-up tabular-nums">
                  {coin.upPct}%
                  <ProbBar upPct={coin.upPct} />
                </span>
              </td>
              <td className="px-4 py-3.5 text-right font-mono font-medium text-down tabular-nums">
                {coin.downPct}%
              </td>
              <td className="px-4 py-3.5 text-right">
                <SignalBadge signal={coin.signal} />
              </td>
              <td className="px-4 py-3.5">
                <span className="flex flex-col items-end gap-1.5">
                  <span className="font-mono font-medium tabular-nums">{coin.confidence}%</span>
                  <span className="h-1 w-16 overflow-hidden rounded-full bg-white/8">
                    <span
                      className="block h-full rounded-full bg-accent"
                      style={{ width: `${coin.confidence}%` }}
                    />
                  </span>
                </span>
              </td>
              <td className="px-4 py-3.5 text-right text-muted tabular-nums">{coin.updated}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
