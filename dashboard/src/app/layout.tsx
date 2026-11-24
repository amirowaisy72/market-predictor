import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Market Predictor — Crypto Signals Dashboard",
  description:
    "Short-horizon crypto market predictions for 12 Binance coins. Predictions are probabilities, not guarantees.",
};

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-up shadow-lg shadow-accent/20 ring-1 ring-white/15">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M3 17.5 8.5 11l3.5 3L18 7.5"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M14.5 7.5H18V11"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M4 21h16" stroke="white" strokeWidth="2.2" strokeLinecap="round" opacity="0.55" />
        </svg>
      </span>
      <span className="leading-tight">
        <span className="block text-[15px] font-bold tracking-tight">Market Predictor</span>
        <span className="block text-[11px] font-medium tracking-wider text-faint uppercase">
          Crypto signals · Binance
        </span>
      </span>
    </Link>
  );
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <header className="sticky top-0 z-40 border-b border-edge-soft bg-ink/80 backdrop-blur-md">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
            <Logo />
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden items-center gap-1.5 rounded-full bg-panel px-3 py-1.5 text-xs font-medium text-muted ring-1 ring-edge sm:inline-flex">
                Horizon&nbsp;<span className="font-semibold text-foreground">60 min</span>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-up-dim px-3 py-1.5 text-xs font-semibold text-up ring-1 ring-up/25">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-up" />
                Mock data
              </span>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
        <footer className="border-t border-edge-soft">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-faint sm:flex-row sm:px-6">
            <span>Market Predictor · Part 1 dashboard (mock data)</span>
            <span>Predictions are probabilities, not guarantees.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
