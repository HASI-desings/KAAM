import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { getUserClient, getAdminClient } from "../_shared/supabaseAdmin.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const userClient = getUserClient(req.headers.get("Authorization"));
    const { data: auth, error: authError } = await userClient.auth.getUser();
    if (authError || !auth?.user) return jsonResponse({ error: "Not authenticated" }, 401);
    const { action, categoryId, answers } = await req.json();
    const admin = getAdminClient();

    if (action === "get-questions") {
      const { data, error } = await admin.from("skill_quiz_questions").select("id, question, options").eq("category_id", categoryId).order("id");
      if (error) return jsonResponse({ error: error.message }, 500);
      if (!data?.length) return jsonResponse({ error: "No skill verification quiz is configured for this category yet." }, 404);
      return jsonResponse({ questions: data });
    }

    if (action === "submit") {
      const { data: questions, error } = await admin.from("skill_quiz_questions").select("id, correct_index").eq("category_id", categoryId);
      if (error) return jsonResponse({ error: error.message }, 500);
      if (!questions?.length) return jsonResponse({ error: "No skill verification quiz is configured for this category yet." }, 404);
      const correct = questions.reduce((n, q) => n + (Number(answers?.[q.id]) === Number(q.correct_index) ? 1 : 0), 0);
      const score = Math.round((correct / questions.length) * 100);
      const passed = score >= 70;
      const { error: insertError } = await admin.from("skill_verifications").insert({ user_id: auth.user.id, category_id: categoryId, passed, score });
      if (insertError) return jsonResponse({ error: insertError.message }, 500);
      return jsonResponse({ passed, score });
    }
    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (e) { return jsonResponse({ error: (e as Error).message }, 500); }
});