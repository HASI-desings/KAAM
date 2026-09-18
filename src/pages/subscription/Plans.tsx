import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { PageTransition } from "@/components/ui/PageTransition";

const plans = [
  { name: "Free", price: 0, features: ["2 mid-job requests", "Standard release timer", "Boost: Rs 10"] },
  { name: "Basic", price: 25, features: ["4 mid-job requests", "Custom release timer", "Boost: Rs 10"] },
  { name: "Elite", price: 75, features: ["10 mid-job requests", "Custom release timer", "Boost: Rs 7"], highlighted: true }
];

export default function Plans() {
  return (
    <PageTransition>
      <div className="min-h-screen px-5 py-8">
        <h1 className="mb-6 text-xl font-bold tracking-tight">Subscription Plans</h1>
        <div className="space-y-4">
          {plans.map((p, pi) => (
            <div
              key={p.name}
              className={`rounded-xl2 border p-4 ${p.highlighted ? "border-amber shadow-md" : "border-[var(--border)]"}`}
              style={p.highlighted ? { boxShadow: "var(--shadow-soft)" } : undefined}
            >
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-sm font-bold">{p.name}</h2>
                <p className="tabular-nums text-lg font-bold">${p.price}<span className="text-xs font-normal">/mo</span></p>
              </div>
              <ul className="space-y-1.5">
                {p.features.map((f, i) => (
                  <motion.li
                    key={f}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: pi * 0.1 + i * 0.06 }}
                    className="flex items-center gap-2 text-xs text-[var(--text-secondary)]"
                  >
                    <span className="text-teal">✓</span> {f}
                  </motion.li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <Button className="mt-6 w-full">Continue</Button>
      </div>
    </PageTransition>
  );
}
