import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";

interface BankAccount { bank_name: string; iban: string; account_number: string; account_title: string; }

export function DepositModal({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const { session } = useAuth();
  const [bank, setBank] = useState<BankAccount | null>(null);
  const [amount, setAmount] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    supabase.from("platform_bank_accounts").select("bank_name, iban, account_number, account_title").eq("is_active", true).limit(1).maybeSingle().then(({ data }) => setBank(data));
  }, [open]);

  async function handleSubmit() {
    if (!session || !file || !amount) return setError("Enter an amount and attach a screenshot");
    setSubmitting(true);
    setError(null);
    try {
      const path = `${session.user.id}/${Date.now()}-${file.name}`;
      const { error: uploadErr } = await supabase.storage.from("deposit-proofs").upload(path, file);
      if (uploadErr) throw uploadErr;
      const { data: signed } = await supabase.storage.from("deposit-proofs").createSignedUrl(path, 60 * 60 * 24 * 30);
      await api.requestDeposit(Number(amount) * 100, signed?.signedUrl ?? path);
      onDone();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Deposit funds">
      {bank && (
        <div className="mb-4 space-y-1 rounded-xl2 border border-[var(--border)] bg-teal/5 p-3 text-xs">
          <p><span className="text-[var(--text-secondary)]">Bank:</span> {bank.bank_name}</p>
          <p><span className="text-[var(--text-secondary)]">IBAN:</span> {bank.iban}</p>
          <p><span className="text-[var(--text-secondary)]">Account #:</span> {bank.account_number}</p>
          <p><span className="text-[var(--text-secondary)]">Title:</span> {bank.account_title}</p>
          <p className="pt-1 text-[10px] text-[var(--text-secondary)]">Send funds to this account, then submit the amount and a screenshot below.</p>
        </div>
      )}

      <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Amount (PKR)</label>
      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
        className="mb-3 w-full rounded-xl2 border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-teal"
      />

      <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Payment screenshot</label>
      <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mb-3 w-full text-xs" />

      {error && <p className="mb-3 text-xs text-danger">{error}</p>}

      <Button className="w-full" loading={submitting} onClick={handleSubmit}>Submit for Review</Button>
    </Modal>
  );
}