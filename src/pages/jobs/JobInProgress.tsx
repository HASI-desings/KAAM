import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { PageTransition } from "@/components/ui/PageTransition";
import { api } from "@/lib/api";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";

interface JobRow {
  id: string; title: string; client_id: string; worker_id: string | null;
  status: string; progress_percent: number; pause_count: number; deadline: string;
  escrow_amount_cents: number | null;
}
interface ProgressRow { id: string; note: string | null; percent_at_update: number; created_at: string; }

export default function JobInProgress({ jobId, onBack, onOpenChat }: { jobId: string; onBack: () => void; onOpenChat: () => void }) {
  const { session } = useAuth();
  const [job, setJob] = useState<JobRow | null>(null);
  const [updates, setUpdates] = useState<ProgressRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rateOpen, setRateOpen] = useState(false);

  async function load() {
    const [{ data: jobData }, { data: progressData }] = await Promise.all([
      supabase.from("jobs").select("id, title, client_id, worker_id, status, progress_percent, pause_count, deadline, escrow_amount_cents").eq("id", jobId).single(),
      supabase.from("job_progress").select("id, note, percent_at_update, created_at").eq("job_id", jobId).order("created_at", { ascending: false })
    ]);
    setJob(jobData);
    setUpdates(progressData ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [jobId]);

  const isWorker = session?.user.id === job?.worker_id;
  const isClient = session?.user.id === job?.client_id;

  async function handlePause() {
    setBusy("pause");
    setError(null);
    try {
      await api.jobAction(jobId, "pause");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
      setPauseOpen(false);
    }
  }

  async function handleResume() {
    setBusy("resume");
    try {
      await api.jobAction(jobId, "resume");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function handleMarkSubmitted() {
    setBusy("submit");
    try {
      await api.jobAction(jobId, "mark-submitted");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function handleRelease() {
    setBusy("release");
    try {
      await api.releaseEscrow(jobId, "client_confirmed");
      await load();
      setRateOpen(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  if (loading || !job) {
    return (
      <PageTransition>
        <div className="min-h-screen space-y-4 px-5 py-6">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </PageTransition>
    );
  }

  const progress = job.progress_percent;
  const barColor = progress < 40 ? "#D98C3F" : progress < 80 ? "#E8A33D" : "#3E8C5A";
  const isPaused = job.status === "paused";

  return (
    <PageTransition>
      <div className="min-h-screen px-5 py-6">
        <button onClick={onBack} className="mb-3 text-sm text-teal">← Back</button>
        <h1 className="mb-1 text-xl font-bold tracking-tight">{job.title}</h1>
        <p className="mb-5 text-xs capitalize text-[var(--text-secondary)]">Status: {job.status.replace("_", " ")}</p>

        <div className="mb-2 flex justify-between text-xs">
          <span className="font-medium">Progress</span>
          <span className="tabular-nums font-semibold">{progress}%</span>
        </div>
        <div className="mb-6 h-2.5 w-full overflow-hidden rounded-full bg-[var(--border)]">
          <motion.div className="h-full rounded-full" animate={{ width: `${progress}%`, backgroundColor: barColor }} transition={{ duration: 0.8, ease: "easeOut" }} />
        </div>

        <div className="mb-6 flex items-center justify-between rounded-xl2 border border-[var(--border)] p-4">
          <div>
            <p className="text-xs text-[var(--text-secondary)]">Deadline</p>
            <p className="text-sm font-semibold">{new Date(job.deadline).toLocaleDateString()}</p>
          </div>
          <button onClick={onOpenChat} className="text-xs font-medium text-teal underline underline-offset-2">Message</button>
        </div>

        {error && <p className="mb-3 text-xs text-danger">{error}</p>}

        {isWorker && job.status === "in_progress" && (
          <div className="mb-6 flex gap-3">
            <Button variant="secondary" className="flex-1" loading={busy === "pause"} onClick={() => setPauseOpen(true)}>
              Pause
            </Button>
            <Button className="flex-1" loading={busy === "submit"} onClick={handleMarkSubmitted}>
              Mark Complete
            </Button>
          </div>
        )}

        {isWorker && isPaused && (
          <Button className="mb-6 w-full" loading={busy === "resume"} onClick={handleResume}>
            Resume
          </Button>
        )}

        {isClient && job.status === "submitted" && (
          <Button className="mb-6 w-full" loading={busy === "release"} onClick={handleRelease}>
            Confirm & Release Payment
          </Button>
        )}

        {job.status === "completed" && (
          <div className="mb-6 rounded-xl2 border border-success/30 bg-success/10 p-4 text-center text-sm font-medium text-success">
            Job completed — Rs {((job.escrow_amount_cents ?? 0) / 100).toLocaleString()} released.
            {isClient && (
              <button onClick={() => setRateOpen(true)} className="ml-2 underline underline-offset-2">Rate worker</button>
            )}
          </div>
        )}

        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Activity</p>
        <div className="space-y-2">
          {updates.map((u) => (
            <div key={u.id} className="rounded-xl2 border border-[var(--border)] p-3 text-xs">
              <p>{u.note}</p>
              <p className="mt-1 text-[10px] text-[var(--text-secondary)]">{new Date(u.created_at).toLocaleString()}</p>
            </div>
          ))}
          {updates.length === 0 && <p className="text-xs text-[var(--text-secondary)]">No updates yet.</p>}
        </div>

        <Modal open={pauseOpen} onClose={() => setPauseOpen(false)} title="Pause this job?">
          <p className="mb-5 text-sm text-[var(--text-secondary)]">
            {job.pause_count === 0
              ? "Your first pause is free."
              : "This is your 2nd pause — a 50% charge increase applies automatically and a penalty is deducted from your wallet."}
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setPauseOpen(false)}>Cancel</Button>
            <Button variant="destructive" className="flex-1" loading={busy === "pause"} onClick={handlePause}>Confirm Pause</Button>
          </div>
        </Modal>

        <RateModal open={rateOpen} onClose={() => setRateOpen(false)} jobId={jobId} rateeId={job.worker_id!} />
      </div>
    </PageTransition>
  );
}

function RateModal({ open, onClose, jobId, rateeId }: { open: boolean; onClose: () => void; jobId: string; rateeId: string }) {
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const { session } = useAuth();

  async function submit() {
    if (!session || stars === 0) return;
    setSaving(true);
    const { error } = await supabase.from("ratings").insert({
      job_id: jobId, rater_id: session.user.id, ratee_id: rateeId, stars, comment: comment.trim() || null
    });
    setSaving(false);
    if (!error) setDone(true);
  }

  return (
    <Modal open={open} onClose={onClose} title="Rate this job">
      {done ? (
        <p className="text-sm text-success">Thanks — your rating was submitted.</p>
      ) : (
        <>
          <div className="mb-4 flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setStars(n)} className="text-2xl">
                <span className={n <= stars ? "text-amber" : "text-[var(--border)]"}>★</span>
              </button>
            ))}
          </div>
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Optional comment" rows={3} className="mb-4 w-full resize-none rounded-xl2 border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-teal" />
          <Button className="w-full" loading={saving} disabled={stars === 0} onClick={submit}>Submit Rating</Button>
        </>
      )}
    </Modal>
  );
}
