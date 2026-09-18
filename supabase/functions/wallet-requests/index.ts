// wallet-requests — ADDED beyond Structure.md's original 7 functions.
// DEVIATION FLAGGED (Rules.md #25): wallet_transactions/wallets have no
// INSERT policy for regular users (correct — Rules.md #2), which means
// nothing in the original spec could actually create a deposit or
// withdrawal *request* for verify-deposit-proof (or an admin) to later
// approve. This function is the missing "create the request" step.
// Please review this addition — happy to fold it elsewhere if you'd rather.
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getUserClient, getAdminClient } from "../_shared/supabaseAdmin.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const userClient = getUserClient(req.headers.get("Authorization"));
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return jsonResponse({ error: "Not authenticated" }, 401);
    const userId = userData.user.id;
    const admin = getAdminClient();

    const body = await req.json();

    if (body.action === "request-deposit") {
      const { amountCents, proofUrl } = body as { amountCents: number; proofUrl: string };
      if (!amountCents || amountCents <= 0 || !proofUrl) {
        return jsonResponse({ error: "amountCents (>0) and proofUrl are required" }, 400);
      }
      const { data, error } = await admin
        .from("wallet_transactions")
        .insert({ user_id: userId, type: "deposit", amount_cents: amountCents, status: "pending", proof_url: proofUrl })
        .select()
        .single();
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ requested: true, transaction: data });
    }

    if (body.action === "request-withdrawal") {
      const { amountCents } = body as { amountCents: number };
      if (!amountCents || amountCents <= 0) return jsonResponse({ error: "amountCents (>0) is required" }, 400);

      const { data: payout } = await admin
        .from("payout_methods")
        .select("id")
        .eq("user_id", userId)
        .eq("is_default", true)
        .maybeSingle();
      if (!payout) return jsonResponse({ error: "Add a payout bank account before requesting a withdrawal" }, 422);

      const { data: wallet } = await admin.from("wallets").select("balance_cents").eq("user_id", userId).single();
      if (!wallet || wallet.balance_cents < amountCents) {
        return jsonResponse({ error: "Insufficient balance", shortfallCents: amountCents - (wallet?.balance_cents ?? 0) }, 422);
      }

      const { data, error } = await admin
        .from("wallet_transactions")
        .insert({ user_id: userId, type: "withdrawal", amount_cents: amountCents, status: "pending" })
        .select()
        .single();
      if (error) return jsonResponse({ error: error.message }, 500);
      return jsonResponse({ requested: true, transaction: data });
    }

    if (body.action === "resolve-withdrawal") {
      const { data: caller } = await admin.from("profiles").select("is_admin").eq("id", userId).single();
      if (!caller?.is_admin) return jsonResponse({ error: "Admin only" }, 403);

      const { transactionId, approve } = body as { transactionId: string; approve: boolean };
      if (!transactionId || typeof approve !== "boolean") {
        return jsonResponse({ error: "transactionId and approve (boolean) are required" }, 400);
      }
      const { data, error } = await admin.rpc("finalize_wallet_request", {
        p_transaction_id: transactionId,
        p_approve: approve
      });
      if (error) return jsonResponse({ error: error.message }, 422);
      return jsonResponse({ resolved: true, ...data?.[0] });
    }

    return jsonResponse({ error: "Unknown action. Use request-deposit, request-withdrawal, or resolve-withdrawal." }, 400);
  } catch (e) {
    return jsonResponse({ error: (e as Error).message }, 500);
  }
});
