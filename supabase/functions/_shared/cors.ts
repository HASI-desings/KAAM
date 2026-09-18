export const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // tighten to your deployed origin once known
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}
