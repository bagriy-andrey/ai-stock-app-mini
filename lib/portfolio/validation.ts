import { AssetType, InvestmentIntent } from "@prisma/client";
import { z } from "zod";

const currencySchema = z
  .string()
  .trim()
  .min(3)
  .max(3)
  .transform((value) => value.toUpperCase());

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

const nonNegativeNumberSchema = z.coerce.number().finite().nonnegative();
const cashCurrencySchema = z
  .string()
  .trim()
  .transform((value) => value.toUpperCase())
  .pipe(z.enum(["USD", "EUR", "PLN"]));

export const positionFormSchema = z.object({
  positionId: z.string().optional(),
  symbol: symbolSchema,
  name: z.string().trim().min(1).max(120),
  assetType: z.nativeEnum(AssetType),
  assetCurrency: currencySchema,
  exchange: optionalTextSchema,
  provider: z
    .string()
    .trim()
    .min(1)
    .max(40)
    .transform((value) => value.toLowerCase()),
  providerSymbol: symbolSchema,
  quantity: nonNegativeNumberSchema,
  averageCost: nonNegativeNumberSchema,
  costCurrency: currencySchema,
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
  currency: cashCurrencySchema,
  amount: nonNegativeNumberSchema,
});

export const cashBalanceDeleteFormSchema = z.object({
  cashBalanceId: z.string().min(1),
});

export type PositionFormInput = z.infer<typeof positionFormSchema>;
export type PositionUpdateFormInput = z.infer<typeof positionUpdateFormSchema>;
export type CashBalanceFormInput = z.infer<typeof cashBalanceFormSchema>;
