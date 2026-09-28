import { AssetType, InvestmentIntent, WatchlistPriority } from "@prisma/client";
import { z } from "zod";
import { SUPPORTED_PORTFOLIO_CURRENCIES } from "@/lib/portfolio/currencies";

const symbolSchema = z
  .string()
  .trim()
  .min(1)
  .max(24)
  .transform((value) => value.toUpperCase());

const optionalTextSchema = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? null : value));

const optionalExchangeSchema = z
  .string()
  .trim()
  .max(80)
  .transform((value) => (value.length === 0 ? null : value));

const providerSchema = z
  .string()
  .trim()
  .min(1)
  .max(40)
  .transform((value) => value.toLowerCase());

const providerSymbolSchema = z.string().trim().min(1).max(120);

const supportedCurrencySchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .pipe(z.enum(SUPPORTED_PORTFOLIO_CURRENCIES));

const optionalNonNegativeNumberSchema = z
  .union([z.literal(""), z.coerce.number().finite().nonnegative()])
  .transform((value) => (value === "" ? null : value));

export const watchlistItemFormSchema = z.object({
  watchlistItemId: z.string().optional(),
  symbol: symbolSchema,
  name: z.string().trim().min(1).max(120),
  assetType: z.nativeEnum(AssetType),
  assetCurrency: supportedCurrencySchema,
  exchange: optionalExchangeSchema,
  provider: providerSchema,
  providerSymbol: providerSymbolSchema,
  investmentIntent: z.nativeEnum(InvestmentIntent),
  priority: z.nativeEnum(WatchlistPriority),
  targetEntryPrice: optionalNonNegativeNumberSchema,
  notes: optionalTextSchema,
});

export const watchlistItemUpdateFormSchema = watchlistItemFormSchema.extend({
  watchlistItemId: z.string().min(1),
});

export const watchlistItemDeleteFormSchema = z.object({
  watchlistItemId: z.string().min(1),
});

export type WatchlistItemFormInput = z.infer<typeof watchlistItemFormSchema>;
export type WatchlistItemUpdateFormInput = z.infer<
  typeof watchlistItemUpdateFormSchema
>;
