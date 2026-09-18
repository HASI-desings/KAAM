import { useState } from "react";
import type { Wallet } from "@/types";

// Placeholder. Real balance is always fetched from the server (Rules.md #2) —
// this hook never computes or mutates a balance locally.
export function useWallet(userId: string) {
  const [wallet] = useState<Wallet>({ userId, balance: 0 });
  return { wallet, isLoading: false };
}
