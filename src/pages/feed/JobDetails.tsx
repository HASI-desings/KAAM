import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { PageTransition } from "@/components/ui/PageTransition";
import type { Job } from "@/types";

const checklist = ["Job description reviewed", "Vacation location confirmed", "Materials and inventory listed", "Price floor"];

export default function JobDetails({ job, onBack, onSubmitOffer }: { job: Job; onBack: () => void; onSubmitOffer: () => void }) {
  return (
    <PageTransition>
      <motion.div layoutId={`job-card-${job.id}`} className="min-h-screen px-5 py-6">
        <button onClick={onBack} className="mb-4 text-sm text-teal">
          ← Back
        </button>
        <p className="mb-1 text-xs font-medium text-teal">{job.categoryId}</p>
        <h1 className="mb-3 text-xl font-bold tracking-tight">{job.title}</h1>
        <p className="mb-5 text-sm leading-relaxed text-[var(--text-secondary)]">
          Full job description would render here from job.description.
        </p>

        <div className="mb-5 rounded-xl2 border border-[var(--border)] p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">Checklist</p>
          <ul className="space-y-2">
            {checklist.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm">
                <span className="flex h-4 w-4 items-center justify-center rounded-full border border-teal text-[10px] text-teal">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-6 flex items-center justify-between border-t border-[var(--border)] pt-4">
          <div>
            <p className="text-xs text-[var(--text-secondary)]">Price range</p>
            <p className="tabular-nums text-lg font-bold">
              Rs {job.priceMin.toLocaleString()} – {job.priceMax.toLocaleString()}
            </p>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            transition={{ delay: 0.3 }}
            className="rounded-full border border-amber px-3 py-1 text-[11px] font-medium text-amber"
          >
            Avg rate: Rs 9,200
          </motion.div>
        </div>

        <Button className="w-full" onClick={onSubmitOffer}>
          Submit Offer
        </Button>
      </motion.div>
    </PageTransition>
  );
}
