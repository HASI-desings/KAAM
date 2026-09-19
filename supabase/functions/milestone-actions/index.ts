import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getUserClient, getAdminClient } from "../_shared/supabaseAdmin.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const userClient = getUserClient(req.headers.get("Authorization"));
    const { data: auth, error: authError } = await userClient.auth.getUser();
    if (authError || !auth?.user) return jsonResponse({ error: "Not authenticated" }, 401);
    const { jobId, action, amounts, milestoneId } = await req.json();
    const admin = getAdminClient();
    const { data: job } = await admin.from("jobs").select("id, client_id, worker_id, status").eq("id", jobId).single();
    if (!job) return jsonResponse({ error: "Job not found" }, 404);

    if (action === "create-plan") {
      if (auth.user.id !== job.client_id || job.status !== "in_progress") return jsonResponse({ error: "Only the client can create a milestone plan for an active job" }, 403);
      if (!Array.isArray(amounts) || amounts.length < 2) return jsonResponse({ error: "Provide at least two milestone amounts" }, 400);
      const rows = amounts.map((a: number, i: number) => ({ job_id: jobId, sequence: i + 1, amount_cents: Math.round(Number(a)), status: "pending" }));
      const { data, error } = await admin.from("job_milestones").insert(rows).select();
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ milestones: data });
    }

    const { data: milestone } = await admin.from("job_milestones").select("*").eq("id", milestoneId).eq("job_id", jobId).single();
    if (!milestone) return jsonResponse({ error: "Milestone not found" }, 404);

    if (action === "fund") {
      if (auth.user.id !== job.client_id || milestone.status !== "pending") return jsonResponse({ error: "Only the client can fund a pending milestone" }, 403);
      const r = await admin.rpc("adjust_wallet_balance", { p_user_id: job.client_id, p_delta_cents: -milestone.amount_cents, p_type: "job_payment", p_reference_job_id: jobId, p_proof_url: null, p_status: "completed" });
      if (r.error) return jsonResponse({ error: r.error.message }, 422);
      await admin.from("job_milestones").update({ status: "escrowed" }).eq("id", milestoneId);
      return jsonResponse({ funded: true });
    }

    if (action === "release") {
      if (auth.user.id !== job.client_id || milestone.status !== "escrowed" || !job.worker_id) return jsonResponse({ error: "Only the client can release an escrowed milestone" }, 403);
      const r = await admin.rpc("adjust_wallet_balance", { p_user_id: job.worker_id, p_delta_cents: milestone.amount_cents, p_type: "job_payout", p_reference_job_id: jobId, p_proof_url: null, p_status: "completed" });
      if (r.error) return jsonResponse({ error: r.error.message }, 500);
      await admin.from("job_milestones").update({ status: "released" }).eq("id", milestoneId);
      return jsonResponse({ released: true });
    }

    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (e) {
    return jsonResponse({ error: (e as Error).message }, 500);
  }
});
