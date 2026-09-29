import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type {
  AnalysisInputSnapshot,
  AgentExecutionResult,
  FinalReportOutput,
} from "@/lib/analysis/types";
import { analysisPromptVersion } from "@/lib/analysis/types";

export async function createAgentRun(input: {
  snapshot: AnalysisInputSnapshot;
}) {
  return prisma.agentRun.create({
    data: {
      assetId: input.snapshot.asset.id,
      portfolioId: input.snapshot.portfolio?.id ?? null,
      positionId: input.snapshot.position?.id ?? null,
      watchlistItemId: input.snapshot.watchlistItem?.id ?? null,
      requestedIntent: input.snapshot.requestedIntent,
      status: "PENDING",
      inputSnapshot: input.snapshot as unknown as Prisma.InputJsonValue,
    },
  });
}

export async function markAgentRunRunning(agentRunId: string) {
  await prisma.agentRun.update({
    where: {
      id: agentRunId,
    },
    data: {
      startedAt: new Date(),
      status: "RUNNING",
    },
  });
}

export async function markAgentRunFailed(input: {
  agentRunId: string;
  errorMessage: string;
}) {
  await prisma.agentRun.update({
    where: {
      id: input.agentRunId,
    },
    data: {
      completedAt: new Date(),
      errorMessage: input.errorMessage,
      status: "FAILED",
    },
  });
}

export async function persistSuccessfulAnalysis(input: {
  agentRunId: string;
  assetId: string;
  agentResults: AgentExecutionResult[];
  finalReport: FinalReportOutput;
  rawFinalOutput: unknown;
}) {
  await prisma.$transaction(async (tx) => {
    for (const result of input.agentResults) {
      await tx.agentReasoningSummary.create({
        data: {
          agentRunId: input.agentRunId,
          agentName: result.definition.name,
          agentRole: result.definition.role,
          modelTier: result.definition.modelTier,
          model: result.model,
          promptVersion: analysisPromptVersion,
          summary: result.output.summary,
          stance: result.output.stance,
          confidence: result.output.confidence,
          rawOutput: result.rawOutput as Prisma.InputJsonValue,
        },
      });
    }

    await tx.analysisReport.create({
      data: {
        agentRunId: input.agentRunId,
        assetId: input.assetId,
        language: "en",
        title: input.finalReport.title,
        summary: input.finalReport.summary,
        recommendationLabel: input.finalReport.recommendationLabel,
        confidence: input.finalReport.confidence,
        riskLevel: input.finalReport.riskLevel,
        timeHorizon: input.finalReport.timeHorizon,
        thesis: input.finalReport.thesis,
        opportunities: input.finalReport.opportunities,
        risks: input.finalReport.risks,
        portfolioFit: input.finalReport.portfolioFit,
        missingDataWarnings: input.finalReport.missingDataWarnings,
        rawOutput: input.rawFinalOutput as Prisma.InputJsonValue,
      },
    });

    await tx.agentRun.update({
      where: {
        id: input.agentRunId,
      },
      data: {
        completedAt: new Date(),
        status: "SUCCEEDED",
      },
    });
  });
}

export async function getAnalysisHistory() {
  return prisma.agentRun.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      asset: true,
      report: true,
      usageRecords: true,
      reasoningSummaries: true,
    },
  });
}

export async function getAnalysisRunDetail(agentRunId: string) {
  return prisma.agentRun.findUniqueOrThrow({
    where: {
      id: agentRunId,
    },
    include: {
      asset: true,
      report: true,
      reasoningSummaries: {
        orderBy: {
          createdAt: "asc",
        },
      },
      usageRecords: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });
}

export async function getAnalysisRunRestartInput(agentRunId: string) {
  const run = await prisma.agentRun.findUniqueOrThrow({
    where: {
      id: agentRunId,
    },
    select: {
      positionId: true,
      watchlistItemId: true,
    },
  });

  if (run.positionId) {
    return {
      positionId: run.positionId,
      source: "portfolio" as const,
    };
  }

  if (run.watchlistItemId) {
    return {
      source: "watchlist" as const,
      watchlistItemId: run.watchlistItemId,
    };
  }

  throw new Error("Analysis run cannot be restarted because its source was removed.");
}
