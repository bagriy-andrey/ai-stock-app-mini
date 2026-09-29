import type { OpenRouterModel } from "@/lib/model-router/openrouter-client";

export const estimatedModelCallTokens = {
  input: 6_000,
  output: 900,
} as const;

export function parseTokenPrice(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

export function estimateModelCallCost(model: Pick<OpenRouterModel, "pricing">): number {
  const promptPrice = parseTokenPrice(model.pricing?.prompt) ?? 0;
  const completionPrice = parseTokenPrice(model.pricing?.completion) ?? 0;
  const requestPrice = parseTokenPrice(model.pricing?.request) ?? 0;

  return (
    requestPrice +
    promptPrice * estimatedModelCallTokens.input +
    completionPrice * estimatedModelCallTokens.output
  );
}

export function calculateModelUsageCost(input: {
  completionPrice: string | null | undefined;
  inputTokens: number | null | undefined;
  outputTokens: number | null | undefined;
  promptPrice: string | null | undefined;
  requestPrice?: string | null | undefined;
}): number | null {
  if (input.inputTokens === undefined || input.outputTokens === undefined) {
    return null;
  }

  if (input.inputTokens === null || input.outputTokens === null) {
    return null;
  }

  const promptPrice = parseTokenPrice(input.promptPrice);
  const completionPrice = parseTokenPrice(input.completionPrice);
  const requestPrice = parseTokenPrice(input.requestPrice) ?? 0;

  if (promptPrice === null || completionPrice === null) {
    return null;
  }

  return (
    requestPrice +
    promptPrice * input.inputTokens +
    completionPrice * input.outputTokens
  );
}

export function formatUsd(value: number): string {
  if (value === 0) {
    return "$0.0000";
  }

  if (value < 0.0001) {
    return "<$0.0001";
  }

  return `$${value.toFixed(4)}`;
}

export function formatPricePerMillionTokens(
  value: string | null | undefined,
): string {
  const price = parseTokenPrice(value);

  if (price === null) {
    return "N/A";
  }

  return formatUsd(price * 1_000_000);
}
