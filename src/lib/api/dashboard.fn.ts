import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { buildFunnel, type FunnelPeriod } from "@/server/funnel.server";
import { readEvents } from "@/server/store.server";

export type { FunnelReport } from "@/server/funnel.server";

const getFunnelInput = z.object({
  token: z.string().min(1),
  period: z.enum(["24h", "7d", "30d", "all"]),
});

/** Aggregated funnel report for the /admin dashboard. Requires ADMIN_TOKEN. */
export const getFunnel = createServerFn({ method: "POST" })
  .inputValidator(getFunnelInput)
  .handler(async ({ data }) => {
    const expected = process.env.ADMIN_TOKEN;
    if (!expected) throw new Error("ADMIN_TOKEN não configurado no servidor.");
    if (data.token !== expected) throw new Error("Token inválido.");
    const events = await readEvents();
    return buildFunnel(events, data.period satisfies FunnelPeriod);
  });
