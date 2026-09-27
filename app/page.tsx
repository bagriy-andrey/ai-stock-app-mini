const modules = [
  "Portfolio",
  "Watchlist",
  "Opportunities",
  "Predictions",
  "Reports",
  "Paper Trader",
  "AI Usage",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="border-b border-zinc-200 pb-6">
          <p className="text-sm font-medium text-emerald-700">Phase 0</p>
          <h1 className="mt-2 text-3xl font-semibold">
            AI Investment Assistant
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
            Foundation workspace for portfolio monitoring, watchlist analysis,
            opportunity discovery, structured forecasts, reports, paper trading,
            and AI usage tracking.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded border border-zinc-200 bg-white p-4">
            <p className="text-sm font-medium text-zinc-500">App status</p>
            <p className="mt-2 text-xl font-semibold">Foundation</p>
          </div>
          <div className="rounded border border-zinc-200 bg-white p-4">
            <p className="text-sm font-medium text-zinc-500">Real portfolio</p>
            <p className="mt-2 text-xl font-semibold">Advisory only</p>
          </div>
          <div className="rounded border border-zinc-200 bg-white p-4">
            <p className="text-sm font-medium text-zinc-500">AI trading</p>
            <p className="mt-2 text-xl font-semibold">Paper only</p>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase text-zinc-500">
            Planned modules
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {modules.map((module) => (
              <div
                className="rounded border border-zinc-200 bg-white px-4 py-3 text-sm font-medium"
                key={module}
              >
                {module}
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
