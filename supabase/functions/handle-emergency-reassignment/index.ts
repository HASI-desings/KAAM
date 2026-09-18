// handle-emergency-reassignment — Phase 7
// App.md §3.9: worker declares an emergency -> job is cancelled for them,
// client is notified, app searches for a replacement worker among other
// pending offers on that job (or reopens it to the feed if none exist).
// Original worker takes a rating-loss note only, never a financial penalty
// for a genuine emergency (repeated abuse is handled separately via apply-penalty).
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getUserClient, getAdminClient } from "../_shared/supabaseAdmin.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const userClient = getUserClient(req.headers.get("Authorization"));
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return jsonResponse({ error: "Not authenticated" }, 401);

    const { jobId } = await req.json();
    if (!jobId) return jsonResponse({ error: "jobId is required" }, 400);

    const admin = getAdminClient();
    const { data: job, error: jobErr } = await admin
      .from("jobs")
      .select("id, worker_id, client_id, status, category_id")
      .eq("id", jobId)
      .single();
    if (jobErr || !job) return jsonResponse({ error: "Job not found" }, 404);
    if (job.worker_id !== userData.user.id) {
      return jsonResponse({ error: "Only the assigned worker can declare an emergency on this job" }, 403);
    }
    if (!["assigned", "in_progress"].includes(job.status)) {
      return jsonResponse({ error: `Job is not in an active state (status: ${job.status})` }, 409);
    }

    // Rating-loss note, no financial penalty, per App.md §3.9.
    await admin.from("ratings").insert({
      job_id: jobId,
      rater_id: job.client_id,
      ratee_id: job.worker_id,
      stars: 1,
      comment: "System note: worker triggered emergency reassignment on this job."
    });

    // Look for another pending offer on the same job to fast-track as a replacement.
    const { data: candidateOffer } = await admin
      .from("offers")
      .select("id, worker_id")
      .eq("job_id", jobId)
      .eq("status", "pending")
      .neq("worker_id", job.worker_id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (candidateOffer) {
      await admin
        .from("jobs")
        .update({ worker_id: candidateOffer.worker_id, status: "assigned", pause_count: 0 })
        .eq("id", jobId);
      await admin.from("offers").update({ status: "accepted" }).eq("id", candidateOffer.id);
      return jsonResponse({ reassigned: true, newWorkerId: candidateOffer.worker_id });
    }

    // No replacement available — reopen to the feed and let the client choose refund/repost (App.md §2.5).
    await admin.from("jobs").update({ worker_id: null, status: "open" }).eq("id", jobId);
    return jsonResponse({ reassigned: false, reopened: true });
  } catch (e) {
    return jsonResponse({ error: (e as Error).message }, 500);
  }
});
