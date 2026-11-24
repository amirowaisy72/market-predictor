import type { Signal } from "@/lib/mockData";

const STYLES: Record<Signal, string> = {
  up: "bg-up-dim text-up ring-up/30",
  down: "bg-down-dim text-down ring-down/30",
  wait: "bg-white/5 text-wait ring-white/10",
};

const LABELS: Record<Signal, string> = {
  up: "Trade ⬆️",
  down: "Trade ⬇️",
  wait: "Wait",
};

export default function SignalBadge({ signal }: { signal: Signal }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ring-1 ring-inset ${STYLES[signal]}`}
    >
      {LABELS[signal]}
    </span>
  );
}
