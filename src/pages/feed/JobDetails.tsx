import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { PageTransition } from "@/components/ui/PageTransition";
import { api } from "@/lib/api";
import type { Job } from "@/types";

export default function JobDetails({ job, onBack, onSubmitOffer }: { job: Job; onBack: () => void; onSubmitOffer: () => void }) {
  const [avgRate, setAvgRate] = useState<{ hasFloor: boolean; averagePriceCents: number | null } | null>(null);

  useEffect(() => {
    api.checkAverageRate(job.categoryId).then(setAvgRate).catch(() => setAvgRate(null));
  }, [job.categoryId]);

  return (
    <PageTransition>
      <motion.div layoutId={`job-card-${job.id}`} className="min-h-screen px-5 py-6">
        <button onClick={onBack} className="mb-4 text-sm text-teal">← Back</button>
        <p className="mb-1 text-xs font-medium text-teal">{job.categoryId}</p>
        <h1 className="mb-3 text-xl font-bold tracking-tight">{job.title}</h1>
        <p className="mb-5 text-sm leading-relaxed text-[var(--text-secondary)]">{job.description}</p>

        <div className="mb-6 flex items-center justify-between border-t border-[var(--border)] pt-4">
          <div>
            <p className="text-xs text-[var(--text-secondary)]">Price range</p>
            <p className="tabular-nums text-lg font-bold">Rs {job.priceMin.toLocaleString()} – {job.priceMax.toLocaleString()}</p>
          </div>
          {avgRate?.hasFloor && avgRate.averagePriceCents && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.6 }} className="rounded-full border border-amber px-3 py-1 text-[11px] font-medium text-amber">
              Avg rate: Rs {(avgRate.averagePriceCents / 100).toLocaleString()}
            </motion.div>
          )}
        </div>

        <Button className="w-full" onClick={onSubmitOffer}>Submit Offer</Button>
      </motion.div>
    </PageTransition>
  );
}
