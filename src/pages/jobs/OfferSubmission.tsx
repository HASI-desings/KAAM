import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabaseClient";

export function OfferSubmission({ jobId, open, onClose }: { jobId: string; open: boolean; onClose: () => void }) {
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const numeric = Number(price) * 100 || 0; // rupees -> paisa

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      await api.calculateFinalPrice(jobId, numeric); // re-validates floor server-side; throws if below it
      const { data: userData } = await supabase.auth.getUser();
      await supabase.from("offers").insert({
        job_id: jobId,
        worker_id: userData.user?.id,
        offer_amount_cents: numeric,
        status: "pending"
      });
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose}>
      <h2 className="mb-4 text-lg font-semibold">Offer Submission</h2>
      <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Your price (PKR)</label>
      <input
        value={price}
        onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ""))}
        placeholder="9500"
        inputMode="numeric"
        className="w-full rounded-xl2 border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-teal"
      />
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-2 text-xs text-warning">
            {error}
          </motion.p>
        )}
      </AnimatePresence>
      <Button className="mt-5 w-full" disabled={numeric === 0 || submitting} onClick={submit}>
        {submitting ? "Sending..." : "Send Offer"}
      </Button>
    </BottomSheet>
  );
}
