import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getUserClient, getAdminClient } from "../_shared/supabaseAdmin.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const userClient = getUserClient(req.headers.get("Authorization"));
    const { data: auth, error: authError } = await userClient.auth.getUser();
    if (authError || !auth?.user) return jsonResponse({ error: "Not authenticated" }, 401);
    const { offerId } = await req.json();
    if (!offerId) return jsonResponse({ error: "offerId is required" }, 400);

    const admin = getAdminClient();
    const { data: offer } = await admin.from("offers").select("id, job_id, worker_id, offer_amount_cents, status").eq("id", offerId).single();
    if (!offer) return jsonResponse({ error: "Offer not found" }, 404);

    const { data: job } = await admin.from("jobs").select("id, client_id, status, subscription_tier:profiles!jobs_client_id_fkey(subscription_tier)").eq("id", offer.job_id).single();
    if (!job) return jsonResponse({ error: "Job not found" }, 404);
    if (job.client_id !== auth.user.id) return jsonResponse({ error: "Only the client can accept an offer" }, 403);
    if (offer.status !== "pending" || job.status !== "open") return jsonResponse({ error: "Offer or job is no longer available" }, 409);

    const amount = Number(offer.offer_amount_cents ?? 0);
    if (amount <= 0) return jsonResponse({ error: "Offer must contain a positive cash amount" }, 422);

    const locked = await admin.rpc("adjust_wallet_balance", {
      p_user_id: auth.user.id,
      p_delta_cents: -amount,
      p_type: "job_payment",
      p_reference_job_id: offer.job_id,
      p_proof_url: null,
      p_status: "completed"
    });
    if (locked.error) return jsonResponse({ error: locked.error.message }, 422);

    const hours = job.subscription_tier === "elite" ? 72 : job.subscription_tier === "basic" ? 48 : 24;
    await admin.from("offers").update({ status: "accepted" }).eq("id", offer.id);
    await admin.from("offers").update({ status: "rejected" }).eq("job_id", offer.job_id).neq("id", offer.id).eq("status", "pending");
    const { error: updateError } = await admin.from("jobs").update({
      worker_id: offer.worker_id,
      status: "in_progress",
      escrow_amount_cents: amount,
      auto_release_at: new Date(Date.now() + hours * 3600000).toISOString()
    }).eq("id", offer.job_id).eq("status", "open");
    if (updateError) return jsonResponse({ error: updateError.message }, 500);

    return jsonResponse({ accepted: true, escrowAmountCents: amount });
  } catch (e) {
    return jsonResponse({ error: (e as Error).message }, 500);
  }
});
