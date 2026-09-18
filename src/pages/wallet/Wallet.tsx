import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { PageTransition } from "@/components/ui/PageTransition";

const transactions = [
  { id: 1, label: "Job payment received", amount: 4300, type: "in" as const, date: "Sep 16, 2026", status: "Completed" },
  { id: 2, label: "Deposit", amount: 5000, type: "in" as const, date: "Sep 12, 2026", status: "Completed" },
  { id: 3, label: "Pause penalty", amount: -100, type: "out" as const, date: "Sep 10, 2026", status: "Applied" }
];

export default function Wallet() {
  return (
    <PageTransition>
      <div className="min-h-screen">
        <div
          className="px-5 pb-8 pt-10 text-white"
          style={{ background: "linear-gradient(135deg, #0F6659 0%, #1B8A76 100%)" }}
        >
          <p className="mb-1 text-xs opacity-80">Balance</p>
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="tabular-nums text-3xl font-bold"
          >
            Rs 1,800.00
          </motion.p>
          <div className="mt-6 flex gap-3">
            <Button className="flex-1 bg-white text-teal" variant="secondary">
              Deposit
            </Button>
            <Button className="flex-1 border-white text-white" variant="secondary">
              Withdraw
            </Button>
          </div>
        </div>

        <div className="px-5 py-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Recent transactions</p>
          <div className="space-y-3">
            {transactions.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center justify-between border-b border-[var(--border)] pb-3"
              >
                <div>
                  <p className="text-sm font-medium">{t.label}</p>
                  <p className="text-[11px] text-[var(--text-secondary)]">{t.date}</p>
                </div>
                <div className="text-right">
                  <p className={`tabular-nums text-sm font-semibold ${t.type === "in" ? "text-success" : "text-danger"}`}>
                    {t.type === "in" ? "+" : "−"}Rs {Math.abs(t.amount).toLocaleString()}
                  </p>
                  <p className="text-[11px] text-[var(--text-secondary)]">{t.status}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
