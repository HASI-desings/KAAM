import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { PageTransition } from "@/components/ui/PageTransition";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

const plans = [
  { tier: "free" as const, name: "Free", priceRs: 0, features: ["2 mid-job requests", "Standard release timer", "Boost: Rs 1,000"] },
  { tier: "basic" as const, name: "Basic", priceRs: 2500, features: ["4 mid-job requests", "Custom release timer", "Boost: Rs 1,000"] },
  { tier: "elite" as const, name: "Elite", priceRs: 7500, features: ["10 mid-job requests", "Custom release timer", "Boost: Rs 700"], highlighted: true }
];

export default function Plans() {
  const { profile, refreshProfile } = useAuth();
  const [buying, setBuying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleBuy(tier: "basic" | "elite") {
    setBuying(tier); setError(null);
    try { await api.purchaseSubscription(tier); await refreshProfile(); }
    catch (e) { setError((e as Error).message); }
    finally { setBuying(null); }
  }

  return (
    <PageTransition>
      <div className="min-h-screen px-5 py-8">
        <h1 className="mb-6 text-xl font-bold tracking-tight">Subscription Plans</h1>
        {error && <p className="mb-4 text-xs text-danger">{error}</p>}
        <div className="space-y-4">
          {plans.map((p, pi) => {
            const isCurrent = profile?.id && p.tier === (profile as any).subscriptionTier;
            return <div key={p.tier} className={`rounded-xl2 border p-4 ${p.highlighted ? "border-amber shadow-md" : "border-[var(--border)]"}`} style={p.highlighted ? { boxShadow: "var(--shadow-soft)" } : undefined}>
              <div className="mb-3 flex items-baseline justify-between"><h2 className="text-sm font-bold">{p.name} {isCurrent && <span className="text-[10px] font-normal text-teal">(current)</span>}</h2><p className="tabular-nums text-lg font-bold">Rs {p.priceRs.toLocaleString()}<span className="text-xs font-normal">/mo</span></p></div>
              <ul className="mb-3 space-y-1.5">{p.features.map((f, i) => <motion.li key={f} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: pi * 0.1 + i * 0.06 }} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]"><span className="text-teal">✓</span> {f}</motion.li>)}</ul>
              {p.tier !== "free" && !isCurrent && <Button className="w-full" loading={buying === p.tier} onClick={() => handleBuy(p.tier)}>Upgrade</Button>}
            </div>;
          })}
        </div>
      </div>
    </PageTransition>
  );
}
