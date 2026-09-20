import { useEffect, useState } from "react";
import { PageTransition } from "@/components/ui/PageTransition";
import { Skeleton } from "@/components/ui/Skeleton";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";

interface ThreadItem {
  jobId: string;
  jobTitle: string;
  kind: "chat" | "offer";
  preview: string;
  timestamp: string;
}

export default function ChatInbox({ onOpenChat }: { onOpenChat: (jobId: string) => void }) {
  const { session } = useAuth();
  const [filter, setFilter] = useState<"all" | "chat" | "offer">("all");
  const [items, setItems] = useState<ThreadItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    (async () => {
      const { data: jobs } = await supabase
        .from("jobs")
        .select("id, title, client_id, worker_id")
        .or(`client_id.eq.${session.user.id},worker_id.eq.${session.user.id}`);

      const jobIds = (jobs ?? []).map((j) => j.id);
      if (jobIds.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      const [{ data: lastMessages }, { data: pendingOffers }] = await Promise.all([
        supabase.from("messages").select("job_id, content, created_at").in("job_id", jobIds).order("created_at", { ascending: false }),
        supabase.from("offers").select("job_id, offer_amount_cents, created_at, worker_id").in("job_id", jobIds).eq("status", "pending")
      ]);

      const jobTitle = (id: string) => jobs?.find((j) => j.id === id)?.title ?? "Job";
      const chatItems: ThreadItem[] = [];
      const seen = new Set<string>();
      for (const m of lastMessages ?? []) {
        if (seen.has(m.job_id)) continue;
        seen.add(m.job_id);
        chatItems.push({ jobId: m.job_id, jobTitle: jobTitle(m.job_id), kind: "chat", preview: m.content || "(message removed)", timestamp: m.created_at });
      }
      const offerItems: ThreadItem[] = (pendingOffers ?? []).map((o) => ({
        jobId: o.job_id,
        jobTitle: jobTitle(o.job_id),
        kind: "offer",
        preview: o.worker_id === session.user.id ? `Your offer: Rs ${((o.offer_amount_cents ?? 0) / 100).toLocaleString()}` : `New offer: Rs ${((o.offer_amount_cents ?? 0) / 100).toLocaleString()}`,
        timestamp: o.created_at
      }));

      setItems([...chatItems, ...offerItems].sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp)));
      setLoading(false);
    })();
  }, [session]);

  const filtered = filter === "all" ? items : items.filter((i) => i.kind === filter);

  return (
    <PageTransition>
      <div className="min-h-screen px-5 py-6">
        <h1 className="mb-4 text-xl font-bold tracking-tight">Chat</h1>

        <div className="mb-4 flex gap-2">
          {(["all", "chat", "offer"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium capitalize ${filter === f ? "bg-teal text-white" : "border border-[var(--border)] text-[var(--text-secondary)]"}`}
            >
              {f === "all" ? "All" : f === "chat" ? "Chats" : "Offers"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-2"><Skeleton className="h-16" /><Skeleton className="h-16" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-[var(--text-secondary)]">There's nothing to chat yet.</p>
        ) : (
          <div className="space-y-2">
            {filtered.map((item, i) => (
              <button
                key={`${item.jobId}-${i}`}
                onClick={() => onOpenChat(item.jobId)}
                className="flex w-full items-start justify-between rounded-xl2 border border-[var(--border)] p-3 text-left"
              >
                <div>
                  <p className="text-sm font-medium">{item.jobTitle}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{item.preview}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${item.kind === "offer" ? "bg-amber/15 text-amber" : "bg-teal/10 text-teal"}`}>
                  {item.kind === "offer" ? "Offer" : "Chat"}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
