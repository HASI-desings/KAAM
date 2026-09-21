import { motion } from "framer-motion";
import type { Job } from "@/types";

interface JobCardProps { job: Job; onClick: () => void; }
export function JobCard({ job, onClick }: JobCardProps) {
  return (<motion.button onClick={onClick} layoutId={`job-card-${job.id}`} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 300, damping: 26 }} className="relative w-full rounded-xl2 border border-[var(--border)] bg-[var(--bg-elevated)] p-4 text-left">
    {job.boosted && <span className="absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white" style={{ background: "linear-gradient(120deg, #E8A33D 0%, #F2C572 100%)" }}>Boosted</span>}
    <p className="mb-1 text-xs font-medium text-teal">{job.categoryId}</p><h3 className="mb-2 text-sm font-semibold leading-snug">{job.title}</h3><p className="tabular-nums text-sm font-bold">Rs {job.priceMin.toLocaleString()} – {job.priceMax.toLocaleString()}</p><p className="mt-1 text-[11px] text-[var(--text-secondary)]">Due {new Date(job.deadline).toLocaleDateString()}</p>
  </motion.button>);
}
