import Link from "next/link";
import { restartAnalysis } from "@/app/analysis/actions";
import { AnalysisAutoRefresh } from "@/components/analysis/analysis-auto-refresh";
import { RefreshAnalysisForm } from "@/components/analysis/analysis-action-button";
import { HomeIcon } from "@/components/ui/icons";
import { ToastViewport } from "@/components/ui/toast";
import { Tooltip } from "@/components/ui/tooltip";
import { getAnalysisHistory } from "@/lib/analysis/repository";

export const dynamic = "force-dynamic";

export default async function AnalysisHistoryPage() {
  let runs: Awaited<ReturnType<typeof getAnalysisHistory>>;

  try {
    runs = await getAnalysisHistory();
  } catch (error) {
    return <AnalysisSetupState error={error} />;
  }
  const hasActiveRun = runs.some((run) => isActiveStatus(run.status));

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-6">
        <header className="flex flex-col gap-3 border-b border-zinc-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <Link className="text-sm font-medium text-zinc-500" href="/">
              AI Investment Assistant
            </Link>
            <h1 className="mt-2 text-2xl font-semibold">Deep Analysis</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Manual TradingAgents-inspired analysis history. Advisory-only, no
              real trade execution.
            </p>
          </div>
          <Tooltip label="Home">
            <Link
              aria-label="Home"
              className="grid size-9 place-items-center rounded border border-zinc-300 text-zinc-700 hover:bg-zinc-100"
              href="/"
            >
              <HomeIcon className="size-4" />
            </Link>
          </Tooltip>
        </header>

        {runs.length === 0 ? (
          <section className="rounded border border-dashed border-zinc-300 bg-white px-5 py-10 text-center">
            <p className="text-sm font-medium text-zinc-700">
              No analysis runs yet
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Start AI analysis from a portfolio position or watchlist item.
            </p>
          </section>
        ) : (
          <section className="overflow-hidden rounded border border-zinc-200 bg-white">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Asset</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Intent</th>
                  <th className="px-4 py-3 font-semibold">Recommendation</th>
                  <th className="px-4 py-3 font-semibold">Risk</th>
                  <th className="px-4 py-3 font-semibold">AI calls</th>
                  <th className="px-4 py-3 font-semibold">Last scan</th>
                  <th className="w-12 px-4 py-3 font-semibold">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {runs.map((run) => (
                  <tr className="hover:bg-zinc-50" key={run.id}>
                    <td className="p-0">
                      <Link
                        className="block px-4 py-3"
                        href={`/analysis/${run.id}`}
                      >
                        <span className="font-medium text-zinc-950">
                          {run.asset.symbol}
                        </span>
                        <span className="mt-1 block text-xs text-zinc-500">
                          {run.asset.name}
                        </span>
                      </Link>
                    </td>
                    <td className="p-0">
                      <Link className="block px-4 py-3" href={`/analysis/${run.id}`}>
                        <StatusBadge status={run.status} />
                      </Link>
                    </td>
                    <td className="p-0">
                      <Link className="block px-4 py-3" href={`/analysis/${run.id}`}>
                        {formatEnum(run.requestedIntent)}
                      </Link>
                    </td>
                    <td className="p-0">
                      <Link className="block px-4 py-3" href={`/analysis/${run.id}`}>
                        {run.report?.recommendationLabel ?? "N/A"}
                      </Link>
                    </td>
                    <td className="p-0">
                      <Link className="block px-4 py-3" href={`/analysis/${run.id}`}>
                        {run.report?.riskLevel ?? "N/A"}
                      </Link>
                    </td>
                    <td className="p-0">
                      <Link className="block px-4 py-3" href={`/analysis/${run.id}`}>
                        {run.usageRecords.length}
                      </Link>
                    </td>
                    <td className="p-0">
                      <Link className="block px-4 py-3" href={`/analysis/${run.id}`}>
                        {formatDateTime(run.completedAt ?? run.updatedAt)}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <RefreshAnalysisForm
                        action={restartAnalysis}
                        agentRunId={run.id}
                        disabled={isActiveStatus(run.status)}
                        symbol={run.asset.symbol}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
        <AnalysisAutoRefresh enabled={hasActiveRun} />
        <ToastViewport />
      </div>
    </main>
  );
}

function AnalysisSetupState({ error }: { error: unknown }) {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-5 py-6">
        <header className="border-b border-zinc-200 pb-5">
          <Link className="text-sm font-medium text-zinc-500" href="/">
            AI Investment Assistant
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">Deep Analysis setup</h1>
        </header>
        <section className="rounded border border-amber-300 bg-amber-50 p-4">
          <h2 className="text-sm font-semibold uppercase text-amber-900">
            Database unavailable
          </h2>
          <p className="mt-2 text-sm leading-6 text-amber-900">
            Apply the Phase 2 migration and regenerate Prisma client before
            using Deep Analysis.
          </p>
          <pre className="mt-3 max-h-96 overflow-auto rounded border border-amber-200 bg-white p-3 text-xs text-zinc-700">
            {getErrorMessage(error)}
          </pre>
        </section>
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const className =
    status === "SUCCEEDED"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "FAILED"
        ? "border-red-200 bg-red-50 text-red-700"
        : status === "RUNNING" || status === "PENDING"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-zinc-200 bg-zinc-50 text-zinc-600";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border px-2 py-1 text-xs font-medium uppercase ${className}`}
    >
      <StatusIcon status={status} />
      {status}
    </span>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "SUCCEEDED") {
    return (
      <svg aria-hidden="true" className="size-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="m5 12 4 4L19 6" />
      </svg>
    );
  }

  if (status === "FAILED") {
    return (
      <svg aria-hidden="true" className="size-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="size-3 animate-spin" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M21 12a9 9 0 1 1-3.2-6.9" />
    </svg>
  );
}

function isActiveStatus(status: string): boolean {
  return status === "PENDING" || status === "RUNNING";
}

function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function formatEnum(value: string): string {
  return value.toLowerCase().replaceAll("_", " ");
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown database error";
}
