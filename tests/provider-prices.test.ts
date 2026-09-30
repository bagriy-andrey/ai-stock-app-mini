import { afterEach, describe, expect, it, vi } from "vitest";
import {
  normalizeCoinGeckoSpotPrice,
  normalizeFmpQuote,
  refreshProviderPricesForAssets,
} from "@/lib/market-data/provider-prices";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    marketPrice: {
      createMany: vi.fn(async ({ data }: { data: unknown[] }) => ({
        count: data.length,
      })),
    },
  },
}));

const stockAsset = {
  id: "asset_stock",
  symbol: "AAPL",
  name: "Apple Inc.",
  assetType: "STOCK" as const,
  currency: "usd",
  providerSymbol: "AAPL",
};

const cryptoAsset = {
  id: "asset_crypto",
  symbol: "BTC",
  name: "Bitcoin",
  assetType: "CRYPTO" as const,
  currency: "USD",
  providerSymbol: "bitcoin",
};

describe("provider price normalization", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("normalizes FMP quote payloads into market price snapshots", () => {
    const price = normalizeFmpQuote(stockAsset, {
      symbol: "AAPL",
      price: 201.25,
      timestamp: 1_796_070_000,
    });

    expect(price).toMatchObject({
      assetId: "asset_stock",
      price: 201.25,
      currency: "USD",
      provider: "fmp",
      providerSymbol: "AAPL",
    });
    expect(price?.observedAt.toISOString()).toBe("2026-11-30T20:20:00.000Z");
  });

  it("rejects malformed FMP quotes without inventing prices", () => {
    expect(
      normalizeFmpQuote(stockAsset, {
        symbol: "AAPL",
        price: 0,
      }),
    ).toBeNull();
  });

  it("normalizes CoinGecko spot payloads into USD market price snapshots", () => {
    const price = normalizeCoinGeckoSpotPrice(cryptoAsset, {
      usd: 65_000,
      usd_market_cap: 1_280_000_000_000,
      usd_24h_vol: 35_000_000_000,
      last_updated_at: 1_796_070_000,
    });

    expect(price).toMatchObject({
      assetId: "asset_crypto",
      price: 65_000,
      currency: "USD",
      provider: "coingecko",
      providerSymbol: "bitcoin",
    });
    expect(price?.observedAt.toISOString()).toBe("2026-11-30T20:20:00.000Z");
  });

  it("returns a partial warning when FMP is required but not configured", async () => {
    vi.stubEnv("FMP_API_KEY", "");

    const summary = await refreshProviderPricesForAssets([stockAsset]);

    expect(summary.createdPriceCount).toBe(0);
    expect(summary.hadProviderIssue).toBe(true);
    expect(summary.providerSnapshots[0]).toMatchObject({
      provider: "fmp",
      configured: false,
      status: "partial",
    });
    expect(summary.warnings[0]).toContain("FMP_API_KEY is not configured");
  });

  it("persists provider prices when mocked providers return usable data", async () => {
    vi.stubEnv("FMP_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.includes("financialmodelingprep.com")) {
          return Response.json([
            {
              symbol: "AAPL",
              price: 201.25,
              timestamp: 1_796_070_000,
            },
          ]);
        }

        return Response.json({
          bitcoin: {
            usd: 65_000,
            last_updated_at: 1_796_070_000,
          },
        });
      }),
    );

    const summary = await refreshProviderPricesForAssets([
      stockAsset,
      cryptoAsset,
    ]);

    expect(summary.createdPriceCount).toBe(2);
    expect(summary.hadProviderIssue).toBe(false);
    expect(summary.providerSnapshots.map((snapshot) => snapshot.provider)).toEqual([
      "fmp",
      "coingecko",
    ]);
  });
});
