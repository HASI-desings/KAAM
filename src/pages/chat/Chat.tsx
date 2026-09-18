import { useState } from "react";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/ui/PageTransition";

interface Msg { id: number; from: "me" | "them"; text: string; pending?: boolean; }

const initial: Msg[] = [
  { id: 1, from: "them", text: "Hi! When can you start?" },
  { id: 2, from: "me", text: "I can start tomorrow morning." },
  { id: 3, from: "them", text: "Sounds good.", pending: true }
];

export default function Chat() {
  const [messages] = useState<Msg[]>(initial);
  const [draft, setDraft] = useState("");

  return (
    <PageTransition>
      <div className="flex min-h-screen flex-col">
        <div className="border-b border-[var(--border)] px-4 py-3">
          <h1 className="text-sm font-semibold">Chat — Job #1024</h1>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}
            >
              {m.pending ? (
                <motion.div
                  animate={{ opacity: [0.4, 0.9, 0.4] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                  className="h-8 w-24 rounded-2xl bg-[var(--border)]"
                />
              ) : (
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                    m.from === "me" ? "bg-teal text-white" : "bg-[var(--border)] text-[var(--text-primary)]"
                  }`}
                >
                  {m.text}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div
          className="flex items-end gap-2 border-t border-[var(--border)] p-3"
          animate={{ minHeight: draft.length > 40 ? 72 : 56 }}
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Message..."
            rows={1}
            className="flex-1 resize-none rounded-xl2 border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none focus:border-teal"
          />
          <button className="rounded-xl2 bg-teal px-4 py-2 text-sm font-semibold text-white">Send</button>
        </motion.div>
      </div>
    </PageTransition>
  );
}
