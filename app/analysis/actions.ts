"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { startDeepAnalysis } from "@/lib/analysis/orchestrator";

const portfolioAnalysisFormSchema = z.object({
  positionId: z.string().min(1),
});

const watchlistAnalysisFormSchema = z.object({
  watchlistItemId: z.string().min(1),
});

export async function startPortfolioAnalysis(formData: FormData) {
  const input = portfolioAnalysisFormSchema.parse(Object.fromEntries(formData));
  const result = await startDeepAnalysis({
    positionId: input.positionId,
    source: "portfolio",
  });

  revalidatePath("/analysis");
  revalidatePath(`/analysis/${result.agentRunId}`);
  redirect(`/analysis/${result.agentRunId}`);
}

export async function startWatchlistAnalysis(formData: FormData) {
  const input = watchlistAnalysisFormSchema.parse(Object.fromEntries(formData));
  const result = await startDeepAnalysis({
    source: "watchlist",
    watchlistItemId: input.watchlistItemId,
  });

  revalidatePath("/analysis");
  revalidatePath(`/analysis/${result.agentRunId}`);
  redirect(`/analysis/${result.agentRunId}`);
}
