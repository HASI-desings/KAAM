// release-escrow — Phase 4/6
// Rules.md #3: never release escrow without (a) explicit client confirmation
// or (b) the auto-release timer having expired, verified server-side.
// Idempotent: a duplicate call on an already-completed job is a no-op (Security.md §2.8).
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getUserClient, getAdminClient } from "../_shared/supabaseAdmin.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const userClient = getUserClient(req.headers.get("Authorization"));
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return jsonResponse({ error: "Not authenticated" }, 401);

    const { jobId, reason } = await req.json(); // reason: "client_confirmed" | "auto_release_timer"
    if (!jobId) return jsonResponse({ error: "jobId is required" }, 400);

    const admin = getAdminClient();
    const { data: job, error: jobErr } = await admin
      .from("jobs")
      .select("id, client_id, worker_id, status, price_min_cents, price_max_cents, auto_release_at")
      .eq("id", jobId)
      .single();
    if (jobErr || !job) return jsonResponse({ error: "Job not found" }, 404);

    if (job.status === "completed") {
      return jsonResponse({ message: "Already released — no action taken (idempotent)." });
    }
    if (job.status !== "submitted" && job.status !== "in_progress") {
      return jsonResponse({ error: `Job is not in a releasable state (status: ${job.status})` }, 409);
    }
    if (!job.worker_id) return jsonResponse({ error: "Job has no assigned worker" }, 422);

    const isClient = userData.user.id === job.client_id;
    const timerExpired = job.auto_release_at ? new Date(job.auto_release_at) <= new Date() : false;

    if (reason === "client_confirmed" && !isClient) {
      return jsonResponse({ error: "Only the client can confirm completion" }, 403);
    }
    if (reason === "client_confirmed" ? false : !timerExpired) {
      return jsonResponse({ error: "Neither client confirmation nor an expired auto-release timer was verified" }, 409);
    }

    // Escrowed amount is authoritative at the price locked when the offer was accepted.
    // (offers.offer_amount_cents is the source of truth — price_min/max on jobs is the posted range.)
    const { data: offer } = await admin
      .from("offers")
      .select("offer_amount_cents")
      .eq("job_id", jobId)
      .eq("status", "accepted")
      .maybeSingle();
    const payoutCents = offer?.offer_amount_cents;
    if (!payoutCents) return jsonResponse({ error: "No accepted offer found to determine payout amount" }, 422);

    const { data: rpcData, error: rpcErr } = await admin.rpc("adjust_wallet_balance", {
      p_user_id: job.worker_id,
      p_delta_cents: payoutCents,
      p_type: "job_payout",
      p_reference_job_id: jobId,
      p_proof_url: null,
      p_status: "completed"
    });
    if (rpcErr) return jsonResponse({ error: rpcErr.message }, 500);

    await admin.from("jobs").update({ status: "completed", progress_percent: 100 }).eq("id", jobId);

    return jsonResponse({ released: true, payoutCents, newWorkerBalanceCents: rpcData?.[0]?.new_balance_cents });
  } catch (e) {
    return jsonResponse({ error: (e as Error).message }, 500);
  }
});
