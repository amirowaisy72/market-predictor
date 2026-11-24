"use client";

import { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  createChart,
  type UTCTimestamp,
} from "lightweight-charts";
import type { Candle } from "@/lib/mockData";

export default function CandleChart({ candles }: { candles: Candle[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = createChart(el, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#8494b3",
        fontFamily: "var(--font-geist-mono), monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(132, 148, 179, 0.08)" },
        horzLines: { color: "rgba(132, 148, 179, 0.08)" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: "#1c2740" },
      timeScale: { borderColor: "#1c2740", timeVisible: true },
      autoSize: true,
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#22c98d",
      downColor: "#f6465d",
      borderVisible: false,
      wickUpColor: "#22c98d",
      wickDownColor: "#f6465d",
    });
    series.setData(
      candles.map((c) => ({
        time: c.time as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      })),
    );
    chart.timeScale().fitContent();

    return () => chart.remove();
  }, [candles]);

  return <div ref={containerRef} className="h-[340px] w-full sm:h-[420px]" />;
}
