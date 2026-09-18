# SkillX (Supabase project: "KAAM")

Gig/skill marketplace for Pakistani students. Built to the spec in `App.md`,
`Structure.md`, `Design.md`, `Security.md`, `Rules.md`, `Phases.md`, phase by
phase, against your live Supabase project.

## Confirmed Phase 0 decisions

- Currency: **PKR** (stored as integer cents/paisa everywhere)
- Hosting: **Vercel**
- Categories: 13, already seeded on the live project (see `supabase/migrations/0001_initial_schema.sql`)
- Payments: **no processor** — users add their own Pakistani bank account
  (`payout_methods` table) to receive withdrawals. This required one
  explicit exception to Security.md rule #6 ("never store account numbers"),
  agreed with you: full bank name + account title + account number/IBAN is
  stored, locked to owner + admin only via RLS.

## What's real vs. what's still local-only

**Live on your Supabase project right now** (via the Supabase MCP connector —
applied directly, not just written to disk):
- Full schema, every table with RLS enabled (Rules.md #26)
- `payout_methods` table + `adjust_wallet_balance` / `finalize_wallet_request`
  Postgres functions (atomic, row-locked, `service_role`-only — Security.md §2.2)
- Private storage buckets: `deposit-proofs`, `rating-proofs`

**Written and included in this zip, but NOT yet deployed** — the Supabase
connector's `deploy_edge_function` action needs an approval/permission grant
from you that I couldn't get programmatically. All 8 functions are correct
and ready in `supabase/functions/`; once you approve the connector action (or
run `supabase functions deploy <name>` yourself with the CLI), they go live
with zero code changes needed:
- `calculate-final-price`, `release-escrow`, `apply-penalty`,
  `verify-deposit-proof`, `moderate-message`, `check-average-rate`,
  `handle-emergency-reassignment`
- `wallet-requests` — **flagged deviation** (Rules.md #25): not in your
  original 7-function list. `wallet_transactions`/`wallets` correctly have no
  user-INSERT policy, which means nothing in the original spec could create a
  deposit/withdrawal *request* for `verify-deposit-proof` (or an admin) to
  approve. This function is that missing "create the request" step. Say the
  word if you'd rather it live somewhere else.

**Frontend**: all 13 screens from `Design.md`, built with the Apple
fluid-interface motion system (springs, press-states, popups, bottom sheets,
OTP, staggered reveals). Currently running on in-memory demo data (`App.tsx`'s
screen switcher) — wiring it to the live Supabase tables/functions is the next
piece of work, phase by phase per `Phases.md`.

## Open decisions still pending your confirmation (Security.md §3 / Rules.md #28)

Implemented behind named placeholder constants in
`supabase/functions/_shared/config.ts` so nothing is silently hardcoded as
final — every PKR amount in there is a scaled placeholder, not a real number:
- Mid-job request fee escalation schedule + ceiling
- Penalty-money split between platform and affected party (currently 100% to
  affected party, 0% platform)
- 30%-price-gap confirmation timeout (currently 24h placeholder)
- Dispute auto-escalation window (currently 72h placeholder)
- Whether repeated chat violations feed a trust score (currently off)
- Default auto-release timer hours (currently 72h placeholder)
- Boost price / verification badge price (shape from App.md confirmed, PKR amount is a placeholder)

## New feature idea on the table (not yet designed in) — anonymous student requests

You raised: students post task/assignment/tutoring requests, tagging their
course + degree, with an option to post fully anonymously. This needs its own
design pass before it's built, because it genuinely conflicts with the
current RLS model: `jobs.client_id` is real and visible to any authenticated
user browsing `open` jobs. True anonymity means either (a) a view that hides
`client_id` from other users while an Edge Function still ties payment/escrow
to the real account server-side, or (b) a separate `student_requests` table
with its own narrower RLS. Flagging this now rather than bolting it in
half-designed — next thing to scope once you confirm which direction you want.

## Run the frontend

```bash
npm install
npm run dev
```

`.env.local` already has your real project URL + publishable (anon) key —
safe to keep in this zip since anon/publishable keys are meant to be
client-exposed. Never put a service-role key in anything under `src/`.

## Structure

Matches `Structure.md`, with `supabase/migrations/` now containing the actual
reconstructed schema (0001) plus the two migrations added this session (0002,
0003) so this repo reproduces your live database exactly.
