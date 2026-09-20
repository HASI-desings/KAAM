import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { JobCard } from "@/components/job/JobCard";
import { PageTransition } from "@/components/ui/PageTransition";
import { Skeleton } from "@/components/ui/Skeleton";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import type { Job } from "@/types";

interface CategoryRow {
  id: string;
  name: string;
}

function mapJob(row: any): Job {
  return {
    id: row.id,
    clientId: row.client_id,
    categoryId: row.category_id,
    title: row.title,
    description: row.description,
    paymentType: row.payment_type,
    priceMin: (row.price_min_cents ?? 0) / 100,
    priceMax: (row.price_max_cents ?? 0) / 100,
    deadline: row.deadline,
    status: row.status,
    boosted: row.is_boosted,
    progress: row.progress_percent,
  };
}

const SELECT =
  "id, client_id, worker_id, category_id, title, description, payment_type, price_min_cents, price_max_cents, deadline, status, is_boosted, progress_percent, categories(name)";

const MAX_FEED_JOBS = 50;

export default function JobFeed({
  onOpenJob,
  onPost,
}: {
  onOpenJob: (job: Job) => void;
  onPost?: () => void;
}) {
  const { session } = useAuth();
  const [view, setView] = useState<"browse" | "mine">("browse");
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [active, setActive] = useState("All");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("categories").select("id, name").order("name").then(({ data }) => setCategories(data ?? []));
  }, []);

  useEffect(() => {
    if (!session) return;
    setLoading(true);

    if (view === "browse") {
      let query = supabase
        .from("jobs")
        .select(SELECT)
        .eq("status", "open")
        .neq("client_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(MAX_FEED_JOBS);

      if (active !== "All") {
        const cat = categories.find((c) => c.name === active);
        if (cat) query = query.eq("category_id", cat.id);
      }

      query.then(({ data }) => {
        setJobs((data ?? []).map(mapJob));
        setLoading(false);
      });
    } else {
      supabase
        .from("jobs")
        .select(SELECT)
        .or("client_id.eq." + session.user.id + ",worker_id.eq." + session.user.id)
        .order("created_at", { ascending: false })
        .limit(MAX_FEED_JOBS)
        .then(({ data }) => {
          setJobs((data ?? []).map(mapJob));
          setLoading(false);
        });
    }
  }, [active, categories, view, session]);

  return (
    <PageTransition>
      <div className="min-h-screen px-4 py-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="text-xl font-bold tracking-tight">{view === "browse" ? "Job Feed" : "My Jobs"}</h1>
          <div className="flex shrink-0 rounded-full border border-[var(--border)] p-0.5 text-[11px] font-medium">
            <button onClick={() => setView("browse")} className={"rounded-full px-3 py-1 " + (view === "browse" ? "bg-teal text-white" : "text-[var(--text-secondary)]")}>Browse</button>
            <button onClick={() => setView("mine")} className={"rounded-full px-3 py-1 " + (view === "mine" ? "bg-teal text-white" : "text-[var(--text-secondary)]")}>My Jobs</button>
          </div>
        </div>

        {view === "browse" && (
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            {["All", ...categories.map(c => c.name)].map(c => (
              <button key={c} onClick={() => setActive(c)} className="relative shrink-0 rounded-full px-4 py-1.5 text-xs font-medium">
                {active === c && <motion.div layoutId="pill" className="absolute inset-0 rounded-full bg-teal" transition={{type:"spring", stiffness:350, damping:30}}/>}
                <span className={"relative z-10 " + (active===c ? "text-white" : "text-[var(--text-secondary)]")}>{c}</span>
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({length:6}).map((_,i)=><Skeleton key={i} className="h-32"/> )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map(job => <JobCard key={job.id} job={job} onClick={() => onOpenJob(job)}/>)}
            {jobs.length===0 && (
              <p className="col-span-full text-center text-sm text-[var(--text-secondary)]">
                {view === "browse" ? "No open jobs in this category yet." : <>No jobs yet â post one with the + button{onPost ? " or use the post action above." : "."}</>}
              </p>
            )}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
