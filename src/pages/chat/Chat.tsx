import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/ui/PageTransition";
import { Skeleton } from "@/components/ui/Skeleton";
import { supabase } from "@/lib/supabaseClient";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

interface Msg { id: string; sender_id: string; content: string; status: string; created_at: string; }

export default function Chat({ jobId, onBack }: { jobId: string; onBack: () => void }) {
  const { session } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    supabase.from("messages").select("id, sender_id, content, status, created_at").eq("job_id", jobId).order("created_at", { ascending: true })
      .then(({ data, error }) => { if (!mounted) return; if (error) setError(error.message); setMessages(data ?? []); setLoading(false); });

    const channel = supabase.channel("messages-" + jobId).on("postgres_changes",
      { event: "*", schema: "public", table: "messages", filter: "job_id=eq." + jobId },
      ({ new: next }) => {
        const row = next as Msg;
        if (!row?.id) return;
        setMessages((prev) => prev.some((m) => m.id === row.id) ? prev.map((m) => m.id === row.id ? row : m) : [...prev, row]);
      }).subscribe((status) => { if (status === "CHANNEL_ERROR") setError("Live chat connection failed. Refresh to retry."); });

    return () => { mounted = false; supabase.removeChannel(channel); };
  }, [jobId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages.length]);

  async function handleSend() {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true); setDraft(""); setError(null);
    try { await api.screenMessage(jobId, text); }
    catch (e) { setDraft(text); setError((e as Error).message || "Could not send message."); }
    finally { setSending(false); }
  }

  return <PageTransition><div className="flex h-[calc(100dvh-5rem)] min-h-0 flex-col overflow-hidden">
    <div className="flex shrink-0 items-center gap-3 border-b border-[var(--border)] px-4 py-3"><button onClick={onBack} className="rounded-full px-2 py-1 text-sm text-teal">←</button><h1 className="min-w-0 truncate text-sm font-semibold">Chat — Job</h1></div>
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
      {error && <div className="mb-3 rounded-xl2 border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">{error}</div>}
      {loading ? <div className="space-y-3"><Skeleton className="h-8 w-2/3" /><Skeleton className="ml-auto h-8 w-1/2" /></div> :
      messages.length === 0 ? <div className="flex min-h-[50%] items-center justify-center text-center text-sm text-[var(--text-secondary)]">No messages yet. Start the conversation below.</div> :
      <div className="space-y-3">{messages.map((m) => m.status === "violation" ? null : <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={"flex " + (m.sender_id === session?.user.id ? "justify-end" : "justify-start")}>
        {m.status === "pending" ? <div className="h-8 w-24 rounded-2xl bg-[var(--border)]" /> : <div className={"max-w-[82%] break-words whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm " + (m.sender_id === session?.user.id ? "bg-teal text-white" : "bg-[var(--border)] text-[var(--text-primary)]")}>{m.content}</div>}
      </motion.div>)}<div ref={bottomRef} /></div>}
    </div>
    <div className="flex shrink-0 items-end gap-2 border-t border-[var(--border)] bg-[var(--bg)] p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      <textarea value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder="Message..." rows={1} className="min-h-10 max-h-32 flex-1 resize-none overflow-y-auto rounded-xl2 border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-teal" />
      <button onClick={handleSend} disabled={sending || !draft.trim()} className="shrink-0 rounded-xl2 bg-teal px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{sending ? "…" : "Send"}</button>
    </div>
  </div></PageTransition>;
}