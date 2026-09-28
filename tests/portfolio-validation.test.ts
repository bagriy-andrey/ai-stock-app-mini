import { AssetType, InvestmentIntent } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  cashBalanceFormSchema,
  cashWithdrawalFormSchema,
  portfolioExchangeFormSchema,
  positionFormSchema,
} from "@/lib/portfolio/validation";
import { watchlistItemFormSchema } from "@/lib/watchlist/validation";

describe("portfolio form validation", () => {
  it("normalizes symbols and currencies for positions", () => {
    const result = positionFormSchema.parse({
      symbol: " nvda ",
      name: "NVIDIA",
      assetType: AssetType.STOCK,
      assetCurrency: " usd ",
      exchange: " NASDAQ ",
      provider: " FMP ",
      providerSymbol: " nvda ",
      quantity: "2.5",
      averageCost: "120",
      costCurrency: " usd ",
      investmentIntent: InvestmentIntent.LONG_TERM,
      openedAt: "2026-09-27",
      notes: " Core holding ",
    });

    expect(result).toMatchObject({
      symbol: "NVDA",
      assetCurrency: "USD",
      costCurrency: "USD",
      provider: "fmp",
      providerSymbol: "nvda",
      quantity: 2.5,
      averageCost: 120,
    });
  });

  it("preserves provider-specific asset ids for crypto providers", () => {
    const result = positionFormSchema.parse({
      symbol: " eth ",
      name: "Ethereum",
      assetType: AssetType.CRYPTO,
      assetCurrency: " usd ",
      exchange: " Binance ",
      provider: " coingecko ",
      providerSymbol: " ethereum ",
      quantity: "1",
      averageCost: "2500",
      costCurrency: " usd ",
      investmentIntent: InvestmentIntent.LONG_TERM,
      openedAt: "2026-09-27",
      notes: "",
    });

    expect(result).toMatchObject({
      symbol: "ETH",
      provider: "coingecko",
      providerSymbol: "ethereum",
    });
  });

  it("rejects negative position quantities, costs, and missing exchange", () => {
    expect(() =>
      positionFormSchema.parse({
        symbol: "SPY",
        name: "SPDR S&P 500 ETF Trust",
        assetType: AssetType.ETF,
        assetCurrency: "USD",
        exchange: "",
        provider: "manual",
        providerSymbol: "SPY",
        quantity: "-1",
        averageCost: "400",
        costCurrency: "USD",
        investmentIntent: InvestmentIntent.LONG_TERM,
        openedAt: "2026-09-27",
        notes: "",
      }),
    ).toThrow();

    expect(() =>
      positionFormSchema.parse({
        symbol: "SPY",
        name: "SPDR S&P 500 ETF Trust",
        assetType: AssetType.ETF,
        assetCurrency: "USD",
        exchange: "",
        provider: "manual",
        providerSymbol: "SPY",
        quantity: "1",
        averageCost: "-400",
        costCurrency: "USD",
        investmentIntent: InvestmentIntent.LONG_TERM,
        openedAt: "2026-09-27",
        notes: "",
      }),
    ).toThrow();

    expect(() =>
      positionFormSchema.parse({
        symbol: "SPY",
        name: "SPDR S&P 500 ETF Trust",
        assetType: AssetType.ETF,
        assetCurrency: "USD",
        exchange: "",
        provider: "manual",
        providerSymbol: "SPY",
        quantity: "1",
        averageCost: "400",
        costCurrency: "USD",
        investmentIntent: InvestmentIntent.LONG_TERM,
        openedAt: "2026-09-27",
        notes: "",
      }),
    ).toThrow();
  });

  it("normalizes cash currency and rejects negative cash", () => {
    expect(
      cashBalanceFormSchema.parse({
        platform: "IBKR",
        currency: " eur ",
        amount: "250.5",
      }),
    ).toEqual({
      platform: "IBKR",
      currency: "EUR",
      amount: 250.5,
    });

    expect(() =>
      cashBalanceFormSchema.parse({
        platform: "Bank",
        currency: "USD",
        amount: "-1",
      }),
    ).toThrow();
  });

  it("validates cash withdrawals", () => {
    expect(
      cashWithdrawalFormSchema.parse({
        cashBalanceId: "cash-1",
        platform: "Binance",
        currency: " usd ",
        amount: "50",
      }),
    ).toEqual({
      cashBalanceId: "cash-1",
      platform: "Binance",
      currency: "USD",
      amount: 50,
    });

    expect(() =>
      cashWithdrawalFormSchema.parse({
        cashBalanceId: "cash-1",
        platform: "Binance",
        currency: "USD",
        amount: "-1",
      }),
    ).toThrow();

    expect(() =>
      cashWithdrawalFormSchema.parse({
        cashBalanceId: "cash-1",
        platform: "Binance",
        currency: "USD",
        amount: "0",
      }),
    ).toThrow();
  });

  it("validates portfolio exchanges", () => {
    expect(
      portfolioExchangeFormSchema.parse({
        name: " Binance ",
        type: "CRYPTO",
      }),
    ).toEqual({
      name: "Binance",
      type: "CRYPTO",
    });

    expect(() =>
      portfolioExchangeFormSchema.parse({
        name: "",
        type: "CRYPTO",
      }),
    ).toThrow();

    expect(() =>
      portfolioExchangeFormSchema.parse({
        name: "IBKR",
        type: "BROKER",
      }),
    ).toThrow();
  });

  it("validates watchlist items", () => {
    expect(
      watchlistItemFormSchema.parse({
        symbol: " btc ",
        name: "Bitcoin",
        assetType: AssetType.CRYPTO,
        assetCurrency: " usd ",
        exchange: "",
        provider: " coingecko ",
        providerSymbol: " bitcoin ",
        investmentIntent: InvestmentIntent.LONG_TERM,
        priority: "HIGH",
        targetEntryPrice: "",
        notes: "",
      }),
    ).toMatchObject({
      symbol: "BTC",
      assetCurrency: "USD",
      exchange: null,
      provider: "coingecko",
      providerSymbol: "bitcoin",
      priority: "HIGH",
      targetEntryPrice: null,
      notes: null,
    });

    expect(() =>
      watchlistItemFormSchema.parse({
        symbol: "NVDA",
        name: "NVIDIA",
        assetType: AssetType.STOCK,
        assetCurrency: "USD",
        exchange: "NASDAQ",
        provider: "fmp",
        providerSymbol: "NVDA",
        investmentIntent: InvestmentIntent.TACTICAL,
        priority: "MEDIUM",
        targetEntryPrice: "-1",
        notes: "",
      }),
    ).toThrow();
  });
});
