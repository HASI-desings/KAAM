import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { PageTransition } from "@/components/ui/PageTransition";

export default function EscrowConfirmation() {
  const [locked, setLocked] = useState(false);
  const base = 2000;
  const commission = Math.round(base * 0.02);
  const total = base + commission;

  return (
    <PageTransition>
      <div className="flex min-h-screen flex-col items-center px-5 py-8">
        <h1 className="mb-6 text-xl font-bold tracking-tight">Escrow Confirmation</h1>

        <div className="mb-8 w-full max-w-sm rounded-xl2 border border-[var(--border)] p-5">
          <Row label="Base price" value={base} />
          <Row label="+ 2% commission" value={commission} />
          <div className="my-2 border-t border-[var(--border)]" />
          <Row label="Final total" value={total} bold />
        </div>

        <motion.div
          className="mb-8 flex h-28 w-28 items-center justify-center rounded-full"
          animate={{ boxShadow: locked ? "0 0 0 16px rgba(15,102,89,0.08)" : "0 0 0 0px rgba(15,102,89,0)" }}
          transition={{ duration: 0.5 }}
          style={{ background: "linear-gradient(135deg, #0F6659 0%, #1B8A76 100%)" }}
        >
          <motion.span
            animate={locked ? { scaleY: 0.85, y: 2 } : { scaleY: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 12 }}
            className="text-4xl"
          >
            {locked ? "🔒" : "🔓"}
          </motion.span>
        </motion.div>

        <AnimatePresence>
          {locked && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 text-sm font-medium text-success"
            >
              Funds are safely held in escrow.
            </motion.p>
          )}
        </AnimatePresence>

        <Button className="w-full max-w-sm" onClick={() => setLocked(true)} disabled={locked}>
          {locked ? "Confirmed" : "Confirm & Lock Funds"}
        </Button>
      </div>
    </PageTransition>
  );
}

function Row({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className={`flex justify-between py-1 text-sm ${bold ? "font-bold" : ""}`}>
      <span>{label}</span>
      <span className="tabular-nums">Rs {value.toLocaleString()}</span>
    </div>
  );
}
