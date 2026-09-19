import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getUserClient, getAdminClient } from "../_shared/supabaseAdmin.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const userClient = getUserClient(req.headers.get("Authorization"));
    const { data: auth, error: authError } = await userClient.auth.getUser();
    if (authError || !auth?.user) return jsonResponse({ error: "Not authenticated" }, 401);
    const { action, jobId, resolution, disputeId, resolutionText } = await req.json();
    const admin = getAdminClient();
    const { data: caller } = await admin.from("profiles").select("is_admin").eq("id", auth.user.id).single();
    if (!caller?.is_admin) return jsonResponse({ error: "Admin only" }, 403);

    if (action === "list-open") {
      const { data: disputedJobs, error } = await admin.from("jobs").select("id, title, escrow_amount_cents, status").eq("status", "disputed").order("created_at", { ascending: true });
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ disputedJobs: disputedJobs ?? [] });
    }

    if (action === "resolve-job") {
      const { data: job } = await admin.from("jobs").select("id, client_id, worker_id, escrow_amount_cents, status").eq("id", jobId).single();
      if (!job || job.status !== "disputed") return jsonResponse({ error: "Disputed job not found" }, 404);
      const amount = Number(job.escrow_amount_cents ?? 0);
      if (resolution === "refund_client") {
        const r = await admin.rpc("adjust_wallet_balance", { p_user_id: job.client_id, p_delta_cents: amount, p_type: "refund", p_reference_job_id: jobId, p_proof_url: null, p_status: "completed" });
        if (r.error) return jsonResponse({ error: r.error.message }, 500);
      } else if (resolution === "release_worker") {
        if (!job.worker_id) return jsonResponse({ error: "Job has no worker" }, 422);
        const r = await admin.rpc("adjust_wallet_balance", { p_user_id: job.worker_id, p_delta_cents: amount, p_type: "job_payout", p_reference_job_id: jobId, p_proof_url: null, p_status: "completed" });
        if (r.error) return jsonResponse({ error: r.error.message }, 500);
      } else return jsonResponse({ error: "Invalid resolution" }, 400);
      await admin.from("jobs").update({ status: "completed" }).eq("id", jobId);
      return jsonResponse({ resolved: true });
    }

    if (action === "resolve-dispute-record") {
      const { error } = await admin.from("disputes").update({ status: "resolved", resolution: resolutionText ?? null }).eq("id", disputeId);
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ resolved: true });
    }

    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (e) {
    return jsonResponse({ error: (e as Error).message }, 500);
  }
});
