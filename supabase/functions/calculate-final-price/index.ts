// calculate-final-price — Phase 3/4/6
// Server-side authority for the offer price + commission math (Rules.md #1, #4).
// The frontend may show an estimate; this is what actually gets locked in.
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getUserClient } from "../_shared/supabaseAdmin.ts";
import { COMMISSION_RATE } from "../_shared/config.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const supabase = getUserClient(authHeader);
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) return jsonResponse({ error: "Not authenticated" }, 401);

    const { jobId, offeredPriceCents } = await req.json();
    if (!jobId || typeof offeredPriceCents !== "number" || offeredPriceCents <= 0) {
      return jsonResponse({ error: "jobId and a positive offeredPriceCents are required" }, 400);
    }

    const { data: job, error: jobErr } = await supabase
      .from("jobs")
      .select("id, category_id, payment_type")
      .eq("id", jobId)
      .single();
    if (jobErr || !job) return jsonResponse({ error: "Job not found" }, 404);
    if (job.payment_type === "service") {
      return jsonResponse({ error: "This job is service-only; no cash price to calculate" }, 400);
    }

    // Re-validate the category floor server-side — never trust a frontend check alone (Rules.md #24 §2.4).
    const { data: category } = await supabase
      .from("categories")
      .select("min_completed_jobs_for_average")
      .eq("id", job.category_id)
      .single();
    const { data: rate } = await supabase
      .from("category_average_rates")
      .select("average_price_cents, completed_job_count")
      .eq("category_id", job.category_id)
      .maybeSingle();

    const hasFloor = (rate?.completed_job_count ?? 0) >= (category?.min_completed_jobs_for_average ?? Infinity);
    if (hasFloor && rate?.average_price_cents && offeredPriceCents < rate.average_price_cents) {
      return jsonResponse(
        { error: "Offered price is below the enforced category average floor", floorCents: rate.average_price_cents },
        422
      );
    }

    const commissionCents = Math.round(offeredPriceCents * COMMISSION_RATE);
    const finalTotalCents = offeredPriceCents + commissionCents;

    return jsonResponse({
      basePriceCents: offeredPriceCents,
      commissionCents,
      commissionRate: COMMISSION_RATE,
      finalTotalCents
    });
  } catch (e) {
    return jsonResponse({ error: (e as Error).message }, 500);
  }
});
