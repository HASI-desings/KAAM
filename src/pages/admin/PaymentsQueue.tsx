import { useEffect, useState } from "react";
import { PageTransition } from "@/components/ui/PageTransition";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";

interface PaymentItem {
  id: string;
  type: "deposit" | "withdrawal" | string;
  amount_cents: number;
  status: string;
  proof_url?: string | null;
  created_at?: string;
  user_id?: string;
  user?: { email?: string | null; full_name?: string | null } | null;
}

export default function PaymentsQueue() {
  const [items, setItems] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const result = await api.listPendingPayments();
      setItems(result.items ?? result.payments ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load pending payments.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function resolve(item: PaymentItem, approve: boolean) {
    setResolving(item.id);
    setError(null);
    try {
      if (item.type === "deposit") {
        await api.verifyDepositProof(item.id, approve ? "approve" : "reject");
      } else if (item.type === "withdrawal") {
        await api.resolveWithdrawal(item.id, approve);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to resolve payment.");
    } finally {
      setResolving(null);
    }
  }

  return (
    <PageTransition>
      <div className="min-h-screen px-5 py-8">
        <h1 className="mb-4 text-lg font-bold">Payments Queue</h1>
        {error && <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">{error}</p>}
        {loading ? (
          <div className="space-y-2"><Skeleton className="h-16" /><Skeleton className="h-16" /></div>
        ) : items.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">No pending payments.</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-[var(--border)] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium capitalize">{item.type}</p>
                    <p className="text-sm text-[var(--text-secondary)]">Rs {(item.amount_cents / 100).toLocaleString()}</p>
                    {item.user?.email && <p className="text-xs text-[var(--text-secondary)]">{item.user.email}</p>}
                    {item.created_at && <p className="text-xs text-[var(--text-secondary)]">{new Date(item.created_at).toLocaleString()}</p>}
                  </div>
                  <div className="flex gap-2">
                    {item.type === "deposit" && item.proof_url && <a href={item.proof_url} target="_blank" rel="noreferrer" className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm">View proof</a>}
                    <button disabled={resolving === item.id} onClick={() => resolve(item, false)} className="rounded-xl border border-red-500/40 px-3 py-2 text-sm text-red-500 disabled:opacity-50">Reject</button>
                    <button disabled={resolving === item.id} onClick={() => resolve(item, true)} className="rounded-xl bg-teal-600 px-3 py-2 text-sm text-white disabled:opacity-50">Approve</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}