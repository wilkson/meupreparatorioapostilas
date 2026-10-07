import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import { getFunnel, type FunnelReport } from "@/lib/api/dashboard.fn";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ name: "robots", content: "noindex, nofollow" }] }),
  component: AdminPage,
});

type Period = "24h" | "7d" | "30d" | "all";

const PERIODS: { key: Period; label: string }[] = [
  { key: "24h", label: "24h" },
  { key: "7d", label: "7 dias" },
  { key: "30d", label: "30 dias" },
  { key: "all", label: "Tudo" },
];

const TOKEN_KEY = "mp_admin_token";
const REFRESH_MS = 30_000;

const fmtDateTime = (iso: string): string =>
  new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));

const pct = (n: number): string => `${n.toFixed(1).replace(".", ",")}%`;

function AdminPage() {
  const [token, setToken] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    try {
      return localStorage.getItem(TOKEN_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const [input, setInput] = useState("");
  const [period, setPeriod] = useState<Period>("7d");
  const [data, setData] = useState<FunnelReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const report = await getFunnel({ data: { token, period } });
      setData(report);
      setError(null);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro ao carregar o funil.";
      setError(message);
      if (message.includes("Token") || message.includes("ADMIN")) {
        try {
          localStorage.removeItem(TOKEN_KEY);
        } catch {
          /* storage unavailable */
        }
        setToken("");
        setData(null);
      }
    } finally {
      setLoading(false);
    }
  }, [token, period]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const id = window.setInterval(() => void load(), REFRESH_MS);
    return () => window.clearInterval(id);
  }, [load]);

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 text-neutral-100">
        <form
          className="w-full max-w-sm space-y-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-6"
          onSubmit={(e) => {
            e.preventDefault();
            const value = input.trim();
            if (!value) return;
            try {
              localStorage.setItem(TOKEN_KEY, value);
            } catch {
              /* storage unavailable */
            }
            setToken(value);
          }}
        >
          <h1 className="text-lg font-semibold">Dashboard do funil</h1>
          <p className="text-sm text-neutral-400">Informe o token de acesso (ADMIN_TOKEN).</p>
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Token"
            className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm outline-none focus:border-emerald-500"
            autoFocus
          />
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button
            type="submit"
            className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            Entrar
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-8 text-neutral-100 sm:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">Funil — Quiz Apostilas</h1>
            {data ? (
              <p className="text-xs text-neutral-500">
                Atualizado às {new Date(data.generatedAt).toLocaleTimeString("pt-BR")} ·
                auto-refresh 30s
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPeriod(p.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  period === p.key
                    ? "bg-emerald-600 text-white"
                    : "bg-neutral-900 text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {p.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-neutral-100 disabled:opacity-50"
            >
              {loading ? "Carregando…" : "Atualizar"}
            </button>
          </div>
        </header>

        {error ? (
          <p className="rounded-lg border border-red-900 bg-red-950/50 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        ) : null}

        {data ? (
          <>
            <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {[
                { label: "Entradas", value: String(data.totals.entries) },
                { label: "Começaram", value: String(data.totals.starts) },
                { label: "Cadastros", value: String(data.totals.leads) },
                { label: "Finalizaram", value: String(data.totals.completions) },
                { label: "Cliques checkout", value: String(data.totals.checkoutClicks) },
                { label: "Entrada → checkout", value: pct(data.totals.entryToCheckoutPct) },
              ].map((c) => (
                <div
                  key={c.label}
                  className="rounded-xl border border-neutral-800 bg-neutral-900 p-4"
                >
                  <p className="text-xs text-neutral-400">{c.label}</p>
                  <p className="mt-1 text-xl font-bold">{c.value}</p>
                </div>
              ))}
            </section>

            <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 sm:p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-400">
                Funil completo
              </h2>
              <div className="space-y-2">
                {data.funnel.map((row, i) => {
                  const prevSessions = i > 0 ? data.funnel[i - 1]!.sessions : row.sessions;
                  const drop = Math.max(prevSessions - row.sessions, 0);
                  return (
                    <div key={row.key} className="flex items-center gap-3 text-sm">
                      <span className="w-56 shrink-0 truncate text-neutral-300" title={row.label}>
                        {row.label}
                      </span>
                      <div className="relative h-7 flex-1 overflow-hidden rounded bg-neutral-800">
                        <div
                          className="absolute inset-y-0 left-0 rounded bg-emerald-700/70"
                          style={{
                            width: `${Math.max(row.pctOfEntries, row.sessions > 0 ? 2 : 0)}%`,
                          }}
                        />
                        <span className="absolute inset-y-0 left-2 flex items-center text-xs font-medium">
                          {row.sessions}
                        </span>
                      </div>
                      <span className="w-16 shrink-0 text-right text-xs text-neutral-400">
                        {pct(row.pctOfEntries)}
                      </span>
                      <span className="w-24 shrink-0 text-right text-xs text-neutral-500">
                        {i === 0 ? "—" : `${pct(row.pctOfPrev)} · −${drop}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 sm:p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-400">
                Abandono por pergunta
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-neutral-500">
                      <th className="pb-2">Pergunta</th>
                      <th className="pb-2 text-right">Chegaram</th>
                      <th className="pb-2 text-right">Responderam</th>
                      <th className="pb-2 text-right">Abandonaram</th>
                      <th className="pb-2 text-right">Taxa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.questions.map((q) => {
                      const worst = data.worstQuestion?.step === q.step;
                      return (
                        <tr
                          key={q.step}
                          className={`border-t border-neutral-800 ${worst ? "bg-red-950/30" : ""}`}
                        >
                          <td className="py-2 text-neutral-300">
                            P{q.step} — {q.label}
                            {worst ? (
                              <span className="ml-2 rounded bg-red-900/60 px-1.5 py-0.5 text-[10px] font-semibold text-red-200">
                                maior abandono
                              </span>
                            ) : null}
                          </td>
                          <td className="py-2 text-right">{q.reached}</td>
                          <td className="py-2 text-right">{q.answered}</td>
                          <td className="py-2 text-right text-red-300">{q.abandoned}</td>
                          <td className="py-2 text-right text-neutral-400">{pct(q.abandonRate)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 sm:p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-400">
                Origem (UTM)
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-neutral-500">
                      <th className="pb-2">Origem</th>
                      <th className="pb-2 text-right">Entradas</th>
                      <th className="pb-2 text-right">Cadastros</th>
                      <th className="pb-2 text-right">Cliques checkout</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.utm.map((u) => (
                      <tr key={u.label} className="border-t border-neutral-800">
                        <td className="py-2 text-neutral-300">{u.label}</td>
                        <td className="py-2 text-right">{u.entries}</td>
                        <td className="py-2 text-right">{u.leads}</td>
                        <td className="py-2 text-right">{u.checkouts}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 sm:p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-400">
                Leads ({data.leads.length} mais recentes)
              </h2>
              {data.leads.length === 0 ? (
                <p className="text-sm text-neutral-500">Nenhum cadastro no período.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-neutral-500">
                        <th className="pb-2">Nome</th>
                        <th className="pb-2">Última atividade</th>
                        <th className="pb-2">Até onde chegou</th>
                        <th className="pb-2">Checkout</th>
                        <th className="pb-2">Origem</th>
                        <th className="pb-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.leads.map((l) => (
                        <tr key={l.sessionId} className="border-t border-neutral-800">
                          <td className="py-2 text-neutral-300">{l.name}</td>
                          <td className="py-2 text-neutral-400">{fmtDateTime(l.ts)}</td>
                          <td className="py-2 text-neutral-400">{l.furthestLabel}</td>
                          <td className="py-2">{l.clickedCheckout ? "✓" : "—"}</td>
                          <td className="py-2 text-neutral-500">{l.utmLabel}</td>
                          <td className="py-2">
                            {l.inProgress ? (
                              <span className="rounded bg-amber-900/60 px-1.5 py-0.5 text-[10px] font-semibold text-amber-200">
                                em andamento
                              </span>
                            ) : (
                              <span className="text-neutral-600">encerrada</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        ) : !error ? (
          <p className="text-sm text-neutral-500">Carregando…</p>
        ) : null}
      </div>
    </main>
  );
}
