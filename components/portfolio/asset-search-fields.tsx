"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import type { AssetType } from "@prisma/client";
import {
  SUPPORTED_PORTFOLIO_CURRENCIES,
  isSupportedPortfolioCurrency,
} from "@/lib/portfolio/currencies";

type AssetSearchResult = {
  symbol: string;
  name: string;
  assetType: AssetType;
  currency: string;
  exchange: string | null;
  provider: string;
  providerSymbol: string;
};

const assetTypes = ["STOCK", "ETF", "CRYPTO"] as const;

export function AssetSearchFields({
  defaultAssetType = "STOCK",
  defaultSymbol = "",
  defaultName = "",
  defaultAssetCurrency = "USD",
  defaultExchange = "",
  defaultProvider = "manual",
  defaultProviderSymbol = "",
  lockedAssetType,
  exchangeOptions = [],
  onAssetCurrencyResolved,
  onExchangeChange,
  onAssetSelected,
}: {
  defaultAssetType?: AssetType;
  defaultSymbol?: string;
  defaultName?: string;
  defaultAssetCurrency?: string;
  defaultExchange?: string | null;
  defaultProvider?: string;
  defaultProviderSymbol?: string;
  lockedAssetType?: AssetType;
  exchangeOptions?: string[];
  onAssetCurrencyResolved?: (currency: string, isLocked: boolean) => void;
  onExchangeChange?: (exchange: string) => void;
  onAssetSelected?: (asset: AssetSearchResult) => void;
}) {
  const [assetType, setAssetType] = useState<AssetType>(
    lockedAssetType ?? defaultAssetType,
  );
  const [symbol, setSymbol] = useState(defaultSymbol);
  const [name, setName] = useState(defaultName);
  const [assetCurrency, setAssetCurrency] = useState(defaultAssetCurrency);
  const [isAssetCurrencyLocked, setIsAssetCurrencyLocked] = useState(
    defaultProvider !== "manual" && defaultAssetCurrency.length > 0,
  );
  const [exchange, setExchange] = useState(defaultExchange ?? "");
  const [provider, setProvider] = useState(defaultProvider);
  const [providerSymbol, setProviderSymbol] = useState(
    defaultProviderSymbol || defaultSymbol,
  );
  const [results, setResults] = useState<AssetSearchResult[]>([]);
  const [hasSymbolInteraction, setHasSymbolInteraction] = useState(false);
  const [isPending, startTransition] = useTransition();

  const canSearch = useMemo(
    () => hasSymbolInteraction && symbol.trim().length >= 2,
    [hasSymbolInteraction, symbol],
  );

  useEffect(() => {
    if (!canSearch) {
      return;
    }

    let isActive = true;
    const timeout = window.setTimeout(() => {
      startTransition(async () => {
        const params = new URLSearchParams({
          q: symbol,
          type: assetType,
        });

        try {
          const response = await fetch(`/api/assets/search?${params}`);

          if (!isActive) {
            return;
          }

          if (!response.ok) {
            setResults([]);
            return;
          }

          const data = (await response.json()) as {
            results?: AssetSearchResult[];
          };

          if (isActive) {
            setResults(data.results ?? []);
          }
        } catch {
          if (isActive) {
            setResults([]);
          }
        }
      });
    }, 250);

    return () => {
      isActive = false;
      window.clearTimeout(timeout);
    };
  }, [assetType, canSearch, symbol]);

  function handleAssetTypeChange(nextAssetType: AssetType) {
    setAssetType(nextAssetType);
    setSymbol("");
    setName("");
    setExchange("");
    onExchangeChange?.("");
    setProvider("manual");
    setProviderSymbol("");
    setResults([]);
    setHasSymbolInteraction(false);
    setIsAssetCurrencyLocked(false);
    onAssetCurrencyResolved?.(assetCurrency, false);

    if (nextAssetType === "CRYPTO") {
      setAssetCurrency("USD");
      onAssetCurrencyResolved?.("USD", false);
    }
  }

  function selectResult(result: AssetSearchResult) {
    const nextCurrency = isSupportedPortfolioCurrency(result.currency)
      ? result.currency.toUpperCase()
      : assetCurrency;
    const shouldLockCurrency = isSupportedPortfolioCurrency(result.currency);

    setSymbol(result.symbol);
    setName(result.name);
    setAssetCurrency(nextCurrency);
    setIsAssetCurrencyLocked(shouldLockCurrency);
    if (result.exchange && exchangeOptions.includes(result.exchange)) {
      setExchange(result.exchange);
      onExchangeChange?.(result.exchange);
    }
    setProvider(result.provider);
    setProviderSymbol(result.providerSymbol);
    setResults([]);
    setHasSymbolInteraction(false);
    onAssetCurrencyResolved?.(nextCurrency, shouldLockCurrency);
    onAssetSelected?.(result);
  }

  return (
    <div className="grid gap-3">
      <input name="provider" type="hidden" value={provider} />
      <input name="providerSymbol" type="hidden" value={providerSymbol} />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Type">
          {lockedAssetType ? (
            <>
              <input name="assetType" type="hidden" value={lockedAssetType} />
              <input
                className={`${inputClassName} bg-zinc-100 text-zinc-600`}
                readOnly
                value={lockedAssetType}
              />
            </>
          ) : (
            <select
              className={inputClassName}
              name="assetType"
              onChange={(event) =>
                handleAssetTypeChange(event.target.value as AssetType)
              }
              value={assetType}
            >
              {assetTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Symbol">
          <div className="relative">
            <input
              autoComplete="off"
              className={inputClassName}
              name="symbol"
              onChange={(event) => {
                const value = event.target.value.toUpperCase();
                setSymbol(value);
                setHasSymbolInteraction(true);
                setProvider("manual");
                setProviderSymbol(value);
                setIsAssetCurrencyLocked(false);
                onAssetCurrencyResolved?.(assetCurrency, false);
                if (value.trim().length < 2) {
                  setResults([]);
                }
              }}
              required
              value={symbol}
            />
            {(results.length > 0 || isPending) && (
              <div className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded border border-zinc-200 bg-white shadow-lg">
                {isPending ? (
                  <div className="px-3 py-2 text-sm text-zinc-500">
                    Searching...
                  </div>
                ) : (
                  results.map((result) => (
                    <button
                      className="grid w-full gap-0.5 px-3 py-2 text-left hover:bg-zinc-100"
                      key={`${result.provider}:${result.providerSymbol}`}
                      onClick={() => selectResult(result)}
                      type="button"
                    >
                      <span className="text-sm font-medium text-zinc-950">
                        {result.symbol} · {result.name}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {result.provider} / {result.currency}
                        {result.exchange ? ` / ${result.exchange}` : ""}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </Field>
      </div>

      <Field label="Name">
        <input
          className={inputClassName}
          name="name"
          readOnly
          required
          value={name}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Asset CCY">
          {isAssetCurrencyLocked ? (
            <input name="assetCurrency" type="hidden" value={assetCurrency} />
          ) : null}
          <select
            className={inputClassName}
            disabled={isAssetCurrencyLocked}
            name="assetCurrency"
            onChange={(event) => {
              setAssetCurrency(event.target.value);
              onAssetCurrencyResolved?.(event.target.value, false);
            }}
            required
            value={assetCurrency}
          >
            {SUPPORTED_PORTFOLIO_CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Exchange">
          <select
            className={inputClassName}
            disabled={exchangeOptions.length === 0}
            name="exchange"
            onChange={(event) => {
              setExchange(event.target.value);
              onExchangeChange?.(event.target.value);
            }}
            required
            value={exchange}
          >
            <option disabled value="">
              Select exchange
            </option>
            {exchangeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {exchangeOptions.length === 0 ? (
            <span className="text-xs font-normal text-amber-700">
              Add an exchange before adding an asset.
            </span>
          ) : null}
        </Field>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1 text-xs font-medium text-zinc-500">
      {label}
      {children}
    </label>
  );
}

const inputClassName =
  "h-9 w-full rounded border border-zinc-300 bg-white px-2 text-sm text-zinc-950 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600";
