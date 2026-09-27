import { AssetType, InvestmentIntent } from "@prisma/client";
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

const exchangeSchema = z.string().trim().min(1).max(80);

const nonNegativeNumberSchema = z.coerce.number().finite().nonnegative();
const supportedCurrencySchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .pipe(z.enum(SUPPORTED_PORTFOLIO_CURRENCIES));

export const positionFormSchema = z.object({
  positionId: z.string().optional(),
  symbol: symbolSchema,
  name: z.string().trim().min(1).max(120),
  assetType: z.nativeEnum(AssetType),
  assetCurrency: supportedCurrencySchema,
  exchange: exchangeSchema,
  provider: z
    .string()
    .trim()
    .min(1)
    .max(40)
    .transform((value) => value.toLowerCase()),
  providerSymbol: symbolSchema,
  quantity: nonNegativeNumberSchema,
  averageCost: nonNegativeNumberSchema,
  costCurrency: supportedCurrencySchema,
  investmentIntent: z.nativeEnum(InvestmentIntent),
  openedAt: z.coerce.date(),
  notes: optionalTextSchema,
});

export const positionUpdateFormSchema = positionFormSchema.extend({
  positionId: z.string().min(1),
});

export const positionDeleteFormSchema = z.object({
  positionId: z.string().min(1),
});

export const cashBalanceFormSchema = z.object({
  cashBalanceId: z.string().optional(),
  platform: z.string().trim().min(1).max(80),
  currency: supportedCurrencySchema,
  amount: nonNegativeNumberSchema,
});

export const cashBalanceDeleteFormSchema = z.object({
  cashBalanceId: z.string().min(1),
});

export const portfolioBaseCurrencyFormSchema = z.object({
  baseCurrency: supportedCurrencySchema,
});

export type PositionFormInput = z.infer<typeof positionFormSchema>;
export type PositionUpdateFormInput = z.infer<typeof positionUpdateFormSchema>;
export type CashBalanceFormInput = z.infer<typeof cashBalanceFormSchema>;
