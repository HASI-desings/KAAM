import { useState } from "react";
import { motion } from "framer-motion";
import { JobCard } from "@/components/job/JobCard";
import { PageTransition } from "@/components/ui/PageTransition";
import type { Job } from "@/types";

// Demo data only — real feed comes from Supabase in Phase 3.
const demoJobs: Job[] = [
  { id: "1", clientId: "c1", categoryId: "Home Repair", title: "Corporate Room Redesign", description: "", paymentType: "cash", priceMin: 8500, priceMax: 12500, deadline: "2026-10-01", status: "open", boosted: true, progress: 0 },
  { id: "2", clientId: "c2", categoryId: "Home Repair", title: "Corporate Room Repaint", description: "", paymentType: "cash", priceMin: 8500, priceMax: 12500, deadline: "2026-10-01", status: "open", boosted: false, progress: 0 },
  { id: "3", clientId: "c3", categoryId: "Design", title: "Logo Concepts (3)", description: "", paymentType: "cash", priceMin: 5000, priceMax: 9000, deadline: "2026-09-28", status: "open", boosted: false, progress: 0 }
];

const categories = ["All", "Home Repair", "Design", "Tutoring", "Delivery"];

export default function JobFeed({ onOpenJob }: { onOpenJob: (job: Job) => void }) {
  const [active, setActive] = useState("All");
  const filtered = active === "All" ? demoJobs : demoJobs.filter((j) => j.categoryId === active);

  return (
    <PageTransition>
      <div className="min-h-screen px-4 py-6">
        <h1 className="mb-4 text-xl font-bold tracking-tight">Job Feed</h1>

        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {categories.map((c) => (
            <button key={c} onClick={() => setActive(c)} className="relative shrink-0 rounded-full px-4 py-1.5 text-xs font-medium">
              {active === c && (
                <motion.div layoutId="pill" className="absolute inset-0 rounded-full bg-teal" transition={{ type: "spring", stiffness: 350, damping: 30 }} />
              )}
              <span className={`relative z-10 ${active === c ? "text-white" : "text-[var(--text-secondary)]"}`}>{c}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {filtered.map((job) => (
            <JobCard key={job.id} job={job} onClick={() => onOpenJob(job)} />
          ))}
        </div>
      </div>
    </PageTransition>
  );
}
