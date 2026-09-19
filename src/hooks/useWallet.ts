import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { api } from "@/lib/api";

interface WalletTx {
  id: string;
  type: string;
  amount_cents: number;
  status: string;
  created_at: string;
}

export function useWallet(userId: string | undefined) {
  const [balanceCents, setBalanceCents] = useState(0);
  const [transactions, setTransactions] = useState<WalletTx[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    const [{ data: wallet }, { data: txs }] = await Promise.all([
      supabase.from("wallets").select("balance_cents").eq("user_id", userId).maybeSingle(),
      supabase
        .from("wallet_transactions")
        .select("id, type, amount_cents, status, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20)
    ]);
    setBalanceCents(wallet?.balance_cents ?? 0);
    setTransactions(txs ?? []);
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function requestWithdrawal(amountCents: number) {
    await api.requestWithdrawal(amountCents);
    await refresh();
  }

  async function requestDeposit(amountCents: number, proofUrl: string) {
    await api.requestDeposit(amountCents, proofUrl);
    await refresh();
  }

  return { balanceCents, transactions, isLoading, refresh, requestWithdrawal, requestDeposit };
}
