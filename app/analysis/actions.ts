"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { startDeepAnalysis } from "@/lib/analysis/orchestrator";
import { getAnalysisRunRestartInput } from "@/lib/analysis/repository";

const portfolioAnalysisFormSchema = z.object({
  positionId: z.string().min(1),
});

const watchlistAnalysisFormSchema = z.object({
  watchlistItemId: z.string().min(1),
});

const restartAnalysisFormSchema = z.object({
  agentRunId: z.string().min(1),
});

export async function startPortfolioAnalysis(formData: FormData) {
  const input = portfolioAnalysisFormSchema.parse(Object.fromEntries(formData));
  const result = await startDeepAnalysis({
    positionId: input.positionId,
    source: "portfolio",
  });

  revalidatePath("/analysis");
  revalidatePath(`/analysis/${result.agentRunId}`);
  redirect(buildAnalysisRedirectUrl(result));
}

export async function startWatchlistAnalysis(formData: FormData) {
  const input = watchlistAnalysisFormSchema.parse(Object.fromEntries(formData));
  const result = await startDeepAnalysis({
    source: "watchlist",
    watchlistItemId: input.watchlistItemId,
  });

  revalidatePath("/analysis");
  revalidatePath(`/analysis/${result.agentRunId}`);
  redirect(buildAnalysisRedirectUrl(result));
}

export async function restartAnalysis(formData: FormData) {
  const input = restartAnalysisFormSchema.parse(Object.fromEntries(formData));
  const restartInput = await getAnalysisRunRestartInput(input.agentRunId);
  const result = await startDeepAnalysis(restartInput);

  revalidatePath("/analysis");
  revalidatePath(`/analysis/${result.agentRunId}`);
  redirect(buildAnalysisRedirectUrl(result));
}

function buildAnalysisRedirectUrl(result: {
  agentRunId: string;
  status: "SUCCEEDED" | "FAILED";
}) {
  const toast = result.status === "SUCCEEDED" ? "success" : "error";

  return `/analysis/${result.agentRunId}?analysisToast=${toast}`;
}
