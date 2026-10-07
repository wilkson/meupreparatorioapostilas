/** Tracking abstraction: forwards events to GTM dataLayer, GA4 (gtag) and Meta Pixel (fbq) when present, plus a first-party server log for the funnel dashboard. */

import { logEvent } from "@/lib/api/track.fn";

export type TrackingEvent =
  | "page_view"
  | "quiz_started"
  | "lead_registered"
  | "quiz_question_answered"
  | "quiz_completed"
  | "result_viewed"
  | "diagnosis_viewed"
  | "product_viewed"
  | "carousel_interacted"
  | "offer_viewed"
  | "checkout_clicked";

type Params = Record<string, string | number | boolean>;

interface TrackingWindow {
  dataLayer?: unknown[];
  gtag?: (cmd: "event", name: string, params?: Params) => void;
  fbq?: (cmd: "track" | "trackCustom", name: string, params?: Params) => void;
}

const SESSION_KEY = "mp_session_id";

/** Stable per-tab session id used to stitch funnel events server-side. */
export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `s-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

type FirstPartyEvent = Exclude<TrackingEvent, "quiz_question_answered"> | "question_answered";

/** The quiz is a single page — at most one page_view per load (StrictMode double-mounts in dev). */
let pageViewSent = false;

/** Ships a funnel event to the first-party server log (fire-and-forget, never throws). */
function shipFirstParty(event: TrackingEvent, params: Params): void {
  if (typeof window === "undefined") return;
  if (event === "page_view") {
    if (pageViewSent) return;
    pageViewSent = true;
  }
  try {
    const firstPartyEvent: FirstPartyEvent =
      event === "quiz_question_answered" ? "question_answered" : event;
    const payload: {
      session_id: string;
      event: FirstPartyEvent;
      step?: number;
      answer?: string;
      name?: string;
      utm?: Record<string, string>;
      referrer?: string;
      user_agent?: string;
    } = { session_id: getSessionId(), event: firstPartyEvent };
    if (params.question !== undefined) payload.step = Number(params.question);
    if (params.answer !== undefined) payload.answer = String(params.answer).slice(0, 120);
    if (typeof params.name === "string" && params.name) payload.name = params.name.slice(0, 80);
    if (payload.name === undefined) {
      const nome = sessionStorage.getItem("nome_lead");
      if (nome) payload.name = nome.slice(0, 80);
    }
    try {
      const utms = JSON.parse(sessionStorage.getItem("mp_utm_params") ?? "{}") as Record<
        string,
        string
      >;
      if (utms && Object.keys(utms).length > 0) payload.utm = utms;
    } catch {
      /* corrupted entry — skip */
    }
    if (document.referrer) payload.referrer = document.referrer.slice(0, 300);
    if (navigator.userAgent) payload.user_agent = navigator.userAgent.slice(0, 300);
    void logEvent({ data: payload }).catch(() => undefined);
  } catch {
    // Tracking must never break the funnel.
  }
}

export function track(event: TrackingEvent, params: Params = {}): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as TrackingWindow;
  try {
    w.dataLayer?.push({ event, ...params });
    w.gtag?.("event", event, params);
    w.fbq?.("trackCustom", event, params);
  } catch {
    // Tracking must never break the funnel.
  }
  shipFirstParty(event, params);
}

/** Funnel-only event sent exclusively to the first-party log (no Meta/GTM/GA4). */
export function trackFunnel(event: TrackingEvent, params: Params = {}): void {
  shipFirstParty(event, params);
}

/** Meta Pixel standard events used by the funnel. */
export type MetaStandardEvent = "PageView" | "CompleteRegistration" | "Lead" | "InitiateCheckout";

/** Fires a Meta Pixel standard event (fbq "track"). */
export function trackMeta(event: MetaStandardEvent, params: Params = {}): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as TrackingWindow;
  try {
    w.fbq?.("track", event, params);
  } catch {
    // Tracking must never break the funnel.
  }
}
