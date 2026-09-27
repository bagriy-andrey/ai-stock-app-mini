import { AssetType } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";

const searchParamsSchema = z.object({
  q: z.string().trim().min(1).max(80),
  type: z.nativeEnum(AssetType),
});

type AssetSearchResult = {
  symbol: string;
  name: string;
  assetType: AssetType;
  currency: string;
  exchange: string | null;
  provider: string;
  providerSymbol: string;
};

type CoinGeckoSearchResponse = {
  coins?: Array<{
    id?: string;
    name?: string;
    symbol?: string;
  }>;
};

type FmpSearchResponse = Array<{
  symbol?: string;
  name?: string;
  exchangeShortName?: string;
  currency?: string;
}>;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = searchParamsSchema.safeParse({
    q: url.searchParams.get("q"),
    type: url.searchParams.get("type"),
  });

  if (!parsed.success) {
    return NextResponse.json({ results: [] });
  }

  const { q, type } = parsed.data;
  const [localResults, providerResults] = await Promise.all([
    searchLocalAssets(q, type),
    searchProviderAssets(q, type),
  ]);

  return NextResponse.json({
    results: mergeResults([...localResults, ...providerResults]).slice(0, 8),
  });
}

async function searchLocalAssets(
  query: string,
  assetType: AssetType,
): Promise<AssetSearchResult[]> {
  const assets = await prisma.asset.findMany({
    where: {
      assetType,
      OR: [
        {
          symbol: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          name: {
            contains: query,
            mode: "insensitive",
          },
        },
      ],
    },
    orderBy: {
      symbol: "asc",
    },
    take: 8,
  });

  return assets.map((asset) => ({
    symbol: asset.symbol,
    name: asset.name,
    assetType: asset.assetType,
    currency: asset.currency,
    exchange: asset.exchange,
    provider: asset.provider,
    providerSymbol: asset.providerSymbol,
  }));
}

async function searchProviderAssets(
  query: string,
  assetType: AssetType,
): Promise<AssetSearchResult[]> {
  if (assetType === AssetType.CRYPTO) {
    return searchCoinGecko(query);
  }

  return searchFmp(query, assetType);
}

async function searchCoinGecko(query: string): Promise<AssetSearchResult[]> {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(
        query,
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

    const data = (await response.json()) as CoinGeckoSearchResponse;

    return (data.coins ?? []).slice(0, 8).flatMap((coin) => {
      if (!coin.id || !coin.name || !coin.symbol) {
        return [];
      }

      return {
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        assetType: AssetType.CRYPTO,
        currency: "USD",
        exchange: null,
        provider: "coingecko",
        providerSymbol: coin.id,
      };
    });
  } catch {
    return [];
  }
}

async function searchFmp(
  query: string,
  assetType: AssetType,
): Promise<AssetSearchResult[]> {
  const apiKey = process.env.FMP_API_KEY;

  if (!apiKey) {
    return [];
  }

  try {
    const response = await fetch(
      `https://financialmodelingprep.com/stable/search-symbol?query=${encodeURIComponent(
        query,
      )}&apikey=${encodeURIComponent(apiKey)}`,
      {
        next: {
          revalidate: 60 * 60,
        },
      },
    );

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as FmpSearchResponse;

    return data.slice(0, 8).flatMap((asset) => {
      if (!asset.symbol || !asset.name) {
        return [];
      }

      return {
        symbol: asset.symbol.toUpperCase(),
        name: asset.name,
        assetType,
        currency: asset.currency ?? "USD",
        exchange: asset.exchangeShortName ?? null,
        provider: "fmp",
        providerSymbol: asset.symbol.toUpperCase(),
      };
    });
  } catch {
    return [];
  }
}

function mergeResults(results: AssetSearchResult[]): AssetSearchResult[] {
  const seen = new Set<string>();
  const merged: AssetSearchResult[] = [];

  for (const result of results) {
    const key = `${result.provider}:${result.providerSymbol}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    merged.push(result);
  }

  return merged;
}
