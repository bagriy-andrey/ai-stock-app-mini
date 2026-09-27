"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SUPPORTED_PORTFOLIO_CURRENCIES } from "@/lib/portfolio/currencies";

export function BaseCurrencySelect({
  baseCurrency,
  action,
}: {
  baseCurrency: string;
  action: (formData: FormData) => Promise<void>;
}) {
  const router = useRouter();
  const [selectedCurrency, setSelectedCurrency] = useState(baseCurrency);
  const [isPending, startTransition] = useTransition();

  return (
    <form>
      <label className="grid gap-1 text-xs font-medium uppercase text-zinc-500">
        Base currency
        <select
          className="h-9 rounded border border-zinc-300 bg-white px-2 text-sm font-medium text-zinc-950 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 disabled:cursor-wait disabled:bg-zinc-100"
          value={selectedCurrency}
          disabled={isPending}
          name="baseCurrency"
          onChange={(event) => {
            const nextCurrency = event.target.value;
            setSelectedCurrency(nextCurrency);
            startTransition(async () => {
              const formData = new FormData();
              formData.set("baseCurrency", nextCurrency);
              try {
                await action(formData);
                router.refresh();
              } catch {
                setSelectedCurrency(baseCurrency);
              }
            });
          }}
        >
          {SUPPORTED_PORTFOLIO_CURRENCIES.map((currency) => (
            <option key={currency} value={currency}>
              {currency}
            </option>
          ))}
        </select>
      </label>
    </form>
  );
}
