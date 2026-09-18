// check-average-rate — Phase 3/4
// Returns the enforced price floor for a category, per App.md §3.3/§3.4 and
// Rules.md #5: no floor exists until a category has reached its configured
// minimum completed-job count.
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getUserClient } from "../_shared/supabaseAdmin.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { categoryId } = await req.json();
    if (!categoryId) return jsonResponse({ error: "categoryId is required" }, 400);

    const supabase = getUserClient(req.headers.get("Authorization"));

    const { data: category, error: catErr } = await supabase
      .from("categories")
      .select("id, min_completed_jobs_for_average")
      .eq("id", categoryId)
      .single();
    if (catErr || !category) return jsonResponse({ error: "Category not found" }, 404);

    const { data: rate, error: rateErr } = await supabase
      .from("category_average_rates")
      .select("average_price_cents, completed_job_count")
      .eq("category_id", categoryId)
      .maybeSingle();
    if (rateErr) return jsonResponse({ error: rateErr.message }, 500);

    const hasEnoughData = (rate?.completed_job_count ?? 0) >= category.min_completed_jobs_for_average;

    return jsonResponse({
      categoryId,
      hasFloor: hasEnoughData,
      averagePriceCents: hasEnoughData ? rate?.average_price_cents ?? null : null,
      completedJobCount: rate?.completed_job_count ?? 0,
      minRequired: category.min_completed_jobs_for_average
    });
  } catch (e) {
    return jsonResponse({ error: (e as Error).message }, 500);
  }
});
