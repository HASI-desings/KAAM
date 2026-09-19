import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { PageTransition } from "@/components/ui/PageTransition";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/hooks/useAuth";

const steps: { key: "fullName" | "address" | "education" | "occupation"; label: string }[] = [
  { key: "fullName", label: "Full name" },
  { key: "address", label: "Address" },
  { key: "education", label: "Education" },
  { key: "occupation", label: "Occupation" }
];

export default function CompleteProfile({ onDone }: { onDone?: () => void }) {
  const { session, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [form, setForm] = useState({ fullName: "", address: "", education: "", occupation: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function go(delta: number) {
    setDirection(delta);
    setStep((s) => Math.min(Math.max(s + delta, 0), steps.length - 1));
  }

  async function handleFinish() {
    if (!session) return;
    setSaving(true);
    setError(null);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.fullName,
        address: form.address,
        education: form.education,
        occupation: form.occupation,
        is_profile_complete: true
      })
      .eq("id", session.user.id);
    setSaving(false);
    if (error) return setError(error.message);
    await refreshProfile();
    onDone?.();
  }

  const currentKey = steps[step].key;

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
          Step {step + 1} of {steps.length} — {steps[step].label}
        </p>

        <div className="relative min-h-[140px] overflow-hidden">
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
              <label className="block text-xs font-medium text-[var(--text-secondary)]">{steps[step].label}</label>
              <input
                value={form[currentKey]}
                onChange={(e) => setForm((f) => ({ ...f, [currentKey]: e.target.value }))}
                className="w-full rounded-xl2 border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-teal"
              />
              {currentKey === "education" && (
                <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                  <span>🔒</span>
                  <span>Editing this later requires re-verification</span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {error && <p className="mt-3 text-xs text-danger">{error}</p>}

        <div className="mt-8 flex gap-3">
          {step > 0 && (
            <Button variant="secondary" className="flex-1" onClick={() => go(-1)}>
              Back
            </Button>
          )}
          {step === steps.length - 1 ? (
            <Button className="flex-1" loading={saving} onClick={handleFinish}>
              Finish
            </Button>
          ) : (
            <Button className="flex-1" onClick={() => go(1)}>
              Next
            </Button>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
