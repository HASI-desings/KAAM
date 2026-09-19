import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/ui/PageTransition";
import { Skeleton } from "@/components/ui/Skeleton";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";

interface Stats { completedJobs: number; repeatClientPct: number; avgRating: number | null; }

export default function Portfolio({ onEditProfile }: { onEditProfile: () => void }) {
  const { session, profile } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    (async () => {
      const [{ data: completedJobs }, { data: ratings }] = await Promise.all([
        supabase.from("jobs").select("client_id").eq("worker_id", session.user.id).eq("status", "completed"),
        supabase.from("ratings").select("stars").eq("ratee_id", session.user.id).eq("is_removed", false)
      ]);

      const jobs = completedJobs ?? [];
      const distinctClients = new Set(jobs.map((j) => j.client_id)).size;
      const repeatClientPct = jobs.length > 0 ? Math.round(((jobs.length - distinctClients) / jobs.length) * 100) : 0;
      const avgRating = ratings && ratings.length > 0 ? ratings.reduce((s, r) => s + r.stars, 0) / ratings.length : null;

      setStats({ completedJobs: jobs.length, repeatClientPct, avgRating });
      setLoading(false);
    })();
  }, [session]);

  return (
    <PageTransition>
      <div className="min-h-screen px-5 py-8">
        <div className="mb-6 flex items-center gap-4">
          <div className="relative h-16 w-16 overflow-hidden rounded-full bg-teal/10">
            {profile?.isVerified && (
              <motion.div
                className="absolute inset-0 -translate-x-full"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
                style={{ background: "linear-gradient(120deg, transparent, rgba(232,163,61,0.5), transparent)" }}
              />
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold">{profile?.fullName || "Add your name"}</h1>
            <p className="text-xs text-[var(--text-secondary)]">
              {profile?.isVerified ? "Verified" : "Not verified"} · {profile?.occupation || "Occupation not set"}
            </p>
          </div>
          <button onClick={onEditProfile} className="text-xs font-medium text-teal underline underline-offset-2">
            Edit
          </button>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-3">
          {loading || !stats ? (
            <>
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </>
          ) : (
            <>
              <StatCard value={String(stats.completedJobs)} label="Completed jobs" />
              <StatCard value={`${stats.repeatClientPct}%`} label="Repeat clients" />
              <StatCard value={stats.avgRating ? stats.avgRating.toFixed(1) : "—"} label="Avg rating" />
            </>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl2 border border-[var(--border)] p-3 text-center">
      <p className="tabular-nums text-lg font-bold">{value}</p>
      <p className="text-[10px] text-[var(--text-secondary)]">{label}</p>
    </div>
  );
}
