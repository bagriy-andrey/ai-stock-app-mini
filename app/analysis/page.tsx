import Link from "next/link";
import { getAnalysisHistory } from "@/lib/analysis/repository";

export const dynamic = "force-dynamic";

export default async function AnalysisHistoryPage() {
  let runs: Awaited<ReturnType<typeof getAnalysisHistory>>;

  try {
    runs = await getAnalysisHistory();
  } catch (error) {
    return <AnalysisSetupState error={error} />;
  }

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
          <Link
            className="rounded border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            href="/"
          >
            Home
          </Link>
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
                  <th className="px-4 py-3 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {runs.map((run) => (
                  <tr className="hover:bg-zinc-50" key={run.id}>
                    <td className="px-4 py-3">
                      <Link
                        className="font-medium text-zinc-950 hover:text-emerald-700"
                        href={`/analysis/${run.id}`}
                      >
                        {run.asset.symbol}
                      </Link>
                      <p className="mt-1 text-xs text-zinc-500">
                        {run.asset.name}
                      </p>
                    </td>
                    <td className="px-4 py-3">{run.status}</td>
                    <td className="px-4 py-3">{formatEnum(run.requestedIntent)}</td>
                    <td className="px-4 py-3">
                      {run.report?.recommendationLabel ?? "N/A"}
                    </td>
                    <td className="px-4 py-3">{run.report?.riskLevel ?? "N/A"}</td>
                    <td className="px-4 py-3">{run.usageRecords.length}</td>
                    <td className="px-4 py-3">{formatDateTime(run.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
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
