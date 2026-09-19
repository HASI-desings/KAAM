import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getUserClient, getAdminClient } from "../_shared/supabaseAdmin.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const userClient = getUserClient(req.headers.get("Authorization"));
    const { data: auth, error: authError } = await userClient.auth.getUser();
    if (authError || !auth?.user) return jsonResponse({ error: "Not authenticated" }, 401);
    const { action, code } = await req.json();
    const admin = getAdminClient();

    if (action === "my-code") {
      const { data: profile } = await admin.from("profiles").select("referral_code").eq("id", auth.user.id).single();
      return jsonResponse({ code: profile?.referral_code ?? null });
    }

    if (action === "apply-code") {
      const normalized = String(code ?? "").trim().toUpperCase();
      if (!normalized) return jsonResponse({ error: "Referral code is required" }, 400);
      const { data: referrer } = await admin.from("profiles").select("id").eq("referral_code", normalized).maybeSingle();
      if (!referrer) return jsonResponse({ error: "Referral code not found" }, 404);
      if (referrer.id === auth.user.id) return jsonResponse({ error: "You cannot use your own referral code" }, 400);
      const { error } = await admin.from("referrals").insert({ referrer_id: referrer.id, referred_id: auth.user.id });
      if (error) return jsonResponse({ error: error.code === "23505" ? "A referral is already attached to this account" : error.message }, 409);
      return jsonResponse({ applied: true, note: "Referral code applied." });
    }
    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (e) {
    return jsonResponse({ error: (e as Error).message }, 500);
  }
});
