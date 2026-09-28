import { AssetType } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const searchParamsSchema = z.object({
  provider: z.string().trim().min(1).max(40),
  providerSymbol: z.string().trim().min(1).max(120),
  symbol: z.string().trim().min(1).max(24),
  name: z.string().trim().min(1).max(120),
  type: z.nativeEnum(AssetType),
  scope: z.enum(["profile", "price"]).optional().default("profile"),
});

const PROFILE_CACHE_TTL_MS = 30 * 1000;
const profileCache = new Map<
  string,
  {
    expiresAt: number;
    profile: AssetProfile | null;
  }
>();
const profileRequests = new Map<string, Promise<AssetProfile | null>>();

type AssetProfile = {
  source: string;
  summary: string | null;
  website: string | null;
  sector: string | null;
  industry: string | null;
  country: string | null;
  currentPrice: number | null;
  priceCurrency: string;
  priceChange24hPercent: number | null;
  priceChange7dPercent: number | null;
  priceChange30dPercent: number | null;
  marketCap: number | null;
  fullyDilutedValuation: number | null;
  totalVolume24h: number | null;
  rank: number | null;
  circulatingSupply: number | null;
  totalSupply: number | null;
  maxSupply: number | null;
  ath: number | null;
  athChangePercent: number | null;
  atl: number | null;
  atlChangePercent: number | null;
  yearHigh: number | null;
  yearLow: number | null;
  beta: number | null;
  peRatio: number | null;
  eps: number | null;
  volume: number | null;
  averageVolume: number | null;
};

type CoinGeckoCoinResponse = {
  description?: {
    en?: string;
  };
  links?: {
    homepage?: string[];
  };
  market_cap_rank?: number | null;
  market_data?: {
    current_price?: {
      usd?: number;
    };
    market_cap?: {
      usd?: number;
    };
    fully_diluted_valuation?: {
      usd?: number;
    };
    total_volume?: {
      usd?: number;
    };
    price_change_percentage_24h?: number | null;
    price_change_percentage_7d?: number | null;
    price_change_percentage_30d?: number | null;
    circulating_supply?: number | null;
    total_supply?: number | null;
    max_supply?: number | null;
    ath?: {
      usd?: number;
    };
    ath_change_percentage?: {
      usd?: number;
    };
    atl?: {
      usd?: number;
    };
    atl_change_percentage?: {
      usd?: number;
    };
  };
  categories?: string[];
  country_origin?: string;
};

type CoinGeckoSearchCoin = {
  id?: string;
  name?: string;
  symbol?: string;
  market_cap_rank?: number | null;
};

type FmpProfileResponse = Array<{
  description?: string;
  website?: string;
  sector?: string;
  industry?: string;
  country?: string;
  mktCap?: number;
  marketCap?: number;
  beta?: number;
  price?: number;
  volAvg?: number;
  lastDiv?: number;
  range?: string;
}>;

type FmpQuoteResponse = Array<{
  price?: number;
  changesPercentage?: number;
  changePercentage?: number;
  marketCap?: number;
  volume?: number;
  avgVolume?: number;
  pe?: number;
  eps?: number;
  yearHigh?: number;
  yearLow?: number;
}>;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = searchParamsSchema.safeParse({
    provider: url.searchParams.get("provider"),
    providerSymbol: url.searchParams.get("providerSymbol"),
    symbol: url.searchParams.get("symbol"),
    name: url.searchParams.get("name"),
    type: url.searchParams.get("type"),
    scope: url.searchParams.get("scope") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ profile: null }, { status: 400 });
  }

  const profile = await getCachedProviderProfile(parsed.data);

  return NextResponse.json({ profile });
}

async function getCachedProviderProfile(input: {
  provider: string;
  providerSymbol: string;
  symbol: string;
  name: string;
  type: AssetType;
  scope: "profile" | "price";
}): Promise<AssetProfile | null> {
  const cacheKey = getProfileCacheKey(input);
  const cached = profileCache.get(cacheKey);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    return cached.profile;
  }

  const existingRequest = profileRequests.get(cacheKey);

  if (existingRequest) {
    return existingRequest;
  }

  const request = getProviderProfile(input)
    .then((profile) => {
      profileCache.set(cacheKey, {
        expiresAt: Date.now() + PROFILE_CACHE_TTL_MS,
        profile,
      });

      return profile;
    })
    .finally(() => {
      profileRequests.delete(cacheKey);
    });

  profileRequests.set(cacheKey, request);

  return request;
}

function getProfileCacheKey(input: {
  provider: string;
  providerSymbol: string;
  symbol: string;
  name: string;
  type: AssetType;
  scope: "profile" | "price";
}) {
  return [
    input.provider.toLowerCase(),
    input.providerSymbol.toUpperCase(),
    input.symbol.toUpperCase(),
    input.name.toLowerCase(),
    input.type,
    input.scope,
  ].join(":");
}

async function getProviderProfile(input: {
  provider: string;
  providerSymbol: string;
  symbol: string;
  name: string;
  type: AssetType;
  scope: "profile" | "price";
}): Promise<AssetProfile | null> {
  if (input.type === AssetType.CRYPTO) {
    const candidateCoinIds = await getCoinGeckoCandidateIds(input);

    for (const coinId of candidateCoinIds) {
      const profile = await getCoinGeckoProfile(coinId);

      if (profile) {
        return profile;
      }
    }

    return getLocalFallbackProfile(input);
  }

  return (
    (await getFmpProfile(input.providerSymbol || input.symbol, input.scope)) ??
    getLocalFallbackProfile(input)
  );
}

async function getCoinGeckoCandidateIds(input: {
  provider: string;
  providerSymbol: string;
  symbol: string;
  name: string;
}): Promise<string[]> {
  const candidates = new Set<string>();

  if (input.provider === "coingecko") {
    candidates.add(input.providerSymbol);
    candidates.add(input.providerSymbol.toLowerCase());
  }

  candidates.add(input.symbol.toLowerCase());

  const knownCoinId = knownCoinGeckoIds[input.symbol.toUpperCase()];

  if (knownCoinId) {
    candidates.add(knownCoinId);
  }

  for (const foundCoinId of await findCoinGeckoIds(input.symbol, input.name)) {
    candidates.add(foundCoinId);
  }

  return [...candidates].filter((coinId) => coinId.length > 0);
}

async function findCoinGeckoIds(
  symbol: string,
  name: string,
): Promise<string[]> {
  const searchResults = await Promise.all([
    searchCoinGeckoCoins(symbol),
    searchCoinGeckoCoins(name),
  ]);
  const coins = dedupeCoinGeckoCoins(searchResults.flat());
  try {
    const normalizedSymbol = symbol.toLowerCase();
    const normalizedName = name.toLowerCase();

    return [
      ...sortCoinGeckoSearchCoins(
        coins.filter((coin) => coin.name?.toLowerCase() === normalizedName),
      ),
      ...sortCoinGeckoSearchCoins(
        coins.filter((coin) => coin.symbol?.toLowerCase() === normalizedSymbol),
      ),
      ...sortCoinGeckoSearchCoins(coins),
    ]
      .filter((coin) => coin.id)
      .map((coin) => coin.id as string);
  } catch {
    return [];
  }
}

async function searchCoinGeckoCoins(
  query: string,
): Promise<CoinGeckoSearchCoin[]> {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return [];
  }

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(
        normalizedQuery,
      )}`,
      {
        next: {
          revalidate: 60 * 60,
        },
      },
    );

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as {
      coins?: CoinGeckoSearchCoin[];
    };

    return data.coins ?? [];
  } catch {
    return [];
  }
}

function dedupeCoinGeckoCoins(
  coins: CoinGeckoSearchCoin[],
): CoinGeckoSearchCoin[] {
  const seen = new Set<string>();
  const deduped: CoinGeckoSearchCoin[] = [];

  for (const coin of coins) {
    if (!coin.id || seen.has(coin.id)) {
      continue;
    }

    seen.add(coin.id);
    deduped.push(coin);
  }

  return deduped;
}

function sortCoinGeckoSearchCoins(
  coins: CoinGeckoSearchCoin[],
): CoinGeckoSearchCoin[] {
  return [...coins].sort((left, right) => {
    const leftRank = left.market_cap_rank ?? Number.POSITIVE_INFINITY;
    const rightRank = right.market_cap_rank ?? Number.POSITIVE_INFINITY;

    return leftRank - rightRank;
  });
}

async function getCoinGeckoProfile(
  coinId: string,
): Promise<AssetProfile | null> {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(
        coinId,
      )}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`,
      {
        next: {
          revalidate: 60 * 60,
        },
      },
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as CoinGeckoCoinResponse;

    return {
      source: "CoinGecko",
      summary: normalizeText(data.description?.en ?? null),
      website: getFirstNonEmpty(data.links?.homepage ?? []),
      sector: getFirstNonEmpty(data.categories ?? []),
      industry: null,
      country: normalizeText(data.country_origin || null),
      currentPrice: data.market_data?.current_price?.usd ?? null,
      priceCurrency: "USD",
      priceChange24hPercent:
        data.market_data?.price_change_percentage_24h ?? null,
      priceChange7dPercent:
        data.market_data?.price_change_percentage_7d ?? null,
      priceChange30dPercent:
        data.market_data?.price_change_percentage_30d ?? null,
      marketCap: data.market_data?.market_cap?.usd ?? null,
      fullyDilutedValuation:
        data.market_data?.fully_diluted_valuation?.usd ?? null,
      totalVolume24h: data.market_data?.total_volume?.usd ?? null,
      rank: data.market_cap_rank ?? null,
      circulatingSupply: data.market_data?.circulating_supply ?? null,
      totalSupply: data.market_data?.total_supply ?? null,
      maxSupply: data.market_data?.max_supply ?? null,
      ath: data.market_data?.ath?.usd ?? null,
      athChangePercent: data.market_data?.ath_change_percentage?.usd ?? null,
      atl: data.market_data?.atl?.usd ?? null,
      atlChangePercent: data.market_data?.atl_change_percentage?.usd ?? null,
      yearHigh: null,
      yearLow: null,
      beta: null,
      peRatio: null,
      eps: null,
      volume: null,
      averageVolume: null,
    };
  } catch {
    return null;
  }
}

async function getFmpProfile(
  symbol: string,
  scope: "profile" | "price",
): Promise<AssetProfile | null> {
  const apiKey = process.env.FMP_API_KEY;

  if (!apiKey) {
    return null;
  }

  try {
    const [profileResponse, quoteResponse] = await Promise.all([
      scope === "profile" ? fetchFmpProfile(symbol, apiKey) : null,
      fetchFmpQuote(symbol, apiKey),
    ]);

    if (!profileResponse && !quoteResponse) {
      return null;
    }

    const [profile] = profileResponse
      ? ((await profileResponse.json()) as FmpProfileResponse)
      : [];
    const [quote] = quoteResponse
      ? ((await quoteResponse.json()) as FmpQuoteResponse)
      : [];

    if (!profile && !quote) {
      return null;
    }

    return {
      source: "FMP",
      summary: normalizeText(profile?.description ?? null),
      website: normalizeText(profile?.website ?? null),
      sector: normalizeText(profile?.sector ?? null),
      industry: normalizeText(profile?.industry ?? null),
      country: normalizeText(profile?.country ?? null),
      currentPrice: quote?.price ?? profile?.price ?? null,
      priceCurrency: "USD",
      priceChange24hPercent:
        quote?.changesPercentage ?? quote?.changePercentage ?? null,
      priceChange7dPercent: null,
      priceChange30dPercent: null,
      marketCap: quote?.marketCap ?? profile?.mktCap ?? profile?.marketCap ?? null,
      fullyDilutedValuation: null,
      totalVolume24h: quote?.volume ?? null,
      rank: null,
      circulatingSupply: null,
      totalSupply: null,
      maxSupply: null,
      ath: null,
      athChangePercent: null,
      atl: null,
      atlChangePercent: null,
      yearHigh: quote?.yearHigh ?? getRangeValue(profile?.range, "high"),
      yearLow: quote?.yearLow ?? getRangeValue(profile?.range, "low"),
      beta: profile?.beta ?? null,
      peRatio: quote?.pe ?? null,
      eps: quote?.eps ?? null,
      volume: quote?.volume ?? null,
      averageVolume: quote?.avgVolume ?? profile?.volAvg ?? null,
    };
  } catch {
    return null;
  }
}

async function fetchFmpQuote(
  symbol: string,
  apiKey: string,
): Promise<Response | null> {
  const urls = [
    `https://financialmodelingprep.com/stable/quote?symbol=${encodeURIComponent(
      symbol,
    )}&apikey=${encodeURIComponent(apiKey)}`,
    `https://financialmodelingprep.com/api/v3/quote/${encodeURIComponent(
      symbol,
    )}?apikey=${encodeURIComponent(apiKey)}`,
  ];

  for (const url of urls) {
    const response = await fetch(url, {
      next: {
        revalidate: 5 * 60,
      },
    });

    if (response.ok) {
      return response;
    }
  }

  return null;
}

async function fetchFmpProfile(
  symbol: string,
  apiKey: string,
): Promise<Response | null> {
  const urls = [
    `https://financialmodelingprep.com/stable/profile?symbol=${encodeURIComponent(
      symbol,
    )}&apikey=${encodeURIComponent(apiKey)}`,
    `https://financialmodelingprep.com/api/v3/profile/${encodeURIComponent(
      symbol,
    )}?apikey=${encodeURIComponent(apiKey)}`,
  ];

  for (const url of urls) {
    const response = await fetch(url, {
      next: {
        revalidate: 60 * 60,
      },
    });

    if (response.ok) {
      return response;
    }
  }

  return null;
}

function getLocalFallbackProfile(input: {
  provider: string;
  providerSymbol: string;
  symbol: string;
  name: string;
  type: AssetType;
}): AssetProfile {
  return {
    source: "Local portfolio",
    summary:
      input.type === AssetType.CRYPTO
        ? `${input.name} is tracked in the portfolio as ${input.symbol}. External CoinGecko profile data is not available for this saved provider symbol.`
        : `${input.name} is tracked in the portfolio as ${input.symbol}. Add FMP_API_KEY to load external company profile data for stocks and ETFs.`,
    website: null,
    sector: null,
    industry: null,
    country: null,
    currentPrice: null,
    priceCurrency: "USD",
    priceChange24hPercent: null,
    priceChange7dPercent: null,
    priceChange30dPercent: null,
    marketCap: null,
    fullyDilutedValuation: null,
    totalVolume24h: null,
    rank: null,
    circulatingSupply: null,
    totalSupply: null,
    maxSupply: null,
    ath: null,
    athChangePercent: null,
    atl: null,
    atlChangePercent: null,
    yearHigh: null,
    yearLow: null,
    beta: null,
    peRatio: null,
    eps: null,
    volume: null,
    averageVolume: null,
  };
}

function getRangeValue(range: string | undefined, side: "high" | "low") {
  const [low, high] = range?.split("-").map((value) => Number(value)) ?? [];
  const value = side === "high" ? high : low;

  return Number.isFinite(value) ? value : null;
}

function normalizeText(value: string | null): string | null {
  const normalized = value
    ?.replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return normalized ? normalized : null;
}

function getFirstNonEmpty(values: string[]): string | null {
  return values.map((value) => normalizeText(value)).find(Boolean) ?? null;
}

const knownCoinGeckoIds: Record<string, string> = {
  ADA: "cardano",
  AVAX: "avalanche-2",
  BNB: "binancecoin",
  BTC: "bitcoin",
  DOGE: "dogecoin",
  DOT: "polkadot",
  ETH: "ethereum",
  LINK: "chainlink",
  LTC: "litecoin",
  MATIC: "matic-network",
  SOL: "solana",
  TON: "the-open-network",
  TRX: "tron",
  UNI: "uniswap",
  USDC: "usd-coin",
  USDT: "tether",
  XRP: "ripple",
};
