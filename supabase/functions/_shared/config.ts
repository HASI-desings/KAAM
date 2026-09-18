/**
 * Central home for every business-rule value that Security.md §3 and
 * Rules.md #28 flag as an explicitly OPEN DECISION. Nothing below is
 * invented as final — each is a placeholder behind a named constant so
 * the app runs, but every PENDING CONFIRMATION value must be reviewed
 * and confirmed before this goes to real users. Currency: PKR (cents = paisa).
 */

// Security.md §3 — mid-job request fee escalation ceiling.
// App.md §3.7 gave the *shape* ($5→$8→$10→$15→$25→$50...) in an unspecified
// currency. PENDING CONFIRMATION: these PKR-paisa amounts are a placeholder
// scaled 1:1 from those digits — confirm real amounts and the ceiling.
export const MID_JOB_OVERAGE_FEE_SCHEDULE_CENTS = [500_00, 800_00, 1000_00, 1500_00, 2500_00, 5000_00];
export const MID_JOB_OVERAGE_FEE_CEILING_CENTS = 5000_00; // repeats at this value after the schedule is exhausted — PENDING CONFIRMATION

// Security.md §3 — penalty-money split between platform and affected party.
// PENDING CONFIRMATION: currently 100% to the affected party, 0% retained
// by the platform. Change PLATFORM_SHARE if you want the platform to keep a cut.
export const PENALTY_PLATFORM_SHARE = 0; // 0.0–1.0
export const PENALTY_AFFECTED_PARTY_SHARE = 1 - PENALTY_PLATFORM_SHARE;

// Security.md §3 — 30%-gap confirmation prompt timeout duration.
// PENDING CONFIRMATION.
export const PRICE_GAP_CONFIRMATION_TIMEOUT_HOURS = 24;

// Security.md §3 — dispute resolution window before admin escalation.
// PENDING CONFIRMATION.
export const DISPUTE_AUTO_ESCALATION_HOURS = 72;

// Security.md §3 — whether repeated confirmed chat violations feed a trust score.
// PENDING CONFIRMATION. Currently OFF — violations are logged but not scored.
export const CHAT_VIOLATIONS_AFFECT_TRUST_SCORE = false;

// App.md §4 — penalty reference table (PKR-paisa). Shape confirmed by App.md;
// currency conversion is a placeholder like the overage schedule above.
// PENDING CONFIRMATION of real PKR amounts.
export const PENALTIES_CENTS = {
  deadline_missed: 200_00,
  first_pause: 100_00,
  second_pause: 300_00,
  non_response_under_50: 200_00,
  non_response_over_50: 400_00,
  false_dispute_or_rating_proof: 800_00,
  emergency_abuse: 3000_00,
  redo_misuse: 200_00
} as const;

export const SECOND_PAUSE_CHARGE_INCREASE_RATIO = 0.5; // App.md §3.8 — confirmed value, not open

// App.md §5 — commission, confirmed value, not open.
export const COMMISSION_RATE = 0.02; // 2%, added on top of client price, never deducted from worker payout

// App.md §3.13 — subscription tiers, confirmed values.
export const SUBSCRIPTION_MID_JOB_FREE_REQUESTS = { free: 2, basic: 4, elite: 10 } as const;
export const BOOST_PRICE_CENTS = { free: 1000_00, basic: 1000_00, elite: 700_00 } as const; // PENDING CONFIRMATION: $10/$7 shape, PKR amount is placeholder
export const VERIFICATION_BADGE_PRICE_CENTS = 10000_00; // PENDING CONFIRMATION: $100 shape, PKR amount is placeholder

// App.md §3.6 — default auto-release timer. PENDING CONFIRMATION of exact hours.
export const DEFAULT_AUTO_RELEASE_HOURS = 72;
