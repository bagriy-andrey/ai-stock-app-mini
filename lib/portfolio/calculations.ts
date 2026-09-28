import { normalizeCurrency } from "@/lib/portfolio/currencies";

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
  usesCostBasisFallback: boolean;
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
  fxRates: Record<string, number>;
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

export function calculatePurchaseCost(input: {
  quantity: number;
  averageCost: number;
}): number {
  return input.quantity * input.averageCost;
}

export function calculateWeightedAverageCost(input: {
  existingQuantity: number;
  existingAverageCost: number;
  addedQuantity: number;
  addedAverageCost: number;
}): number {
  const totalQuantity = input.existingQuantity + input.addedQuantity;

  if (totalQuantity === 0) {
    return 0;
  }

  return (
    (input.existingQuantity * input.existingAverageCost +
      input.addedQuantity * input.addedAverageCost) /
    totalQuantity
  );
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
  fxRates?: Record<string, number>;
}): PortfolioValuation {
  const baseCurrency = normalizeCurrency(input.baseCurrency);
  const fxRates = normalizeFxRates(input.fxRates ?? {}, baseCurrency);
  const positionValues = input.positions.map((position) =>
    calculatePositionValuation(position, baseCurrency, fxRates),
  );
  const cashBalances = input.cashBalances.map((cash) =>
    calculateCashValuation(cash, baseCurrency, fxRates),
  );

  const hasMissingPrices = positionValues.some((position) => !position.isPriced);
  const hasUnsupportedPositionCurrencies = positionValues.some(
    (position) => position.marketValue === null,
  );
  const hasUnsupportedCashCurrencies = cashBalances.some(
    (cash) => cash.value === null,
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
  const totalValue = hasUnsupportedCurrencies
    ? null
    : pricedPositionValue + baseCurrencyCashValue;

  return {
    baseCurrency,
    fxRates,
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
  baseCurrency: string,
  fxRates: Record<string, number>,
): PositionValuation {
  const nativeCostBasis = calculateCostBasis(position);
  const nativeMarketValue = calculateMarketValue(position);
  const priceCurrency = position.latestPrice?.currency;
  const valueCurrency = priceCurrency ?? position.costCurrency;
  const costBasis = convertToBaseCurrency(
    nativeCostBasis,
    position.costCurrency,
    baseCurrency,
    fxRates,
  );
  const marketValue = convertToBaseCurrency(
    nativeMarketValue ?? nativeCostBasis,
    valueCurrency,
    baseCurrency,
    fxRates,
  );
  const isComparable =
    nativeMarketValue !== null && marketValue !== null && costBasis !== null;
  const unrealizedPnl = calculateUnrealizedPnl({
    marketValue,
    costBasis: costBasis ?? nativeCostBasis,
    isComparable,
  });

  return {
    id: position.id,
    quantity: position.quantity,
    averageCost: position.averageCost,
    costBasis: costBasis ?? nativeCostBasis,
    marketValue,
    unrealizedPnl,
    unrealizedPnlPercent: calculateUnrealizedPnlPercent({
      unrealizedPnl,
      costBasis: costBasis ?? nativeCostBasis,
    }),
    weight: null,
    isPriced: nativeMarketValue !== null,
    isComparable,
    usesCostBasisFallback: nativeMarketValue === null,
  };
}

function calculateCashValuation(
  cash: CashBalanceInput,
  baseCurrency: string,
  fxRates: Record<string, number>,
): CashValuation {
  const currency = normalizeCurrency(cash.currency);
  const isBaseCurrency = currency === baseCurrency;

  return {
    id: cash.id,
    currency,
    amount: cash.amount,
    value: convertToBaseCurrency(cash.amount, currency, baseCurrency, fxRates),
    weight: null,
    isBaseCurrency,
  };
}

function sumNumbers(values: Array<number | null>): number {
  return values.reduce<number>((total, value) => total + (value ?? 0), 0);
}

function convertToBaseCurrency(
  amount: number,
  currency: string,
  baseCurrency: string,
  fxRates: Record<string, number>,
): number | null {
  const normalizedCurrency = normalizeCurrency(currency);

  if (normalizedCurrency === baseCurrency) {
    return amount;
  }

  const rate = fxRates[normalizedCurrency];

  if (!rate) {
    return null;
  }

  return amount * rate;
}

function normalizeFxRates(
  fxRates: Record<string, number>,
  baseCurrency: string,
): Record<string, number> {
  const normalizedRates: Record<string, number> = {
    [baseCurrency]: 1,
  };

  for (const [currency, rate] of Object.entries(fxRates)) {
    if (rate > 0) {
      normalizedRates[normalizeCurrency(currency)] = rate;
    }
  }

  return normalizedRates;
}
