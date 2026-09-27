export const SUPPORTED_PORTFOLIO_CURRENCIES = ["USD", "EUR", "PLN"] as const;

export type SupportedPortfolioCurrency =
  (typeof SUPPORTED_PORTFOLIO_CURRENCIES)[number];

export function normalizeCurrency(currency: string): string {
  return currency.trim().toUpperCase();
}

export function isSupportedPortfolioCurrency(
  currency: string,
): currency is SupportedPortfolioCurrency {
  return SUPPORTED_PORTFOLIO_CURRENCIES.includes(
    normalizeCurrency(currency) as SupportedPortfolioCurrency,
  );
}
