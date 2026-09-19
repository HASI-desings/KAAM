import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { JobCard } from "@/components/job/JobCard";
import { PageTransition } from "@/components/ui/PageTransition";
import { Skeleton } from "@/components/ui/Skeleton";
import { supabase } from "@/lib/supabaseClient";
import type { Job } from "@/types";

interface CategoryRow { id: string; name: string; }

function mapJob(row: any): Job {
  return {
    id: row.id,
    clientId: row.client_id,
    categoryId: row.categories?.name ?? row.category_id,
    title: row.title,
    description: row.description,
    paymentType: row.payment_type,
    priceMin: (row.price_min_cents ?? 0) / 100,
    priceMax: (row.price_max_cents ?? 0) / 100,
    deadline: row.deadline,
    status: row.status,
    boosted: row.is_boosted,
    progress: row.progress_percent
  };
}

export default function JobFeed({ onOpenJob }: { onOpenJob: (job: Job) => void }) {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [active, setActive] = useState("All");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("categories").select("id, name").order("name").then(({ data }) => setCategories(data ?? []));
  }, []);

  useEffect(() => {
    setLoading(true);
    let query = supabase
      .from("jobs")
      .select("id, client_id, category_id, title, description, payment_type, price_min_cents, price_max_cents, deadline, status, is_boosted, progress_percent, categories(name)")
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (active !== "All") {
      const cat = categories.find((c) => c.name === active);
      if (cat) query = query.eq("category_id", cat.id);
    }

    query.then(({ data }) => {
      setJobs((data ?? []).map(mapJob));
      setLoading(false);
    });
  }, [active, categories]);

  return (
    <PageTransition>
      <div className="min-h-screen px-4 py-6">
        <h1 className="mb-4 text-xl font-bold tracking-tight">Job Feed</h1>

        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {["All", ...categories.map((c) => c.name)].map((c) => (
            <button key={c} onClick={() => setActive(c)} className="relative shrink-0 rounded-full px-4 py-1.5 text-xs font-medium">
              {active === c && (
                <motion.div layoutId="pill" className="absolute inset-0 rounded-full bg-teal" transition={{ type: "spring", stiffness: 350, damping: 30 }} />
              )}
              <span className={`relative z-10 ${active === c ? "text-white" : "text-[var(--text-secondary)]"}`}>{c}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {jobs.map((job) => <JobCard key={job.id} job={job} onClick={() => onOpenJob(job)} />)}
            {jobs.length === 0 && <p className="col-span-2 text-center text-sm text-[var(--text-secondary)]">No open jobs in this category yet.</p>}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
