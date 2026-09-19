import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getUserClient, getAdminClient } from "../_shared/supabaseAdmin.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const userClient = getUserClient(req.headers.get("Authorization"));
    const { data: auth, error: authError } = await userClient.auth.getUser();
    if (authError || !auth?.user) return jsonResponse({ error: "Not authenticated" }, 401);
    const { jobId, action, percent, note } = await req.json();
    if (!jobId || !action) return jsonResponse({ error: "jobId and action are required" }, 400);

    const admin = getAdminClient();
    const { data: job } = await admin.from("jobs").select("id, client_id, worker_id, status, pause_count, escrow_amount_cents").eq("id", jobId).single();
    if (!job) return jsonResponse({ error: "Job not found" }, 404);
    const uid = auth.user.id;
    const isWorker = uid === job.worker_id;
    const isClient = uid === job.client_id;

    if (action === "pause") {
      if (!isWorker || job.status !== "in_progress") return jsonResponse({ error: "Only the assigned worker can pause an active job" }, 403);
      const nextCount = Number(job.pause_count ?? 0) + 1;
      if (nextCount > 1 && Number(job.escrow_amount_cents ?? 0) > 0) {
        const penalty = Math.floor(Number(job.escrow_amount_cents) * 0.5);
        const wallet = await admin.rpc("adjust_wallet_balance", {
          p_user_id: uid, p_delta_cents: -penalty, p_type: "penalty",
          p_reference_job_id: jobId, p_proof_url: null, p_status: "completed"
        });
        if (wallet.error) return jsonResponse({ error: "Second pause requires a 50% penalty, but the worker wallet cannot cover it" }, 422);
        await admin.from("penalties").insert({ job_id: jobId, user_id: uid, reason: "Second pause", amount_cents: penalty });
      }
      await admin.from("jobs").update({ status: "paused", pause_count: nextCount }).eq("id", jobId);
      return jsonResponse({ updated: true, pauseCount: nextCount });
    }

    if (action === "resume") {
      if (!isWorker || job.status !== "paused") return jsonResponse({ error: "Only the assigned worker can resume a paused job" }, 403);
      const { error } = await admin.from("jobs").update({ status: "in_progress" }).eq("id", jobId);
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ updated: true });
    }

    if (action === "mark-submitted") {
      if (!isWorker || !["in_progress", "paused"].includes(job.status)) return jsonResponse({ error: "Only the assigned worker can submit the job" }, 403);
      const { error } = await admin.from("jobs").update({ status: "submitted", progress_percent: 100 }).eq("id", jobId);
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ submitted: true });
    }

    if (action === "post-update") {
      if (!isWorker && !isClient) return jsonResponse({ error: "Job participant only" }, 403);
      const p = Math.max(0, Math.min(100, Number(percent ?? 0)));
      const { error } = await admin.from("job_progress").insert({ job_id: jobId, author_id: uid, note: note ?? null, percent_at_update: p });
      if (error) return jsonResponse({ error: error.message }, 500);
      await admin.from("jobs").update({ progress_percent: p }).eq("id", jobId);
      return jsonResponse({ posted: true });
    }

    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (e) {
    return jsonResponse({ error: (e as Error).message }, 500);
  }
});
