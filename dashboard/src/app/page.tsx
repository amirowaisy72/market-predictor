import { COINS } from "@/lib/mockData";
import CoinTable from "@/components/CoinTable";
import { PREDICTION_HORIZON_MINUTES } from "@/lib/config";

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: string;
}) {
  return (
    <div className="rounded-2xl bg-panel p-4 ring-1 ring-edge-soft sm:p-5">
      <p className="text-[11px] font-semibold tracking-wider text-faint uppercase">{label}</p>
      <p className={`mt-1.5 text-2xl font-bold tracking-tight tabular-nums ${accent ?? ""}`}>
        {value}
      </p>
      <p className="mt-0.5 text-xs text-muted">{sub}</p>
    </div>
  );
}

export default function Home() {
  const tradeSignals = COINS.filter((c) => c.signal !== "wait").length;
  const avgConfidence = Math.round(
    COINS.reduce((sum, c) => sum + c.confidence, 0) / COINS.length,
  );
  const bullish = COINS.filter((c) => c.upPct >= 50).length;

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Market overview
        </h1>
        <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted">
          Probability of each coin moving up or down over the next{" "}
          {PREDICTION_HORIZON_MINUTES} minutes. Select a coin for its chart and
          recent prediction history.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Coins tracked" value={String(COINS.length)} sub="Binance spot & futures" />
        <StatCard
          label="Trade signals"
          value={String(tradeSignals)}
          sub={`${COINS.length - tradeSignals} waiting for a clearer setup`}
          accent="text-up"
        />
        <StatCard
          label="Bullish lean"
          value={`${bullish} / ${COINS.length}`}
          sub="Coins with Up % above 50"
        />
        <StatCard
          label="Avg. confidence"
          value={`${avgConfidence}%`}
          sub="Across all current predictions"
          accent="text-accent"
        />
      </section>

      <section className="overflow-hidden rounded-2xl bg-panel ring-1 ring-edge-soft">
        <div className="flex items-center justify-between border-b border-edge-soft px-4 py-3.5 sm:px-5">
          <h2 className="text-sm font-semibold tracking-tight">All coins</h2>
          <span className="text-xs text-faint">Click a column to sort · click a row for detail</span>
        </div>
        <CoinTable coins={COINS} />
      </section>

      <p className="text-center text-xs text-faint">
        Predictions are probabilities, not guarantees.
      </p>
    </div>
  );
}
