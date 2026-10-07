import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { appendEvent } from "@/server/store.server";

const logEventInput = z.object({
  session_id: z.string().min(8).max(64),
  event: z.enum([
    "page_view",
    "quiz_started",
    "lead_registered",
    "question_answered",
    "quiz_completed",
    "result_viewed",
    "diagnosis_viewed",
    "product_viewed",
    "offer_viewed",
    "carousel_interacted",
    "checkout_clicked",
  ]),
  step: z.number().int().min(1).max(7).optional(),
  answer: z.string().max(120).optional(),
  name: z.string().max(80).optional(),
  utm: z.record(z.string().max(120)).optional(),
  referrer: z.string().max(300).optional(),
  user_agent: z.string().max(300).optional(),
});

/** First-party funnel logging: one JSON line per event in DATA_DIR/events.jsonl. */
export const logEvent = createServerFn({ method: "POST" })
  .inputValidator(logEventInput)
  .handler(async ({ data }) => {
    try {
      await appendEvent(data);
      return { ok: true as const };
    } catch {
      return { ok: false as const }; // tracking must never break the funnel
    }
  });
