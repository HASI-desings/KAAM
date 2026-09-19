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
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.from("messages").select("id, sender_id, content, status, created_at").eq("job_id", jobId).order("created_at", { ascending: true })
      .then(({ data }) => { setMessages(data ?? []); setLoading(false); });

    const channel = supabase.channel(`messages-${jobId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `job_id=eq.${jobId}` }, (payload) => {
        setMessages((prev) => {
          const row = payload.new as Msg;
          const exists = prev.some((m) => m.id === row.id);
          return exists ? prev.map((m) => (m.id === row.id ? row : m)) : [...prev, row];
        });
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [jobId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  async function handleSend() {
    if (!draft.trim()) return;
    setSending(true);
    const text = draft;
    setDraft("");
    try { await api.screenMessage(jobId, text); } catch { setDraft(text); } finally { setSending(false); }
  }

  return (
    <PageTransition>
      <div className="flex min-h-screen flex-col">
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
          <button onClick={onBack} className="text-sm text-teal">←</button>
          <h1 className="text-sm font-semibold">Chat — Job</h1>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {loading ? <><Skeleton className="h-8 w-2/3" /><Skeleton className="ml-auto h-8 w-1/2" /></> : messages.map((m) => {
            const isMe = m.sender_id === session?.user.id;
            return <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              {m.status === "pending" ? <motion.div animate={{ opacity: [0.4, 0.9, 0.4] }} transition={{ duration: 1.4, repeat: Infinity }} className="h-8 w-24 rounded-2xl bg-[var(--border)]" /> :
               m.status === "violation" ? null :
               <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${isMe ? "bg-teal text-white" : "bg-[var(--border)] text-[var(--text-primary)]"}`}>{m.content}</div>}
            </motion.div>;
          })}
          <div ref={bottomRef} />
        </div>
        <div className="flex items-end gap-2 border-t border-[var(--border)] p-3">
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Message..." rows={1} className="flex-1 resize-none rounded-xl2 border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-teal" />
          <button onClick={handleSend} disabled={sending} className="rounded-xl2 bg-teal px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Send</button>
        </div>
      </div>
    </PageTransition>
  );
}
