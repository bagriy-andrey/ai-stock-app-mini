import { AssetType, InvestmentIntent } from "@prisma/client";
import { z } from "zod";
import { SUPPORTED_PORTFOLIO_CURRENCIES } from "@/lib/portfolio/currencies";

export const portfolioExchangeTypes = ["CRYPTO", "STOCK"] as const;

const symbolSchema = z
  .string()
  .trim()
  .min(1)
  .max(24)
  .transform((value) => value.toUpperCase());

const providerSymbolSchema = z.string().trim().min(1).max(120);

const optionalTextSchema = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? null : value));

const exchangeSchema = z.string().trim().min(1).max(80);

const nonNegativeNumberSchema = z.coerce.number().finite().nonnegative();
const positiveNumberSchema = z.coerce.number().finite().positive();
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
  providerSymbol: providerSymbolSchema,
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

export const positionSellFormSchema = z.object({
  positionId: z.string().min(1),
  holdingId: z.string().min(1),
  platform: exchangeSchema,
  currency: supportedCurrencySchema,
  quantity: positiveNumberSchema,
  unitPrice: nonNegativeNumberSchema,
  soldAt: z.coerce.date(),
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

export const cashWithdrawalFormSchema = z.object({
  cashBalanceId: z.string().min(1),
  platform: z.string().trim().min(1).max(80),
  currency: supportedCurrencySchema,
  amount: positiveNumberSchema,
});

export const activityLogDeleteFormSchema = z.object({
  activityLogId: z.string().min(1),
});

export const portfolioBaseCurrencyFormSchema = z.object({
  baseCurrency: supportedCurrencySchema,
});

export const portfolioExchangeFormSchema = z.object({
  name: exchangeSchema,
  type: z.enum(portfolioExchangeTypes),
});

export type PositionFormInput = z.infer<typeof positionFormSchema>;
export type PositionUpdateFormInput = z.infer<typeof positionUpdateFormSchema>;
export type PositionSellFormInput = z.infer<typeof positionSellFormSchema>;
export type CashBalanceFormInput = z.infer<typeof cashBalanceFormSchema>;
export type CashWithdrawalFormInput = z.infer<typeof cashWithdrawalFormSchema>;
export type PortfolioExchangeFormInput = z.infer<
  typeof portfolioExchangeFormSchema
>;
