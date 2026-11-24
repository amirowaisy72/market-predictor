import Link from "next/link";
import { notFound } from "next/navigation";
import {
  COINS,
  formatPrice,
  getCandles,
  getCoin,
  getRecentPredictions,
} from "@/lib/mockData";
import CandleChart from "@/components/CandleChart";
import SignalBadge from "@/components/SignalBadge";
import { CoinAvatar } from "@/components/CoinTable";

export function generateStaticParams() {
  return COINS.map((c) => ({ name: c.name.toLowerCase() }));
}

export default async function CoinPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;
  const coin = getCoin(name);
  if (!coin) notFound();

  const candles = getCandles(coin);
  const predictions = getRecentPredictions(coin);
  const accuracy = Math.round(
    (predictions.filter((p) => p.correct).length / predictions.length) * 100,
  );

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
      >
        ← All coins
      </Link>

      {/* Header */}
      <section className="flex flex-wrap items-center gap-4">
        <CoinAvatar name={coin.name} hue={coin.hue} size="lg" />
        <div className="min-w-0">
          <h1 className="flex flex-wrap items-baseline gap-x-3 text-2xl font-bold tracking-tight sm:text-3xl">
            {coin.name}
            <span className="text-sm font-medium tracking-wider text-faint uppercase">
              {coin.symbol}
            </span>
          </h1>
          <p className="mt-1 flex flex-wrap items-baseline gap-x-3">
            <span className="font-mono text-xl font-semibold tabular-nums">
              ${formatPrice(coin.price)}
            </span>
            <span
              className={`font-mono text-sm font-medium tabular-nums ${
                coin.change24h >= 0 ? "text-up" : "text-down"
              }`}
            >
              {coin.change24h >= 0 ? "+" : ""}
              {coin.change24h.toFixed(2)}% (24h)
            </span>
          </p>
        </div>
        <div className="ms-auto">
          <SignalBadge signal={coin.signal} />
        </div>
      </section>

      {/* Big Up / Down probabilities */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="rounded-2xl bg-up-dim/60 p-5 ring-1 ring-up/25 sm:p-6">
          <p className="text-[11px] font-semibold tracking-wider text-up/80 uppercase">
            ▲ Up · next 60 min
          </p>
          <p className="mt-1 text-4xl font-bold tracking-tight text-up tabular-nums sm:text-5xl">
            {coin.upPct}%
          </p>
        </div>
        <div className="rounded-2xl bg-down-dim/60 p-5 ring-1 ring-down/25 sm:p-6">
          <p className="text-[11px] font-semibold tracking-wider text-down/80 uppercase">
            ▼ Down · next 60 min
          </p>
          <p className="mt-1 text-4xl font-bold tracking-tight text-down tabular-nums sm:text-5xl">
            {coin.downPct}%
          </p>
        </div>
      </section>
      <div className="-mt-3 flex h-2 overflow-hidden rounded-full bg-down/50">
        <div className="h-full bg-up transition-all" style={{ width: `${coin.upPct}%` }} />
      </div>

      {/* Chart */}
      <section className="overflow-hidden rounded-2xl bg-panel ring-1 ring-edge-soft">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-edge-soft px-4 py-3.5 sm:px-5">
          <h2 className="text-sm font-semibold tracking-tight">Price chart · 1h candles</h2>
          <span className="text-xs text-faint">
            Confidence {coin.confidence}% · updated {coin.updated}
          </span>
        </div>
        <div className="p-2 sm:p-3">
          <CandleChart candles={candles} />
        </div>
      </section>

      {/* Recent predictions */}
      <section className="overflow-hidden rounded-2xl bg-panel ring-1 ring-edge-soft">
        <div className="flex items-center justify-between border-b border-edge-soft px-4 py-3.5 sm:px-5">
          <h2 className="text-sm font-semibold tracking-tight">Recent predictions</h2>
          <span className="text-xs text-faint">Hit rate {accuracy}% (mock)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[540px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-edge text-left text-[11px] tracking-wider text-faint uppercase">
                <th className="px-4 py-3 font-semibold sm:px-5">Time</th>
                <th className="px-4 py-3 font-semibold">Prediction</th>
                <th className="px-4 py-3 text-right font-semibold">Probability</th>
                <th className="px-4 py-3 text-right font-semibold">Actual result</th>
                <th className="px-4 py-3 text-right font-semibold sm:px-5">Correct</th>
              </tr>
            </thead>
            <tbody>
              {predictions.map((p, i) => (
                <tr
                  key={i}
                  className="border-b border-edge-soft transition-colors last:border-0 hover:bg-panel-2"
                >
                  <td className="px-4 py-3 text-muted tabular-nums sm:px-5">{p.time}</td>
                  <td className={`px-4 py-3 font-semibold ${p.prediction === "Up" ? "text-up" : "text-down"}`}>
                    {p.prediction === "Up" ? "▲ Up" : "▼ Down"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">{p.probability}%</td>
                  <td className={`px-4 py-3 text-right font-medium ${p.actual === "Up" ? "text-up" : "text-down"}`}>
                    {p.actual}
                  </td>
                  <td className="px-4 py-3 text-right sm:px-5">
                    <span className={p.correct ? "font-bold text-up" : "font-bold text-down"}>
                      {p.correct ? "✓" : "✗"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="text-center text-xs text-faint">
        Predictions are probabilities, not guarantees.
      </p>
    </div>
  );
}
