import { motion } from "framer-motion";
import { PageTransition } from "@/components/ui/PageTransition";

const stats = [
  { label: "Completed jobs", value: "24" },
  { label: "Repeat clients", value: "38%" },
  { label: "Avg rating", value: "4.8" }
];

export default function Portfolio() {
  return (
    <PageTransition>
      <div className="min-h-screen px-5 py-8">
        <div className="mb-6 flex items-center gap-4">
          <div className="relative h-16 w-16 overflow-hidden rounded-full bg-teal/10">
            <motion.div
              className="absolute inset-0 -translate-x-full"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
              style={{ background: "linear-gradient(120deg, transparent, rgba(232,163,61,0.5), transparent)" }}
            />
          </div>
          <div>
            <h1 className="text-lg font-bold">Jasin Smith</h1>
            <p className="text-xs text-[var(--text-secondary)]">Verified badge · Verified college</p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl2 border border-[var(--border)] p-3 text-center">
              <p className="tabular-nums text-lg font-bold">{s.value}</p>
              <p className="text-[10px] text-[var(--text-secondary)]">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </PageTransition>
  );
}
