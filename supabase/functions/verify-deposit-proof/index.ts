// verify-deposit-proof — Phase 2
// Admin-only. Security.md §2.2: funds are never credited until proof is
// confirmed. Uses finalize_wallet_request so a deposit request has exactly
// one transaction row across its whole lifecycle (pending -> completed/failed).
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getUserClient, getAdminClient } from "../_shared/supabaseAdmin.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const userClient = getUserClient(req.headers.get("Authorization"));
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return jsonResponse({ error: "Not authenticated" }, 401);

    const admin = getAdminClient();
    const { data: caller } = await admin.from("profiles").select("is_admin").eq("id", userData.user.id).single();
    if (!caller?.is_admin) return jsonResponse({ error: "Admin only" }, 403);

    const { transactionId, decision } = await req.json() as { transactionId: string; decision: "approve" | "reject" };
    if (!transactionId || !["approve", "reject"].includes(decision)) {
      return jsonResponse({ error: "transactionId and decision ('approve' | 'reject') are required" }, 400);
    }

    const { data: tx, error: txErr } = await admin
      .from("wallet_transactions")
      .select("id, type, status")
      .eq("id", transactionId)
      .single();
    if (txErr || !tx) return jsonResponse({ error: "Transaction not found" }, 404);
    if (tx.type !== "deposit") return jsonResponse({ error: "Transaction is not a deposit" }, 422);
    if (tx.status !== "pending") return jsonResponse({ message: "Already reviewed — no action taken (idempotent)." });

    const { data, error } = await admin.rpc("finalize_wallet_request", {
      p_transaction_id: transactionId,
      p_approve: decision === "approve"
    });
    if (error) return jsonResponse({ error: error.message }, 500);

    return jsonResponse({ approved: decision === "approve", ...data?.[0] });
  } catch (e) {
    return jsonResponse({ error: (e as Error).message }, 500);
  }
});
