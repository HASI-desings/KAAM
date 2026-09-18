// apply-penalty — Phase 6/7
// Admin- or system-triggered only (never a plain user action). Deducts a
// penalty from the offending user's wallet using the App.md §4 reference
// table (amounts are PENDING CONFIRMATION placeholders — see _shared/config.ts).
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getUserClient, getAdminClient } from "../_shared/supabaseAdmin.ts";
import { PENALTIES_CENTS } from "../_shared/config.ts";

type PenaltyReason = keyof typeof PENALTIES_CENTS;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const userClient = getUserClient(req.headers.get("Authorization"));
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return jsonResponse({ error: "Not authenticated" }, 401);

    const admin = getAdminClient();
    const { data: caller } = await admin.from("profiles").select("is_admin").eq("id", userData.user.id).single();
    if (!caller?.is_admin) return jsonResponse({ error: "Admin only" }, 403);

    const { userId, jobId, reason } = await req.json() as { userId: string; jobId?: string; reason: PenaltyReason };
    if (!userId || !reason || !(reason in PENALTIES_CENTS)) {
      return jsonResponse({ error: `reason must be one of: ${Object.keys(PENALTIES_CENTS).join(", ")}` }, 400);
    }

    const amountCents = PENALTIES_CENTS[reason];

    const { error: penErr } = await admin
      .from("penalties")
      .insert({ user_id: userId, job_id: jobId ?? null, reason, amount_cents: amountCents });
    if (penErr) return jsonResponse({ error: penErr.message }, 500);

    const { data: rpcData, error: rpcErr } = await admin.rpc("adjust_wallet_balance", {
      p_user_id: userId,
      p_delta_cents: -amountCents,
      p_type: "penalty",
      p_reference_job_id: jobId ?? null,
      p_proof_url: null,
      p_status: "completed"
    });
    if (rpcErr) return jsonResponse({ error: rpcErr.message }, 500);

    return jsonResponse({ applied: true, amountCents, newBalanceCents: rpcData?.[0]?.new_balance_cents });
  } catch (e) {
    return jsonResponse({ error: (e as Error).message }, 500);
  }
});
