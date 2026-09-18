// moderate-message — Phase 9
// Two actions in one function so the folder structure stays exactly as
// defined in Structure.md (no extra function folder added):
//   action "screen"  — called when a user sends a message. Runs pattern-based
//                       contact-info detection (Rules.md #12: reasonable filter
//                       + human review, not an over-aggressive pure-automation filter).
//   action "resolve" — called by an admin from the Review Queue to finalize a
//                       pending flagged message as "violation" or "safe".
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getUserClient, getAdminClient } from "../_shared/supabaseAdmin.ts";
import { CHAT_VIOLATIONS_AFFECT_TRUST_SCORE } from "../_shared/config.ts";

// Deliberately conservative patterns — catches obvious phone numbers, emails,
// and named social platforms without blocking normal conversation (Rules.md #12).
const PHONE_RE = /(\+?\d[\d\s\-]{8,}\d)/;
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const SOCIAL_RE = /\b(whatsapp|instagram|insta|snapchat|snap|telegram|facebook|fb\.com|imo|discord)\b/i;

function looksLikeContactSharing(text: string) {
  return PHONE_RE.test(text) || EMAIL_RE.test(text) || SOCIAL_RE.test(text);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const userClient = getUserClient(req.headers.get("Authorization"));
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return jsonResponse({ error: "Not authenticated" }, 401);

    const admin = getAdminClient();

    if (body.action === "resolve") {
      const { data: caller } = await admin.from("profiles").select("is_admin").eq("id", userData.user.id).single();
      if (!caller?.is_admin) return jsonResponse({ error: "Admin only" }, 403);

      const { flaggedMessageId, decision } = body as { flaggedMessageId: string; decision: "violation" | "safe" };
      if (!flaggedMessageId || !["violation", "safe"].includes(decision)) {
        return jsonResponse({ error: "flaggedMessageId and decision ('violation' | 'safe') are required" }, 400);
      }

      const { data: flagged, error: flagErr } = await admin
        .from("flagged_messages")
        .select("id, message_id, status")
        .eq("id", flaggedMessageId)
        .single();
      if (flagErr || !flagged) return jsonResponse({ error: "Flagged message not found" }, 404);
      if (flagged.status !== "pending") return jsonResponse({ message: "Already resolved — no action taken." });

      await admin
        .from("flagged_messages")
        .update({ status: decision, reviewed_by: userData.user.id, reviewed_at: new Date().toISOString() })
        .eq("id", flaggedMessageId);

      if (decision === "violation") {
        // Never delivered — message row's own status flips to violation and content
        // is scrubbed rather than shown to the other party (Rules.md #10, App.md §3.12).
        await admin.from("messages").update({ status: "violation", content: "" }).eq("id", flagged.message_id);
        if (CHAT_VIOLATIONS_AFFECT_TRUST_SCORE) {
          // PENDING CONFIRMATION (Security.md §3) — trust-score wiring intentionally
          // left unimplemented until this open decision is confirmed.
        }
      } else {
        await admin.from("messages").update({ status: "safe" }).eq("id", flagged.message_id);
      }

      return jsonResponse({ resolved: true, decision });
    }

    // Default action: "screen" a newly sent message.
    const { jobId, content } = body as { jobId: string; content: string };
    if (!jobId || !content?.trim()) return jsonResponse({ error: "jobId and content are required" }, 400);

    const suspicious = looksLikeContactSharing(content);

    const { data: message, error: msgErr } = await admin
      .from("messages")
      .insert({ job_id: jobId, sender_id: userData.user.id, content, status: suspicious ? "pending" : "safe" })
      .select()
      .single();
    if (msgErr) return jsonResponse({ error: msgErr.message }, 500);

    if (suspicious) {
      // Sender is never told it was flagged, per App.md §3.12 — avoids teaching evasion patterns.
      await admin.from("flagged_messages").insert({
        message_id: message.id,
        reason: "Suspected contact-sharing pattern",
        status: "pending"
      });
    }

    return jsonResponse({ message, flagged: suspicious });
  } catch (e) {
    return jsonResponse({ error: (e as Error).message }, 500);
  }
});
