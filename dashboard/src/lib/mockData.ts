/**
 * Mock data for the dashboard (Part 1).
 * The real prediction API will replace this module later — the shapes below
 * mirror what the API is expected to return.
 */

export type Signal = "up" | "down" | "wait";

export interface CoinPrediction {
  name: string;
  symbol: string;
  price: number;
  change24h: number; // percent
  upPct: number; // probability price goes up over the horizon, 0-100
  downPct: number; // probability price goes down, 0-100
  signal: Signal;
  confidence: number; // 0-100
  updated: string; // HH:MM
  hue: number; // avatar colour
}

export interface Candle {
  time: number; // unix seconds (UTCTimestamp for lightweight-charts)
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface PastPrediction {
  time: string;
  prediction: "Up" | "Down";
  probability: number; // 0-100
  actual: "Up" | "Down";
  correct: boolean;
}

const RAW: Array<Omit<CoinPrediction, "downPct" | "symbol" | "signal">> = [
  { name: "BTC",  price: 91240.5,  change24h: 2.84,  upPct: 68, confidence: 82, updated: "14:32", hue: 32 },
  { name: "ETH",  price: 3412.77,  change24h: 3.41,  upPct: 64, confidence: 77, updated: "14:32", hue: 228 },
  { name: "BNB",  price: 692.14,   change24h: -1.12, upPct: 44, confidence: 58, updated: "14:31", hue: 44 },
  { name: "SOL",  price: 214.36,   change24h: 5.67,  upPct: 71, confidence: 85, updated: "14:32", hue: 262 },
  { name: "XRP",  price: 2.41,     change24h: -2.35, upPct: 36, confidence: 66, updated: "14:30", hue: 210 },
  { name: "DOGE", price: 0.3184,   change24h: 1.92,  upPct: 57, confidence: 61, updated: "14:31", hue: 48 },
  { name: "ADA",  price: 0.9842,   change24h: -0.64, upPct: 49, confidence: 52, updated: "14:29", hue: 222 },
  { name: "AVAX", price: 38.74,    change24h: 4.18,  upPct: 63, confidence: 74, updated: "14:32", hue: 4 },
  { name: "LINK", price: 22.86,    change24h: -3.07, upPct: 33, confidence: 69, updated: "14:30", hue: 216 },
  { name: "LTC",  price: 104.52,   change24h: 0.87,  upPct: 54, confidence: 57, updated: "14:31", hue: 200 },
  { name: "PEPE", price: 0.00001842, change24h: 8.94, upPct: 59, confidence: 63, updated: "14:32", hue: 130 },
  { name: "SHIB", price: 0.00002187, change24h: -4.52, upPct: 39, confidence: 64, updated: "14:30", hue: 18 },
];

function toSignal(upPct: number, confidence: number): Signal {
  if (confidence < 55) return "wait";
  return upPct >= 50 ? "up" : "down";
}

export const COINS: CoinPrediction[] = RAW.map((c) => ({
  ...c,
  symbol: `${c.name}/USDT`,
  downPct: 100 - c.upPct,
  signal: toSignal(c.upPct, c.confidence),
}));

export function getCoin(name: string): CoinPrediction | undefined {
  return COINS.find((c) => c.name.toLowerCase() === name.toLowerCase());
}

/** Deterministic pseudo-random generator so mock data is stable. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFor(name: string): number {
  let s = 7;
  for (const ch of name) s = (s * 31 + ch.charCodeAt(0)) | 0;
  return s;
}

/** 120 hourly mock candles ending at the coin's current price. */
export function getCandles(coin: CoinPrediction, count = 120): Candle[] {
  const rand = mulberry32(seedFor(coin.name));
  const candles: Candle[] = [];
  // Fixed reference time so mock data is deterministic (and pre-renderable).
  const lastTime = Math.floor(Date.UTC(2026, 10, 24, 14, 0, 0) / 1000);
  let close = coin.price * (1 - coin.change24h / 100 / 4);
  for (let i = count - 1; i >= 0; i--) {
    const drift = (coin.change24h / 100 / count) * close;
    const shock = (rand() - 0.5) * 0.012 * close;
    const open = close;
    close = Math.max(open + drift + shock, coin.price * 0.000001);
    const high = Math.max(open, close) * (1 + rand() * 0.003);
    const low = Math.min(open, close) * (1 - rand() * 0.003);
    candles.push({ time: lastTime - i * 3600, open, high, low, close });
  }
  // Smoothly rescale the walk so the final candle closes at the headline
  // price (no jump / giant wick on the last candle).
  const finalClose = candles[candles.length - 1].close;
  const totalFactor = coin.price / finalClose;
  return candles.map((c, i) => {
    const f = 1 + (totalFactor - 1) * ((i + 1) / candles.length);
    return {
      time: c.time,
      open: c.open * f,
      high: c.high * f,
      low: c.low * f,
      close: c.close * f,
    };
  });
}

export function getRecentPredictions(coin: CoinPrediction): PastPrediction[] {
  const rand = mulberry32(seedFor(coin.name) + 99);
  const rows: PastPrediction[] = [];
  for (let i = 0; i < 8; i++) {
    const hour = 13 - i;
    const prediction: "Up" | "Down" = rand() > 0.45 ? "Up" : "Down";
    const probability = Math.round(52 + rand() * 38);
    const correct = rand() > 0.32;
    const actual: "Up" | "Down" = correct
      ? prediction
      : prediction === "Up"
        ? "Down"
        : "Up";
    rows.push({
      time: `${String(hour).padStart(2, "0")}:00`,
      prediction,
      probability,
      actual,
      correct,
    });
  }
  return rows;
}

export function formatPrice(price: number): string {
  if (price >= 1000)
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  if (price >= 1)
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  return price.toPrecision(4);
}
