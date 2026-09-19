import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/ui/PageTransition";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { QuizModal } from "@/components/job/QuizModal";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";

interface Stats { completedJobs: number; repeatClientPct: number; avgRating: number | null; }
interface CategoryRow { id: string; name: string; }

export default function Portfolio({ onEditProfile, onOpenPlans }: { onEditProfile: () => void; onOpenPlans: () => void }) {
  const { session, profile, refreshProfile } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [applyCode, setApplyCode] = useState("");
  const [referralMsg, setReferralMsg] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [quizCategoryId, setQuizCategoryId] = useState<string | null>(null);

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
    api.myReferralCode().then((r) => setReferralCode(r.code)).catch(() => {});
    supabase.from("categories").select("id, name").order("name").then(({ data }) => setCategories(data ?? []));
  }, [session]);

  async function handlePurchaseVerification() {
    setVerifying(true); setVerifyError(null);
    try { await api.purchaseVerification(); await refreshProfile(); }
    catch (e) { setVerifyError((e as Error).message); }
    finally { setVerifying(false); }
  }

  async function handleApplyCode() {
    setReferralMsg(null);
    try { const r = await api.applyReferralCode(applyCode.trim()); setReferralMsg(r.note); }
    catch (e) { setReferralMsg((e as Error).message); }
  }

  return <PageTransition><div className="min-h-screen px-5 py-8">
    <div className="mb-6 flex items-center gap-4"><div className="relative h-16 w-16 overflow-hidden rounded-full bg-teal/10">{profile?.isVerified && <motion.div className="absolute inset-0 -translate-x-full" animate={{ x: ["-100%", "200%"] }} transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }} style={{ background: "linear-gradient(120deg, transparent, rgba(232,163,61,0.5), transparent)" }} />}</div><div className="flex-1"><h1 className="text-lg font-bold">{profile?.fullName || "Add your name"}</h1><p className="text-xs text-[var(--text-secondary)]">{profile?.isVerified ? "Verified" : "Not verified"} · {profile?.occupation || "Occupation not set"}</p></div><div className="flex flex-col items-end gap-1"><button onClick={onEditProfile} className="text-xs font-medium text-teal underline underline-offset-2">Edit</button><button onClick={onOpenPlans} className="text-xs font-medium text-teal underline underline-offset-2">Plan</button></div></div>
    <div className="mb-6 grid grid-cols-3 gap-3">{loading || !stats ? <><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /></> : <><StatCard value={String(stats.completedJobs)} label="Completed jobs" /><StatCard value={`${stats.repeatClientPct}%`} label="Repeat clients" /><StatCard value={stats.avgRating ? stats.avgRating.toFixed(1) : "—"} label="Avg rating" /></>}</div>
    {!profile?.isVerified && <div className="mb-6 rounded-xl2 border border-[var(--border)] p-4"><p className="mb-2 text-sm font-medium">Get verified — Rs 10,000</p>{verifyError && <p className="mb-2 text-xs text-danger">{verifyError}</p>}<Button loading={verifying} onClick={handlePurchaseVerification}>Purchase Verification</Button></div>}
    <div className="mb-6 rounded-xl2 border border-[var(--border)] p-4"><p className="mb-2 text-sm font-medium">Skill verification quiz</p><select onChange={(e) => e.target.value && setQuizCategoryId(e.target.value)} defaultValue="" className="w-full rounded-xl2 border border-[var(--border)] bg-transparent px-3 py-2 text-xs outline-none"><option value="" disabled>Choose a category to get verified in</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
    <div className="rounded-xl2 border border-[var(--border)] p-4"><p className="mb-1 text-sm font-medium">Your referral code</p><p className="mb-3 tabular-nums text-lg font-bold text-teal">{referralCode ?? "—"}</p><div className="flex gap-2"><input value={applyCode} onChange={(e) => setApplyCode(e.target.value)} placeholder="Have a code? Enter it" className="flex-1 rounded-xl2 border border-[var(--border)] bg-transparent px-3 py-2 text-xs outline-none focus:border-teal" /><button onClick={handleApplyCode} className="rounded-xl2 bg-teal px-3 py-2 text-xs font-semibold text-white">Apply</button></div>{referralMsg && <p className="mt-2 text-xs text-[var(--text-secondary)]">{referralMsg}</p>}</div>
    {quizCategoryId && <QuizModal open={!!quizCategoryId} onClose={() => setQuizCategoryId(null)} categoryId={quizCategoryId} />}
  </div></PageTransition>;
}
function StatCard({ value, label }: { value: string; label: string }) { return <div className="rounded-xl2 border border-[var(--border)] p-3 text-center"><p className="tabular-nums text-lg font-bold">{value}</p><p className="text-[10px] text-[var(--text-secondary)]">{label}</p></div>; }
