import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getUserClient, getAdminClient } from "../_shared/supabaseAdmin.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const userClient = getUserClient(req.headers.get("Authorization"));
    const { data: auth, error: authError } = await userClient.auth.getUser();
    if (authError || !auth?.user) return jsonResponse({ error: "Not authenticated" }, 401);
    const { action, jobId } = await req.json();
    const admin = getAdminClient();

    if (action === "purchase-verification") {
      const r = await admin.rpc("adjust_wallet_balance", { p_user_id: auth.user.id, p_delta_cents: -1000000, p_type: "verification", p_reference_job_id: null, p_proof_url: null, p_status: "completed" });
      if (r.error) return jsonResponse({ error: r.error.message }, 422);
      const { error } = await admin.from("profiles").update({ is_verified: true }).eq("id", auth.user.id);
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ verified: true });
    }

    if (action === "boost-job") {
      if (!jobId) return jsonResponse({ error: "jobId is required" }, 400);
      const { data: job } = await admin.from("jobs").select("id, client_id, status").eq("id", jobId).single();
      if (!job) return jsonResponse({ error: "Job not found" }, 404);
      if (job.client_id !== auth.user.id || job.status !== "open") return jsonResponse({ error: "Only the owner can boost an open job" }, 403);
      const { data: profile } = await admin.from("profiles").select("subscription_tier").eq("id", auth.user.id).single();
      const amount = profile?.subscription_tier === "elite" ? 70000 : 100000;
      const r = await admin.rpc("adjust_wallet_balance", { p_user_id: auth.user.id, p_delta_cents: -amount, p_type: "boost", p_reference_job_id: jobId, p_proof_url: null, p_status: "completed" });
      if (r.error) return jsonResponse({ error: r.error.message }, 422);
      await admin.from("jobs").update({ is_boosted: true }).eq("id", jobId);
      return jsonResponse({ boosted: true, amountCents: amount });
    }

    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (e) {
    return jsonResponse({ error: (e as Error).message }, 500);
  }
});
