import { useEffect, useState } from "react";
import { PageTransition } from "@/components/ui/PageTransition";
import { Skeleton } from "@/components/ui/Skeleton";
import { supabase } from "@/lib/supabaseClient";

interface Row { id: string; name: string; min_completed_jobs_for_average: number; average_price_cents: number | null; completed_job_count: number; }

export default function AverageRateManager() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  async function load() {
    setLoading(true);
    const { data } = await supabase.from("categories").select("id, name, min_completed_jobs_for_average, category_average_rates(average_price_cents, completed_job_count)").order("name");
    setRows((data ?? []).map((r: any) => ({ id: r.id, name: r.name, min_completed_jobs_for_average: r.min_completed_jobs_for_average, average_price_cents: r.category_average_rates?.[0]?.average_price_cents ?? null, completed_job_count: r.category_average_rates?.[0]?.completed_job_count ?? 0 })));
    setLoading(false);
  }
  useEffect(() => { load(); }, []);
  async function updateThreshold(id: string, value: number) { await supabase.from("categories").update({ min_completed_jobs_for_average: value }).eq("id", id); await load(); }

  return <PageTransition><div className="min-h-screen px-5 py-8"><h1 className="mb-4 text-lg font-bold">Average Rate Manager</h1>
    {loading ? <div className="space-y-2"><Skeleton className="h-12" /><Skeleton className="h-12" /></div> :
    <div className="space-y-2">{rows.map((r) => <div key={r.id} className="flex items-center justify-between rounded-xl2 border border-[var(--border)] p-3 text-xs"><div><p className="font-medium">{r.name}</p><p className="tabular-nums text-[var(--text-secondary)]">{r.completed_job_count}/{r.min_completed_jobs_for_average} jobs{r.average_price_cents ? ` · Avg Rs ${(r.average_price_cents / 100).toLocaleString()}` : " · no floor yet"}</p></div><input type="number" defaultValue={r.min_completed_jobs_for_average} onBlur={(e) => updateThreshold(r.id, Number(e.target.value))} className="w-16 rounded-xl2 border border-[var(--border)] bg-transparent px-2 py-1 text-right outline-none focus:border-teal" /></div>)}</div>}
  </div></PageTransition>;
}
