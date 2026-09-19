import { useEffect, useState } from "react";
import { PageTransition } from "@/components/ui/PageTransition";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";

interface FlaggedItem { id: string; reason: string; status: string; created_at: string; message_id: string; messages: { content: string; job_id: string; sender_id: string } | null; }

export default function ModerationQueue() {
  const [items, setItems] = useState<FlaggedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<string | null>(null);

  async function load() { setLoading(true); const { items } = await api.listPendingFlags(); setItems(items ?? []); setLoading(false); }
  useEffect(() => { load(); }, []);
  async function resolve(id: string, decision: "violation" | "safe") { setResolving(id); await api.resolveFlaggedMessage(id, decision); await load(); setResolving(null); }

  return <PageTransition><div className="min-h-screen px-5 py-8"><h1 className="mb-4 text-lg font-bold">Admin Review Queue</h1>
    {loading ? <div className="space-y-2"><Skeleton className="h-14" /><Skeleton className="h-14" /></div> : items.length === 0 ? <p className="text-sm text-[var(--text-secondary)]">Nothing pending review.</p> :
    <div className="space-y-3">{items.map((item) => <div key={item.id} className="rounded-xl2 border border-[var(--border)] p-3 text-xs"><p className="mb-1 font-medium">{item.reason}</p><p className="mb-2 text-[var(--text-secondary)]">Sender: {item.messages?.sender_id?.slice(0, 8)}…</p><div className="flex gap-2"><button disabled={resolving === item.id} onClick={() => resolve(item.id, "safe")} className="flex-1 rounded-xl2 border border-teal py-1.5 text-teal disabled:opacity-50">Mark Safe</button><button disabled={resolving === item.id} onClick={() => resolve(item.id, "violation")} className="flex-1 rounded-xl2 bg-danger py-1.5 text-white disabled:opacity-50">Violation</button></div></div>)}</div>}
  </div></PageTransition>;
}
