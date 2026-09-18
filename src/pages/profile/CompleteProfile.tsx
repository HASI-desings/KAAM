import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { PageTransition } from "@/components/ui/PageTransition";

const steps = ["Basic Info", "Address", "Education", "Occupation"];

export default function CompleteProfile() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  function go(delta: number) {
    setDirection(delta);
    setStep((s) => Math.min(Math.max(s + delta, 0), steps.length - 1));
  }

  return (
    <PageTransition>
      <div className="min-h-screen px-6 py-8">
        <h1 className="mb-2 text-xl font-bold tracking-tight">Complete Profile</h1>

        <div className="mb-6 flex gap-2">
          {steps.map((_, i) => (
            <motion.div
              key={i}
              className="h-1.5 flex-1 rounded-full"
              animate={{ backgroundColor: i <= step ? "#0F6659" : "#E3E3DF" }}
              transition={{ duration: 0.25 }}
            />
          ))}
        </div>

        <p className="mb-4 text-xs font-medium text-[var(--text-secondary)]">
          Step {step + 1} of {steps.length} — {steps[step]}
        </p>

        <div className="relative min-h-[180px] overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              initial={{ x: direction > 0 ? 40 : -40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direction > 0 ? -40 : 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
              className="space-y-4"
            >
              <label className="block text-xs font-medium text-[var(--text-secondary)]">{steps[step]}</label>
              <input className="w-full rounded-xl2 border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-teal" />
              {step === 2 && (
                <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                  <span>🔒</span>
                  <span>Editing this later requires re-verification</span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-8 flex gap-3">
          {step > 0 && (
            <Button variant="secondary" className="flex-1" onClick={() => go(-1)}>
              Back
            </Button>
          )}
          <Button className="flex-1" onClick={() => go(1)}>
            {step === steps.length - 1 ? "Finish" : "Next"}
          </Button>
        </div>
      </div>
    </PageTransition>
  );
}
