export type PositionPriceInput = {
  price: number;
  currency: string;
};

export type PortfolioPositionInput = {
  id: string;
  quantity: number;
  averageCost: number;
  costCurrency: string;
  latestPrice?: PositionPriceInput | null;
};

export type CashBalanceInput = {
  id: string;
  currency: string;
  amount: number;
};

export type PositionValuation = {
  id: string;
  quantity: number;
  averageCost: number;
  costBasis: number;
  marketValue: number | null;
  unrealizedPnl: number | null;
  unrealizedPnlPercent: number | null;
  weight: number | null;
  isPriced: boolean;
  isComparable: boolean;
};

export type CashValuation = {
  id: string;
  currency: string;
  amount: number;
  value: number | null;
  weight: number | null;
  isBaseCurrency: boolean;
};

export type PortfolioValuation = {
  baseCurrency: string;
  positions: PositionValuation[];
  cashBalances: CashValuation[];
  totalValue: number | null;
  pricedPositionValue: number;
  baseCurrencyCashValue: number;
  hasMissingPrices: boolean;
  hasUnsupportedCurrencies: boolean;
  isComplete: boolean;
};

export function calculateCostBasis(
  position: Pick<PortfolioPositionInput, "quantity" | "averageCost">,
): number {
  return position.quantity * position.averageCost;
}

export function calculateMarketValue(
  position: Pick<PortfolioPositionInput, "quantity" | "latestPrice">,
): number | null {
  if (!position.latestPrice) {
    return null;
  }

  return position.quantity * position.latestPrice.price;
}

export function calculateUnrealizedPnl(input: {
  marketValue: number | null;
  costBasis: number;
  isComparable: boolean;
}): number | null {
  if (input.marketValue === null || !input.isComparable) {
    return null;
  }

  return input.marketValue - input.costBasis;
}

export function calculateUnrealizedPnlPercent(input: {
  unrealizedPnl: number | null;
  costBasis: number;
}): number | null {
  if (input.unrealizedPnl === null || input.costBasis === 0) {
    return null;
  }

  return input.unrealizedPnl / input.costBasis;
}

export function calculatePortfolioValuation(input: {
  baseCurrency: string;
  positions: PortfolioPositionInput[];
  cashBalances: CashBalanceInput[];
}): PortfolioValuation {
  const baseCurrency = normalizeCurrency(input.baseCurrency);
  const positionValues = input.positions.map((position) =>
    calculatePositionValuation(position),
  );
  const cashBalances = input.cashBalances.map((cash) =>
    calculateCashValuation(cash, baseCurrency),
  );

  const hasMissingPrices = positionValues.some((position) => !position.isPriced);
  const hasUnsupportedPositionCurrencies = input.positions.some((position) => {
    if (!position.latestPrice) {
      return false;
    }

    return normalizeCurrency(position.latestPrice.currency) !== baseCurrency;
  });
  const hasUnsupportedCashCurrencies = cashBalances.some(
    (cash) => !cash.isBaseCurrency,
  );
  const hasUnsupportedCurrencies =
    hasUnsupportedPositionCurrencies || hasUnsupportedCashCurrencies;

  const pricedPositionValue = sumNumbers(
    positionValues.map((position) => position.marketValue),
  );
  const baseCurrencyCashValue = sumNumbers(
    cashBalances.map((cash) => cash.value),
  );
  const isComplete = !hasMissingPrices && !hasUnsupportedCurrencies;
  const totalValue = isComplete
    ? pricedPositionValue + baseCurrencyCashValue
    : null;

  return {
    baseCurrency,
    positions: positionValues.map((position) => ({
      ...position,
      weight: calculateWeight(position.marketValue, totalValue),
    })),
    cashBalances: cashBalances.map((cash) => ({
      ...cash,
      weight: calculateWeight(cash.value, totalValue),
    })),
    totalValue,
    pricedPositionValue,
    baseCurrencyCashValue,
    hasMissingPrices,
    hasUnsupportedCurrencies,
    isComplete,
  };
}

export function calculateWeight(
  value: number | null,
  totalValue: number | null,
): number | null {
  if (value === null || totalValue === null || totalValue === 0) {
    return null;
  }

  return value / totalValue;
}

function calculatePositionValuation(
  position: PortfolioPositionInput,
): PositionValuation {
  const costBasis = calculateCostBasis(position);
  const marketValue = calculateMarketValue(position);
  const priceCurrency = position.latestPrice?.currency;
  const isComparable =
    priceCurrency !== undefined &&
    normalizeCurrency(priceCurrency) === normalizeCurrency(position.costCurrency);
  const unrealizedPnl = calculateUnrealizedPnl({
    marketValue,
    costBasis,
    isComparable,
  });

  return {
    id: position.id,
    quantity: position.quantity,
    averageCost: position.averageCost,
    costBasis,
    marketValue,
    unrealizedPnl,
    unrealizedPnlPercent: calculateUnrealizedPnlPercent({
      unrealizedPnl,
      costBasis,
    }),
    weight: null,
    isPriced: marketValue !== null,
    isComparable,
  };
}

function calculateCashValuation(
  cash: CashBalanceInput,
  baseCurrency: string,
): CashValuation {
  const isBaseCurrency = normalizeCurrency(cash.currency) === baseCurrency;

  return {
    id: cash.id,
    currency: normalizeCurrency(cash.currency),
    amount: cash.amount,
    value: isBaseCurrency ? cash.amount : null,
    weight: null,
    isBaseCurrency,
  };
}

function normalizeCurrency(currency: string): string {
  return currency.trim().toUpperCase();
}

function sumNumbers(values: Array<number | null>): number {
  return values.reduce<number>((total, value) => total + (value ?? 0), 0);
}
