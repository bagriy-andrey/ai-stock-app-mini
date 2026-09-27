import { NextResponse } from "next/server";
import { getLatestExchangeRateQuotes } from "@/lib/market-data/exchange-rates";

export const dynamic = "force-dynamic";

export async function GET() {
  const rates = await getLatestExchangeRateQuotes();

  return NextResponse.json(
    {
      rates,
      updatedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
