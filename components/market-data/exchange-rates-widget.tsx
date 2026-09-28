"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ExchangeRateQuote } from "@/lib/market-data/exchange-rates";

type ExchangeRatesResponse = {
  rates?: ExchangeRateQuote[];
  updatedAt?: string;
};

export function ExchangeRatesWidget() {
  const [rates, setRates] = useState<ExchangeRateQuote[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRates = useCallback(async (showLoading: boolean) => {
    if (showLoading) {
      setIsLoading(true);
      setError(null);
    }
    try {
      const response = await fetch(
        `/api/market-data/exchange-rates?t=${Date.now()}`,
        {
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to load exchange rates.");
      }

      const data = (await response.json()) as ExchangeRatesResponse;
      setRates(data.rates ?? []);
      setUpdatedAt(data.updatedAt ?? null);
    } catch {
      setError("Exchange rates are unavailable.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadRates(false);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadRates]);

  const formattedUpdatedAt = useMemo(() => {
    if (!updatedAt) {
      return "Not loaded yet";
    }

    return new Intl.DateTimeFormat(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(updatedAt));
  }, [updatedAt]);

  return (
    <section className="rounded border border-zinc-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase text-zinc-500">
            Exchange rates
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Updated {formattedUpdatedAt}
          </p>
        </div>
        <button
          className="inline-flex h-9 items-center justify-center gap-2 rounded border border-zinc-300 px-3 text-sm font-medium text-zinc-800 hover:border-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isLoading}
          onClick={() => void loadRates(true)}
          type="button"
        >
          <span
            aria-hidden="true"
            className={isLoading ? "h-3 w-3 animate-spin rounded-full border-2 border-zinc-300 border-t-emerald-600" : "text-base"}
          >
            {isLoading ? "" : "↻"}
          </span>
          Refresh
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {isLoading && rates.length === 0 ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, index) => (
            <div
              className="min-h-24 animate-pulse rounded border border-zinc-200 bg-zinc-50 p-3"
              key={index}
            >
              <div className="h-4 w-20 rounded bg-zinc-200" />
              <div className="mt-5 h-5 w-28 rounded bg-zinc-200" />
              <div className="mt-3 h-3 w-16 rounded bg-zinc-200" />
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {rates.map((rate) => (
            <ExchangeRateCard key={rate.id} quote={rate} />
          ))}
        </div>
      )}
    </section>
  );
}

function ExchangeRateCard({ quote }: { quote: ExchangeRateQuote }) {
  return (
    <div className="min-h-24 rounded border border-zinc-200 bg-zinc-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-zinc-900">
          <span aria-hidden="true" className="text-base leading-none">
            {quote.baseIcon}
          </span>
          <span>{quote.base}</span>
          <span className="text-zinc-400">/</span>
          <span aria-hidden="true" className="text-base leading-none">
            {quote.quoteIcon}
          </span>
          <span>{quote.quote}</span>
        </div>
        <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
          {quote.kind}
        </span>
      </div>
      <p className="mt-4 text-lg font-semibold text-zinc-950">
        {quote.rate ? formatRate(quote.rate, quote.kind) : "Unavailable"}
      </p>
      <p className="mt-1 text-xs text-zinc-500">
        1 {quote.base} to {quote.quote}
      </p>
    </div>
  );
}

function formatRate(rate: number, kind: ExchangeRateQuote["kind"]) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: kind === "crypto" ? 2 : 4,
    minimumFractionDigits: kind === "crypto" ? 2 : 4,
  }).format(rate);
}
