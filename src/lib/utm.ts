import { CHECKOUT_BASE_URL } from "@/lib/quiz-data";

const STORAGE_KEY = "mp_utm_params";

/** Fallback attribution when the visitor arrives without utm_* params. */
const DEFAULT_UTMS: Record<string, string> = { utm_source: "apostilas", utm_medium: "quiz" };

/** Stores inbound utm_* params on first visit (first-touch attribution). */
export function captureUtms(): void {
  if (typeof window === "undefined") return;
  try {
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    const utms: Record<string, string> = {};
    new URLSearchParams(window.location.search).forEach((value, key) => {
      if (key.toLowerCase().startsWith("utm_") && value) utms[key.toLowerCase()] = value;
    });
    if (Object.keys(utms).length) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(utms));
  } catch {
    /* storage unavailable */
  }
}

/** Builds the checkout URL with stored UTMs (or defaults) plus the lead name. */
export function buildCheckoutUrl(nome: string): string {
  let utms: Record<string, string> = {};
  try {
    utms = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    /* corrupted entry — fall back to defaults */
  }
  const finalUtms = Object.keys(utms).length ? utms : DEFAULT_UTMS;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(finalUtms)) params.set(key, value);
  const clean = nome.trim();
  if (clean) params.set("name", clean);
  return `${CHECKOUT_BASE_URL}?${params.toString()}`;
}
