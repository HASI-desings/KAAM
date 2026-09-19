import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { PageTransition } from "@/components/ui/PageTransition";
import { useAuth } from "@/hooks/useAuth";

export default function Login() {
  const { sendMagicLink } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    if (!email.includes("@")) return setError("Enter a valid email");
    setSending(true);
    setError(null);
    try {
      await sendMagicLink(email);
      setSent(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <PageTransition>
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <motion.h1 initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-2xl font-bold tracking-tight text-teal">
          SkillX
        </motion.h1>

        <div className="w-full max-w-sm rounded-xl2 border border-[var(--border)] bg-[var(--bg-elevated)] p-6" style={{ boxShadow: "var(--shadow-soft)" }}>
          <AnimatePresence mode="wait">
            {!sent ? (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl2 border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-teal"
                  />
                </div>
                {error && <p className="text-xs text-danger">{error}</p>}
                <Button className="w-full" disabled={sending} onClick={handleSend}>
                  {sending ? "Sending link..." : "Send sign-in link"}
                </Button>
                <p className="text-center text-[10px] text-[var(--text-secondary)]">
                  We'll email you a link — no password, no code to type. Mobile sign-in is pending an SMS provider decision.
                </p>
              </motion.div>
            ) : (
              <motion.div key="sent" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 text-center">
                <p className="text-sm font-semibold">Check your email</p>
                <p className="text-xs text-[var(--text-secondary)]">
                  We sent a sign-in link to <span className="font-medium">{email}</span>. Open it on this device to continue.
                </p>
                <button onClick={() => setSent(false)} className="text-xs text-teal underline underline-offset-2">
                  Use a different email
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
}
