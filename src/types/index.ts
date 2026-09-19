// Shared types. These mirror the planned Supabase schema (Phase 1).
// Fields marked TBD depend on decisions flagged as open in Security.md ⚠️.

export type PaymentType = "cash" | "service" | "either";

export interface Profile {
  id: string;
  fullName: string;
  address: string;
  education: string;
  occupation: string;
  isProfileComplete: boolean;
  isVerified: boolean;
  isAdmin: boolean;
}

export interface Wallet {
  userId: string;
  balance: number; // authoritative value always comes from the server
}

export type JobStatus =
  | "open"
  | "offer_pending"
  | "locked"
  | "in_progress"
  | "paused"
  | "submitted"
  | "completed"
  | "disputed"
  | "cancelled";

export interface Job {
  id: string;
  clientId: string;
  categoryId: string;
  title: string;
  description: string;
  paymentType: PaymentType;
  priceMin: number;
  priceMax: number;
  deadline: string; // ISO date
  status: JobStatus;
  boosted: boolean;
  progress: number; // 0-100, server authoritative
}

export interface Offer {
  id: string;
  jobId: string;
  workerId: string;
  proposedPrice: number;
  workerValuation: number;
  status: "pending" | "accepted" | "rejected" | "needs_confirmation";
}

export interface Rating {
  id: string;
  jobId: string;
  raterId: string;
  rateeId: string;
  stars: number;
  comment?: string;
  proofUrl?: string;
}

export type SubscriptionTier = "free" | "basic" | "elite";
