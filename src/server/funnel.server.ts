import type { StoredEvent } from "./store.server";

export type FunnelPeriod = "24h" | "7d" | "30d" | "all";

/** Short labels for questions p1–p7 (dashboard). */
const QUESTION_LABELS: readonly string[] = [
  "Autoavaliação geral",
  "Estratégia de estudo",
  "Português",
  "Matemática",
  "Informática",
  "Frequência de estudo",
  "Expectativa do material",
];

/** Funnel level per event; -1 = auxiliary event, outside the funnel. */
function levelOf(e: StoredEvent): number {
  switch (e.event) {
    case "page_view":
      return 0;
    case "quiz_started":
      return 1;
    case "lead_registered":
      return 2;
    case "question_answered":
      return typeof e.step === "number" ? 2 + Math.min(Math.max(e.step, 1), 7) : 2;
    case "quiz_completed":
      return 10;
    case "result_viewed":
      return 11;
    case "offer_viewed":
      return 12;
    case "checkout_clicked":
      return 13;
    default:
      return -1;
  }
}

const STEP_LABELS: readonly string[] = [
  "Entrou na página",
  "Começou o quiz",
  "Cadastrou o nome",
  "Respondeu p1 — Autoavaliação geral",
  "Respondeu p2 — Estratégia de estudo",
  "Respondeu p3 — Português",
  "Respondeu p4 — Matemática",
  "Respondeu p5 — Informática",
  "Respondeu p6 — Frequência de estudo",
  "Respondeu p7 — Expectativa do material",
  "Finalizou o quiz",
  "Viu o resultado",
  "Viu a oferta",
  "Clicou no checkout",
];

const PERIOD_HOURS: Record<Exclude<FunnelPeriod, "all">, number> = {
  "24h": 24,
  "7d": 168,
  "30d": 720,
};
const ACTIVE_WINDOW_MS = 30 * 60 * 1000;
const CHECKOUT_LEVEL = 13;

export interface FunnelRow {
  key: string;
  label: string;
  sessions: number;
  pctOfEntries: number;
  pctOfPrev: number;
}

export interface QuestionRow {
  step: number;
  label: string;
  reached: number;
  answered: number;
  abandoned: number;
  abandonRate: number;
}

export interface UtmRow {
  label: string;
  entries: number;
  leads: number;
  checkouts: number;
}

export interface LeadRow {
  sessionId: string;
  name: string;
  ts: string;
  furthestLabel: string;
  clickedCheckout: boolean;
  utmLabel: string;
  inProgress: boolean;
}

export interface FunnelTotals {
  sessions: number;
  entries: number;
  starts: number;
  leads: number;
  completions: number;
  checkoutClicks: number;
  entryToCheckoutPct: number;
  activeSessions: number;
}

export interface FunnelReport {
  generatedAt: string;
  period: FunnelPeriod;
  funnel: FunnelRow[];
  questions: QuestionRow[];
  worstQuestion: QuestionRow | null;
  utm: UtmRow[];
  leads: LeadRow[];
  totals: FunnelTotals;
}

interface SessionAgg {
  sessionId: string;
  maxLevel: number;
  maxAnswered: number;
  firstTs: string;
  lastTs: string;
  name?: string;
  utm?: Record<string, string>;
  checkout: boolean;
}

function utmLabel(utm?: Record<string, string>): string {
  if (!utm) return "direto / sem UTM";
  const source = utm.utm_source ?? "?";
  const medium = utm.utm_medium ? `/${utm.utm_medium}` : "";
  const campaign = utm.utm_campaign ? ` (${utm.utm_campaign})` : "";
  return `${source}${medium}${campaign}`;
}

/** Aggregates raw events into the funnel report shown on /admin. */
export function buildFunnel(events: StoredEvent[], period: FunnelPeriod): FunnelReport {
  const cutoff = period === "all" ? 0 : Date.now() - PERIOD_HOURS[period] * 3_600_000;
  const sessions = new Map<string, SessionAgg>();
  for (const e of events) {
    const ts = Date.parse(e.ts);
    if (!Number.isFinite(ts) || ts < cutoff) continue;
    let s = sessions.get(e.session_id);
    if (!s) {
      s = {
        sessionId: e.session_id,
        maxLevel: -1,
        maxAnswered: 0,
        firstTs: e.ts,
        lastTs: e.ts,
        checkout: false,
      };
      sessions.set(e.session_id, s);
    }
    const level = levelOf(e);
    if (level > s.maxLevel) s.maxLevel = level;
    if (ts < Date.parse(s.firstTs)) s.firstTs = e.ts;
    if (ts >= Date.parse(s.lastTs)) s.lastTs = e.ts;
    if (e.event === "question_answered" && typeof e.step === "number") {
      s.maxAnswered = Math.max(s.maxAnswered, e.step);
    }
    if (e.event === "lead_registered" && e.name) s.name = e.name;
    if (!s.utm && e.utm && Object.keys(e.utm).length > 0) s.utm = e.utm;
    if (e.event === "checkout_clicked") s.checkout = true;
  }

  const all = [...sessions.values()];
  const reaching = (level: number): number => all.filter((s) => s.maxLevel >= level).length;
  const answeredAtLeast = (step: number): number => all.filter((s) => s.maxAnswered >= step).length;

  const entries = reaching(0);
  const funnel: FunnelRow[] = STEP_LABELS.map((label, level) => ({
    key: `l${level}`,
    label,
    sessions: reaching(level),
    pctOfEntries: entries ? Math.round((reaching(level) / entries) * 1000) / 10 : 0,
    pctOfPrev:
      level === 0 || reaching(level - 1) === 0
        ? 100
        : Math.round((reaching(level) / reaching(level - 1)) * 1000) / 10,
  }));

  const questions: QuestionRow[] = QUESTION_LABELS.map((label, i) => {
    const step = i + 1;
    const reached = step === 1 ? reaching(2) : answeredAtLeast(step - 1);
    const answered = answeredAtLeast(step);
    const abandoned = Math.max(reached - answered, 0);
    return {
      step,
      label,
      reached,
      answered,
      abandoned,
      abandonRate: reached ? Math.round((abandoned / reached) * 1000) / 10 : 0,
    };
  });
  const withAbandon = questions.filter((q) => q.reached > 0 && q.abandoned > 0);
  const worstQuestion = withAbandon.length
    ? withAbandon.reduce((worst, q) => (q.abandonRate > worst.abandonRate ? q : worst))
    : null;

  const utmMap = new Map<string, { entries: number; leads: number; checkouts: number }>();
  for (const s of all) {
    const label = utmLabel(s.utm);
    const row = utmMap.get(label) ?? { entries: 0, leads: 0, checkouts: 0 };
    row.entries += 1;
    if (s.maxLevel >= 2) row.leads += 1;
    if (s.checkout) row.checkouts += 1;
    utmMap.set(label, row);
  }
  const utm = [...utmMap.entries()]
    .map(([label, r]) => ({ label, ...r }))
    .sort((a, b) => b.entries - a.entries);

  const now = Date.now();
  const isActive = (s: SessionAgg): boolean =>
    !s.checkout && s.maxLevel < CHECKOUT_LEVEL && now - Date.parse(s.lastTs) < ACTIVE_WINDOW_MS;

  const leadSessions = all
    .filter((s) => s.name)
    .sort((a, b) => Date.parse(b.lastTs) - Date.parse(a.lastTs));
  const leads: LeadRow[] = leadSessions.slice(0, 100).map((s) => ({
    sessionId: s.sessionId,
    name: s.name ?? "",
    ts: s.lastTs,
    furthestLabel: STEP_LABELS[Math.max(s.maxLevel, 0)] ?? "?",
    clickedCheckout: s.checkout,
    utmLabel: utmLabel(s.utm),
    inProgress: isActive(s),
  }));

  const checkoutClicks = reaching(CHECKOUT_LEVEL);
  const totals: FunnelTotals = {
    sessions: all.length,
    entries,
    starts: reaching(1),
    leads: reaching(2),
    completions: reaching(10),
    checkoutClicks,
    entryToCheckoutPct: entries ? Math.round((checkoutClicks / entries) * 1000) / 10 : 0,
    activeSessions: all.filter(isActive).length,
  };

  return {
    generatedAt: new Date().toISOString(),
    period,
    funnel,
    questions,
    worstQuestion,
    utm,
    leads,
    totals,
  };
}
