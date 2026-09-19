import { useEffect, useState } from "react";
import { PageTransition } from "@/components/ui/PageTransition";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";

interface DisputedJob { id: string; title: string; escrow_amount_cents: number | null; status: string; }

export default function DisputeReview() {
  const [jobs, setJobs] = useState<DisputedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);
  async function load() { setLoading(true); const r = await api.listOpenDisputes(); setJobs(r.disputedJobs ?? []); setLoading(false); }
  useEffect(() => { load(); }, []);
  async function resolve(jobId: string, resolution: "refund_client" | "release_worker") { setResolving(jobId); await api.resolveDisputedJob(jobId, resolution); await load(); setResolving(null); }

  return <PageTransition><div className="min-h-screen px-5 py-8"><h1 className="mb-4 text-lg font-bold">Dispute Review</h1>
    {loading ? <div className="space-y-2"><Skeleton className="h-16" /><Skeleton className="h-16" /></div> : jobs.length === 0 ? <p className="text-sm text-[var(--text-secondary)]">No open disputes.</p> :
    <div className="space-y-3">{jobs.map((j) => <div key={j.id} className="rounded-xl2 border border-[var(--border)] p-3 text-xs"><p className="mb-1 font-medium">{j.title}</p><p className="mb-2 tabular-nums text-[var(--text-secondary)]">Escrowed: Rs {((j.escrow_amount_cents ?? 0) / 100).toLocaleString()}</p><div className="flex gap-2"><button disabled={resolving === j.id} onClick={() => resolve(j.id, "refund_client")} className="flex-1 rounded-xl2 border border-teal py-1.5 text-teal disabled:opacity-50">Refund Client</button><button disabled={resolving === j.id} onClick={() => resolve(j.id, "release_worker")} className="flex-1 rounded-xl2 bg-teal py-1.5 text-white disabled:opacity-50">Release to Worker</button></div></div>)}</div>}
  </div></PageTransition>;
}
