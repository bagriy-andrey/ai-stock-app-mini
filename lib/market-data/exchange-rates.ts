export type ExchangeRateKind = "fiat" | "crypto";

export type ExchangeRatePair = {
  id: string;
  base: string;
  quote: string;
  kind: ExchangeRateKind;
  baseIcon: string;
  quoteIcon: string;
};

export type ExchangeRateQuote = ExchangeRatePair & {
  rate: number | null;
  source: string;
  updatedAt: string;
};

type FrankfurterLatestResponse = {
  date?: string;
  rates?: Record<string, number>;
};

type CoinGeckoSimplePriceResponse = Record<string, Record<string, number>>;

type NbuExchangeRateResponse = Array<{
  cc?: string;
  rate?: number;
}>;

const FRANKFURTER_LATEST_URL = "https://api.frankfurter.app/latest";
const NBU_EXCHANGE_RATES_URL =
  "https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json";
const COINGECKO_SIMPLE_PRICE_URL =
  "https://api.coingecko.com/api/v3/simple/price";

export const EXCHANGE_RATE_PAIRS: ExchangeRatePair[] = [
  {
    id: "USD-PLN",
    base: "USD",
    quote: "PLN",
    kind: "fiat",
    baseIcon: "🇺🇸",
    quoteIcon: "🇵🇱",
  },
  {
    id: "EUR-PLN",
    base: "EUR",
    quote: "PLN",
    kind: "fiat",
    baseIcon: "🇪🇺",
    quoteIcon: "🇵🇱",
  },
  {
    id: "USD-EUR",
    base: "USD",
    quote: "EUR",
    kind: "fiat",
    baseIcon: "🇺🇸",
    quoteIcon: "🇪🇺",
  },
  {
    id: "PLN-UAH",
    base: "PLN",
    quote: "UAH",
    kind: "fiat",
    baseIcon: "🇵🇱",
    quoteIcon: "🇺🇦",
  },
  {
    id: "EUR-UAH",
    base: "EUR",
    quote: "UAH",
    kind: "fiat",
    baseIcon: "🇪🇺",
    quoteIcon: "🇺🇦",
  },
  {
    id: "USD-UAH",
    base: "USD",
    quote: "UAH",
    kind: "fiat",
    baseIcon: "🇺🇸",
    quoteIcon: "🇺🇦",
  },
  {
    id: "BTC-USD",
    base: "BTC",
    quote: "USD",
    kind: "crypto",
    baseIcon: "₿",
    quoteIcon: "🇺🇸",
  },
  {
    id: "BTC-PLN",
    base: "BTC",
    quote: "PLN",
    kind: "crypto",
    baseIcon: "₿",
    quoteIcon: "🇵🇱",
  },
  {
    id: "ETH-USD",
    base: "ETH",
    quote: "USD",
    kind: "crypto",
    baseIcon: "Ξ",
    quoteIcon: "🇺🇸",
  },
  {
    id: "ETH-PLN",
    base: "ETH",
    quote: "PLN",
    kind: "crypto",
    baseIcon: "Ξ",
    quoteIcon: "🇵🇱",
  },
];

const CRYPTO_COIN_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
};

export async function getLatestExchangeRateQuotes(): Promise<
  ExchangeRateQuote[]
> {
  const updatedAt = new Date().toISOString();
  const [fiatRates, cryptoRates] = await Promise.all([
    getFiatRates(),
    getCryptoRates(),
  ]);

  return EXCHANGE_RATE_PAIRS.map((pair) => ({
    ...pair,
    rate:
      pair.kind === "fiat"
        ? (fiatRates.get(pair.id) ?? null)
        : (cryptoRates.get(pair.id) ?? null),
    source: getExchangeRateSource(pair),
    updatedAt,
  }));
}

async function getFiatRates(): Promise<Map<string, number>> {
  const rates = new Map<string, number>();
  const fiatPairs = EXCHANGE_RATE_PAIRS.filter((pair) => pair.kind === "fiat");
  const nbuPairs = fiatPairs.filter(
    (pair) => pair.base === "UAH" || pair.quote === "UAH",
  );
  const pairsByBase = groupPairsByBase(
    fiatPairs.filter((pair) => pair.base !== "UAH" && pair.quote !== "UAH"),
  );

  await Promise.all(
    [
      ...[...pairsByBase.entries()].map(async ([base, pairs]) => {
        const targetCurrencies = pairs.map((pair) => pair.quote);

        try {
          const response = await fetchFrankfurterLatest(base, targetCurrencies);

          for (const pair of pairs) {
            const rate = response.rates?.[pair.quote];

            if (typeof rate === "number" && rate > 0) {
              rates.set(pair.id, rate);
            }
          }
        } catch {
          for (const pair of pairs) {
            rates.set(pair.id, NaN);
          }
        }
      }),
      getNbuRates(nbuPairs, rates),
    ],
  );

  return normalizedRateMap(rates);
}

async function fetchFrankfurterLatest(
  base: string,
  targetCurrencies: string[],
): Promise<FrankfurterLatestResponse> {
  const params = new URLSearchParams({
    from: base,
    to: targetCurrencies.join(","),
  });
  const response = await fetch(`${FRANKFURTER_LATEST_URL}?${params}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Frankfurter request failed: ${response.status}`);
  }

  return (await response.json()) as FrankfurterLatestResponse;
}

async function getNbuRates(
  pairs: ExchangeRatePair[],
  rates: Map<string, number>,
): Promise<void> {
  if (pairs.length === 0) {
    return;
  }

  try {
    const response = await fetch(NBU_EXCHANGE_RATES_URL, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`NBU request failed: ${response.status}`);
    }

    const data = (await response.json()) as NbuExchangeRateResponse;
    const uahPerCurrency = new Map(
      data.flatMap((item) => {
        if (!item.cc || typeof item.rate !== "number" || item.rate <= 0) {
          return [];
        }

        return [[item.cc.toUpperCase(), item.rate]];
      }),
    );

    for (const pair of pairs) {
      const rate =
        pair.quote === "UAH"
          ? uahPerCurrency.get(pair.base)
          : getInvertedNbuRate(uahPerCurrency, pair.quote);

      if (rate) {
        rates.set(pair.id, rate);
      }
    }
  } catch {
    for (const pair of pairs) {
      rates.set(pair.id, NaN);
    }
  }
}

function getInvertedNbuRate(
  uahPerCurrency: Map<string, number>,
  quote: string,
): number | null {
  const uahRate = uahPerCurrency.get(quote);

  return uahRate ? 1 / uahRate : null;
}

async function getCryptoRates(): Promise<Map<string, number>> {
  const rates = new Map<string, number>();
  const cryptoPairs = EXCHANGE_RATE_PAIRS.filter(
    (pair) => pair.kind === "crypto",
  );
  const coinIds = new Set<string>();
  const quoteCurrencies = new Set<string>();

  for (const pair of cryptoPairs) {
    const coinId = CRYPTO_COIN_IDS[pair.base];

    if (coinId) {
      coinIds.add(coinId);
      quoteCurrencies.add(pair.quote.toLowerCase());
    }
  }

  try {
    const params = new URLSearchParams({
      ids: [...coinIds].join(","),
      vs_currencies: [...quoteCurrencies].join(","),
    });
    const response = await fetch(`${COINGECKO_SIMPLE_PRICE_URL}?${params}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`CoinGecko request failed: ${response.status}`);
    }

    const data = (await response.json()) as CoinGeckoSimplePriceResponse;

    for (const pair of cryptoPairs) {
      const coinId = CRYPTO_COIN_IDS[pair.base];
      const rate = coinId ? data[coinId]?.[pair.quote.toLowerCase()] : null;

      if (typeof rate === "number" && rate > 0) {
        rates.set(pair.id, rate);
      }
    }
  } catch {
    for (const pair of cryptoPairs) {
      rates.set(pair.id, NaN);
    }
  }

  return normalizedRateMap(rates);
}

function groupPairsByBase(
  pairs: ExchangeRatePair[],
): Map<string, ExchangeRatePair[]> {
  const pairsByBase = new Map<string, ExchangeRatePair[]>();

  for (const pair of pairs) {
    pairsByBase.set(pair.base, [...(pairsByBase.get(pair.base) ?? []), pair]);
  }

  return pairsByBase;
}

function getExchangeRateSource(pair: ExchangeRatePair): string {
  if (pair.kind === "crypto") {
    return "CoinGecko";
  }

  if (pair.base === "UAH" || pair.quote === "UAH") {
    return "NBU";
  }

  return "Frankfurter";
}

function normalizedRateMap(rates: Map<string, number>): Map<string, number> {
  return new Map(
    [...rates.entries()].filter(([, rate]) => Number.isFinite(rate) && rate > 0),
  );
}
