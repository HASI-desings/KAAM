import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";

export function OfferSubmission({ jobId, open, onClose }: { jobId: string; open: boolean; onClose: () => void }) {
  const { session } = useAuth();
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [existing, setExisting] = useState(false);

  useEffect(() => {
    if (!open || !session) return;
    setError(null); setExisting(false);
    supabase.from("offers").select("id").eq("job_id", jobId).eq("worker_id", session.user.id).eq("status", "pending").maybeSingle()
      .then(({ data, error }) => error ? setError(error.message) : setExisting(!!data));
  }, [open, jobId, session]);

  const numeric = Number(price) * 100 || 0;

  async function submit() {
    if (!session) return setError("Please sign in again before applying.");
    if (existing) return setError("You already have a pending application for this job.");
    setSubmitting(true); setError(null);
    try {
      const { data: job, error: jobError } = await supabase.from("jobs").select("id, client_id, worker_id, status").eq("id", jobId).single();
      if (jobError) throw jobError;
      if (job.client_id === session.user.id) throw new Error("You cannot apply to your own job.");
      if (job.worker_id && job.worker_id !== session.user.id) throw new Error("This job is already assigned.");
      if (job.status !== "open") throw new Error("This job is no longer accepting applications.");
      await api.calculateFinalPrice(jobId, numeric);
      const { error: insertError } = await supabase.from("offers").insert({ job_id: jobId, worker_id: session.user.id, offer_amount_cents: numeric, status: "pending" });
      if (insertError) throw new Error(insertError.code === "23505" ? "You already have a pending application for this job." : insertError.message);
      setExisting(true); setPrice(""); onClose();
    } catch (e) { setError((e as Error).message || "Could not submit your application."); }
    finally { setSubmitting(false); }
  }

  return <BottomSheet open={open} onClose={onClose}>
    <h2 className="mb-4 text-lg font-semibold">Apply to Job</h2>
    <p className="mb-4 text-xs text-[var(--text-secondary)]">Submit your price. Your application will be saved to this job immediately.</p>
    <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Your price (PKR)</label>
    <input value={price} onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ""))} placeholder="9500" inputMode="numeric" disabled={submitting || existing}
      className="w-full rounded-xl2 border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-teal" />
    <AnimatePresence>
      {existing && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-xs text-teal">Application already submitted for this job.</motion.p>}
      {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2 text-xs text-danger">{error}</motion.p>}
    </AnimatePresence>
    <Button className="mt-5 w-full" disabled={numeric === 0 || submitting || existing} loading={submitting} onClick={submit}>{existing ? "Applied" : "Send Application"}</Button>
  </BottomSheet>;
}