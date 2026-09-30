import type { Asset } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { normalizeCurrency } from "@/lib/portfolio/currencies";
import { scannerThresholds } from "@/lib/scanners/thresholds";

const FMP_QUOTE_BATCH_SIZE = 50;
const COINGECKO_SPOT_BATCH_SIZE = 100;

export type ProviderPriceAsset = Pick<
  Asset,
  "id" | "symbol" | "name" | "assetType" | "currency" | "providerSymbol"
>;

export type NormalizedProviderPrice = {
  assetId: string;
  price: number;
  currency: string;
  provider: "fmp" | "coingecko";
  providerSymbol: string;
  observedAt: Date;
  rawPayload: unknown;
};

export type ProviderPriceRefreshSummary = {
  attemptedAssetCount: number;
  createdPriceCount: number;
  providerSnapshots: ProviderSnapshot[];
  warnings: string[];
  hadProviderIssue: boolean;
};

export type ProviderSnapshot = {
  provider: "fmp" | "coingecko";
  requestedAssetCount: number;
  normalizedPriceCount: number;
  createdPriceCount: number;
  configured: boolean;
  status: "skipped" | "succeeded" | "partial" | "failed";
  warnings: string[];
};

export type FmpQuoteResponseItem = {
  symbol?: string;
  price?: number;
  exchange?: string;
  timestamp?: number;
};

export type CoinGeckoSpotResponseItem = {
  usd?: number;
  usd_market_cap?: number;
  usd_24h_vol?: number;
  last_updated_at?: number;
};

type RefreshOptions = {
  now?: Date;
};

export async function refreshProviderPricesForAssets(
  assets: ProviderPriceAsset[],
  options: RefreshOptions = {},
): Promise<ProviderPriceRefreshSummary> {
  const uniqueAssets = uniqueAssetsById(assets);
  const now = options.now ?? new Date();
  const stockAssets = uniqueAssets.filter(isFmpQuoteAsset);
  const cryptoAssets = uniqueAssets.filter((asset) => asset.assetType === "CRYPTO");
  const snapshots: ProviderSnapshot[] = [];
  const allWarnings: string[] = [];
  let createdPriceCount = 0;
  let hadProviderIssue = false;

  if (stockAssets.length > 0) {
    const snapshot = await refreshFmpQuotes(stockAssets, now);
    snapshots.push(snapshot);
    createdPriceCount += snapshot.createdPriceCount;
    allWarnings.push(...snapshot.warnings);
    hadProviderIssue ||= snapshot.status === "partial" || snapshot.status === "failed";
  }

  if (cryptoAssets.length > 0) {
    const snapshot = await refreshCoinGeckoSpotPrices(cryptoAssets, now);
    snapshots.push(snapshot);
    createdPriceCount += snapshot.createdPriceCount;
    allWarnings.push(...snapshot.warnings);
    hadProviderIssue ||= snapshot.status === "partial" || snapshot.status === "failed";
  }

  return {
    attemptedAssetCount: uniqueAssets.length,
    createdPriceCount,
    providerSnapshots: snapshots,
    warnings: allWarnings,
    hadProviderIssue,
  };
}

export function normalizeFmpQuote(
  asset: ProviderPriceAsset,
  item: FmpQuoteResponseItem,
  now = new Date(),
): NormalizedProviderPrice | null {
  const price = item.price;

  if (!Number.isFinite(price) || !price || price <= 0) {
    return null;
  }

  return {
    assetId: asset.id,
    price,
    currency: normalizeCurrency(asset.currency || "USD"),
    provider: "fmp",
    providerSymbol: asset.providerSymbol || asset.symbol,
    observedAt: parseUnixSeconds(item.timestamp) ?? now,
    rawPayload: item,
  };
}

export function normalizeCoinGeckoSpotPrice(
  asset: ProviderPriceAsset,
  item: CoinGeckoSpotResponseItem,
  now = new Date(),
): NormalizedProviderPrice | null {
  const price = item.usd;

  if (!Number.isFinite(price) || !price || price <= 0) {
    return null;
  }

  return {
    assetId: asset.id,
    price,
    currency: "USD",
    provider: "coingecko",
    providerSymbol: getCoinGeckoId(asset),
    observedAt: parseUnixSeconds(item.last_updated_at) ?? now,
    rawPayload: item,
  };
}

async function refreshFmpQuotes(
  assets: ProviderPriceAsset[],
  now: Date,
): Promise<ProviderSnapshot> {
  const apiKey = process.env.FMP_API_KEY;

  if (!apiKey) {
    return {
      provider: "fmp",
      requestedAssetCount: assets.length,
      normalizedPriceCount: 0,
      createdPriceCount: 0,
      configured: false,
      status: "partial",
      warnings: [
        "FMP_API_KEY is not configured. Stock/ETF provider price refresh was skipped.",
      ],
    };
  }

  try {
    const rawQuotes = (
      await Promise.all(
        chunk(assets, FMP_QUOTE_BATCH_SIZE).map((batch) =>
          fetchFmpQuoteBatch(batch, apiKey),
        ),
      )
    ).flat();
    const quotesBySymbol = new Map(
      rawQuotes
        .filter((item) => item.symbol)
        .map((item) => [String(item.symbol).toUpperCase(), item]),
    );
    const normalized = assets.flatMap((asset) => {
      const symbol = (asset.providerSymbol || asset.symbol).toUpperCase();
      const quote = quotesBySymbol.get(symbol) ?? quotesBySymbol.get(asset.symbol.toUpperCase());
      const normalizedQuote = quote ? normalizeFmpQuote(asset, quote, now) : null;

      return normalizedQuote ? [normalizedQuote] : [];
    });
    const warnings = buildProviderWarnings({
      provider: "FMP",
      requestedAssetCount: assets.length,
      normalizedPriceCount: normalized.length,
      normalized,
      now,
    });
    const createdPriceCount = await persistProviderPrices(normalized);

    return {
      provider: "fmp",
      requestedAssetCount: assets.length,
      normalizedPriceCount: normalized.length,
      createdPriceCount,
      configured: true,
      status: warnings.length > 0 ? "partial" : "succeeded",
      warnings,
    };
  } catch (error) {
    return {
      provider: "fmp",
      requestedAssetCount: assets.length,
      normalizedPriceCount: 0,
      createdPriceCount: 0,
      configured: true,
      status: "failed",
      warnings: [`FMP quote refresh failed: ${getErrorMessage(error)}`],
    };
  }
}

async function refreshCoinGeckoSpotPrices(
  assets: ProviderPriceAsset[],
  now: Date,
): Promise<ProviderSnapshot> {
  try {
    const rawResponses = await Promise.all(
      chunk(assets, COINGECKO_SPOT_BATCH_SIZE).map((batch) =>
        fetchCoinGeckoSpotBatch(batch),
      ),
    );
    const rawById = new Map<string, CoinGeckoSpotResponseItem>();

    for (const response of rawResponses) {
      for (const [id, value] of Object.entries(response)) {
        rawById.set(id, value);
      }
    }

    const normalized = assets.flatMap((asset) => {
      const spot = rawById.get(getCoinGeckoId(asset));
      const normalizedSpot = spot
        ? normalizeCoinGeckoSpotPrice(asset, spot, now)
        : null;

      return normalizedSpot ? [normalizedSpot] : [];
    });
    const warnings = buildProviderWarnings({
      provider: "CoinGecko",
      requestedAssetCount: assets.length,
      normalizedPriceCount: normalized.length,
      normalized,
      now,
    });
    const createdPriceCount = await persistProviderPrices(normalized);

    return {
      provider: "coingecko",
      requestedAssetCount: assets.length,
      normalizedPriceCount: normalized.length,
      createdPriceCount,
      configured: true,
      status: warnings.length > 0 ? "partial" : "succeeded",
      warnings,
    };
  } catch (error) {
    return {
      provider: "coingecko",
      requestedAssetCount: assets.length,
      normalizedPriceCount: 0,
      createdPriceCount: 0,
      configured: true,
      status: "failed",
      warnings: [`CoinGecko spot refresh failed: ${getErrorMessage(error)}`],
    };
  }
}

async function fetchFmpQuoteBatch(
  assets: ProviderPriceAsset[],
  apiKey: string,
): Promise<FmpQuoteResponseItem[]> {
  const symbols = assets
    .map((asset) => asset.providerSymbol || asset.symbol)
    .map((symbol) => symbol.toUpperCase())
    .join(",");
  const url = `https://financialmodelingprep.com/api/v3/quote/${encodeURIComponent(symbols)}?apikey=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    next: {
      revalidate: 5 * 60,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const value = await response.json();

  return Array.isArray(value) ? (value as FmpQuoteResponseItem[]) : [];
}

async function fetchCoinGeckoSpotBatch(
  assets: ProviderPriceAsset[],
): Promise<Record<string, CoinGeckoSpotResponseItem>> {
  const params = new URLSearchParams({
    ids: assets.map(getCoinGeckoId).join(","),
    vs_currencies: "usd",
    include_market_cap: "true",
    include_24hr_vol: "true",
    include_last_updated_at: "true",
  });
  const response = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?${params.toString()}`,
    {
      next: {
        revalidate: 5 * 60,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const value = await response.json();

  return isObjectRecord(value)
    ? (value as Record<string, CoinGeckoSpotResponseItem>)
    : {};
}

async function persistProviderPrices(
  prices: NormalizedProviderPrice[],
): Promise<number> {
  if (prices.length === 0) {
    return 0;
  }

  const result = await prisma.marketPrice.createMany({
    data: prices.map((price) => ({
      assetId: price.assetId,
      price: price.price,
      currency: price.currency,
      provider: price.provider,
      providerSymbol: price.providerSymbol,
      observedAt: price.observedAt,
    })),
  });

  return result.count;
}

function buildProviderWarnings(input: {
  provider: string;
  requestedAssetCount: number;
  normalizedPriceCount: number;
  normalized: NormalizedProviderPrice[];
  now: Date;
}): string[] {
  const warnings: string[] = [];

  if (input.requestedAssetCount > 0 && input.normalizedPriceCount === 0) {
    warnings.push(
      `${input.provider} returned no usable latest prices for scoped assets.`,
    );
  } else if (input.normalizedPriceCount < input.requestedAssetCount) {
    warnings.push(
      `${input.provider} returned usable prices for ${input.normalizedPriceCount}/${input.requestedAssetCount} scoped assets.`,
    );
  }

  const staleCount = input.normalized.filter((price) =>
    isProviderTimestampStale(price.observedAt, input.now),
  ).length;

  if (staleCount > 0) {
    warnings.push(
      `${input.provider} returned ${staleCount} price snapshot(s) older than ${scannerThresholds.priceStaleAfterHours} hours.`,
    );
  }

  return warnings;
}

function isFmpQuoteAsset(asset: ProviderPriceAsset): boolean {
  return asset.assetType === "STOCK" || asset.assetType === "ETF";
}

function getCoinGeckoId(asset: ProviderPriceAsset): string {
  return (asset.providerSymbol || asset.symbol).trim().toLowerCase();
}

function parseUnixSeconds(value: number | undefined): Date | null {
  if (!Number.isFinite(value) || !value || value <= 0) {
    return null;
  }

  const date = new Date(value * 1000);

  return Number.isNaN(date.getTime()) ? null : date;
}

function isProviderTimestampStale(observedAt: Date, now: Date): boolean {
  const staleAfterMs = scannerThresholds.priceStaleAfterHours * 60 * 60 * 1000;

  return now.getTime() - observedAt.getTime() > staleAfterMs;
}

function uniqueAssetsById(assets: ProviderPriceAsset[]): ProviderPriceAsset[] {
  return [...new Map(assets.map((asset) => [asset.id, asset])).values()];
}

function chunk<T>(values: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }

  return chunks;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown provider error";
}
