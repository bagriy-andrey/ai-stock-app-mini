import {
  SUPPORTED_PORTFOLIO_CURRENCIES,
  normalizeCurrency,
  type SupportedPortfolioCurrency,
} from "@/lib/portfolio/currencies";

export type FxRateMap = Record<string, number>;

type FrankfurterLatestResponse = {
  amount?: number;
  base?: string;
  date?: string;
  rates?: Record<string, number>;
};

const FRANKFURTER_LATEST_URL = "https://api.frankfurter.app/latest";

export async function getLatestPortfolioFxRates(
  baseCurrency: string,
): Promise<FxRateMap> {
  const normalizedBase = normalizeCurrency(
    baseCurrency,
  ) as SupportedPortfolioCurrency;
  const rates: FxRateMap = {
    [normalizedBase]: 1,
  };
  const targetCurrencies = SUPPORTED_PORTFOLIO_CURRENCIES.filter(
    (currency) => currency !== normalizedBase,
  );

  if (targetCurrencies.length === 0) {
    return rates;
  }

  try {
    const params = new URLSearchParams({
      from: normalizedBase,
      to: targetCurrencies.join(","),
    });
    const response = await fetch(`${FRANKFURTER_LATEST_URL}?${params}`, {
      next: {
        revalidate: 60 * 30,
      },
    });

    if (!response.ok) {
      return rates;
    }

    const data = (await response.json()) as FrankfurterLatestResponse;

    for (const [currency, rate] of Object.entries(data.rates ?? {})) {
      if (rate > 0) {
        rates[normalizeCurrency(currency)] = 1 / rate;
      }
    }

    return rates;
  } catch {
    return rates;
  }
}
