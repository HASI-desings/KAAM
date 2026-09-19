import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PageTransition } from "@/components/ui/PageTransition";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";

export default function Wallet() {
  const { session } = useAuth();
  const { balanceCents, transactions, requestWithdrawal, requestDeposit } = useWallet(session?.user.id);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleWithdraw() {
    try {
      await requestWithdrawal(Number(amount) * 100);
      setWithdrawOpen(false);
      setAmount("");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <PageTransition>
      <div className="min-h-screen">
        <div className="px-5 pb-8 pt-10 text-white" style={{ background: "linear-gradient(135deg, #0F6659 0%, #1B8A76 100%)" }}>
          <p className="mb-1 text-xs opacity-80">Balance</p>
          <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="tabular-nums text-3xl font-bold">
            Rs {(balanceCents / 100).toLocaleString()}
          </motion.p>
          <div className="mt-6 flex gap-3">
            <Button className="flex-1 bg-white text-teal" variant="secondary">Deposit</Button>
            <Button className="flex-1 border-white text-white" variant="secondary" onClick={() => setWithdrawOpen(true)}>Withdraw</Button>
          </div>
        </div>

        <div className="px-5 py-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Recent transactions</p>
          <div className="space-y-3">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <div>
                  <p className="text-sm font-medium capitalize">{t.type.replace("_", " ")}</p>
                  <p className="text-[11px] text-[var(--text-secondary)]">{new Date(t.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className={`tabular-nums text-sm font-semibold ${t.amount_cents >= 0 ? "text-success" : "text-danger"}`}>
                    {t.amount_cents >= 0 ? "+" : "−"}Rs {Math.abs(t.amount_cents / 100).toLocaleString()}
                  </p>
                  <p className="text-[11px] capitalize text-[var(--text-secondary)]">{t.status}</p>
                </div>
              </div>
            ))}
            {transactions.length === 0 && <p className="text-sm text-[var(--text-secondary)]">No transactions yet.</p>}
          </div>
        </div>

        <Modal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} title="Withdraw funds">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="Amount in PKR"
            className="mb-2 w-full rounded-xl2 border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-teal"
          />
          {error && <p className="mb-2 text-xs text-danger">{error}</p>}
          <Button className="w-full" onClick={handleWithdraw}>Request Withdrawal</Button>
        </Modal>
      </div>
    </PageTransition>
  );
}
