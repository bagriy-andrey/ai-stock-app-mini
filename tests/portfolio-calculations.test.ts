import { describe, expect, it } from "vitest";
import {
  calculateCostBasis,
  calculateMarketValue,
  calculatePortfolioValuation,
  calculateUnrealizedPnl,
  calculateUnrealizedPnlPercent,
  calculateWeight,
} from "@/lib/portfolio/calculations";

describe("portfolio calculations", () => {
  it("calculates position value, cost basis, P&L, and weights", () => {
    const valuation = calculatePortfolioValuation({
      baseCurrency: "usd",
      positions: [
        {
          id: "position-a",
          quantity: 10,
          averageCost: 100,
          costCurrency: "USD",
          latestPrice: {
            price: 125,
            currency: "USD",
          },
        },
        {
          id: "position-b",
          quantity: 2,
          averageCost: 400,
          costCurrency: "USD",
          latestPrice: {
            price: 500,
            currency: "USD",
          },
        },
      ],
      cashBalances: [
        {
          id: "cash-usd",
          currency: "USD",
          amount: 250,
        },
      ],
    });

    expect(valuation).toMatchObject({
      baseCurrency: "USD",
      totalValue: 2500,
      pricedPositionValue: 2250,
      baseCurrencyCashValue: 250,
      hasMissingPrices: false,
      hasUnsupportedCurrencies: false,
      isComplete: true,
    });
    expect(valuation.positions[0]).toMatchObject({
      costBasis: 1000,
      marketValue: 1250,
      unrealizedPnl: 250,
      unrealizedPnlPercent: 0.25,
      weight: 0.5,
      isPriced: true,
      isComparable: true,
    });
    expect(valuation.positions[1].weight).toBe(0.4);
    expect(valuation.cashBalances[0]).toMatchObject({
      value: 250,
      weight: 0.1,
      isBaseCurrency: true,
    });
  });

  it("marks totals incomplete when a position is missing a price", () => {
    const valuation = calculatePortfolioValuation({
      baseCurrency: "USD",
      positions: [
        {
          id: "position-a",
          quantity: 5,
          averageCost: 20,
          costCurrency: "USD",
          latestPrice: null,
        },
      ],
      cashBalances: [
        {
          id: "cash-usd",
          currency: "USD",
          amount: 100,
        },
      ],
    });

    expect(valuation.totalValue).toBeNull();
    expect(valuation.isComplete).toBe(false);
    expect(valuation.hasMissingPrices).toBe(true);
    expect(valuation.positions[0]).toMatchObject({
      costBasis: 100,
      marketValue: null,
      unrealizedPnl: null,
      unrealizedPnlPercent: null,
      weight: null,
      isPriced: false,
      isComparable: false,
    });
    expect(valuation.cashBalances[0].weight).toBeNull();
  });

  it("marks totals incomplete when currencies cannot be converted", () => {
    const valuation = calculatePortfolioValuation({
      baseCurrency: "USD",
      positions: [
        {
          id: "position-eur",
          quantity: 3,
          averageCost: 100,
          costCurrency: "EUR",
          latestPrice: {
            price: 110,
            currency: "EUR",
          },
        },
      ],
      cashBalances: [
        {
          id: "cash-eur",
          currency: "EUR",
          amount: 50,
        },
      ],
    });

    expect(valuation.totalValue).toBeNull();
    expect(valuation.isComplete).toBe(false);
    expect(valuation.hasMissingPrices).toBe(false);
    expect(valuation.hasUnsupportedCurrencies).toBe(true);
    expect(valuation.positions[0]).toMatchObject({
      marketValue: 330,
      unrealizedPnl: 30,
      unrealizedPnlPercent: 0.1,
      weight: null,
      isComparable: true,
    });
    expect(valuation.cashBalances[0]).toMatchObject({
      value: null,
      weight: null,
      isBaseCurrency: false,
    });
  });

  it("returns null percentage when cost basis is zero", () => {
    expect(
      calculateUnrealizedPnlPercent({
        unrealizedPnl: 100,
        costBasis: 0,
      }),
    ).toBeNull();
  });

  it("exposes focused primitive calculations", () => {
    expect(calculateCostBasis({ quantity: 4, averageCost: 25 })).toBe(100);
    expect(
      calculateMarketValue({
        quantity: 4,
        latestPrice: {
          price: 30,
          currency: "USD",
        },
      }),
    ).toBe(120);
    expect(
      calculateUnrealizedPnl({
        marketValue: 120,
        costBasis: 100,
        isComparable: true,
      }),
    ).toBe(20);
    expect(calculateWeight(25, 100)).toBe(0.25);
  });
});
