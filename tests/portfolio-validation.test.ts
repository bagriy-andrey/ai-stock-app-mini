import { AssetType, InvestmentIntent } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  cashBalanceFormSchema,
  positionFormSchema,
} from "@/lib/portfolio/validation";

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
      providerSymbol: "NVDA",
      quantity: 2.5,
      averageCost: 120,
    });
  });

  it("rejects negative position quantities and costs", () => {
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
});
