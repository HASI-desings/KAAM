import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { PageTransition } from "@/components/ui/PageTransition";

export default function Ratings() {
  const [stars, setStars] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  return (
    <PageTransition>
      <div className="min-h-screen px-5 py-8">
        <h1 className="mb-6 text-xl font-bold tracking-tight">Ratings</h1>

        <p className="mb-3 text-sm text-[var(--text-secondary)]">Rate your experience</p>
        <div className="mb-4 flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <motion.button
              key={n}
              onMouseDown={() => setStars(n)}
              whileTap={{ scale: 1.3 }}
              transition={{ type: "spring", stiffness: 500, damping: 12 }}
              className="text-3xl"
            >
              <span className={n <= stars ? "text-amber" : "text-[var(--border)]"}>★</span>
            </motion.button>
          ))}
        </div>

        <button className="mb-6 text-xs font-medium text-teal underline underline-offset-2">+ Add proof (optional)</button>

        <Button className="w-full" disabled={stars === 0} onClick={() => setSubmitted(true)}>
          Submit Rating
        </Button>

        <AnimatePresence>
          {submitted && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 rounded-xl2 border border-[var(--border)] p-4"
            >
              <p className="mb-1 text-sm font-semibold">Submitted rating</p>
              <div className="mb-1 text-amber">{"★".repeat(stars)}</div>
              <p className="text-xs text-[var(--text-secondary)]">Verified stay</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
