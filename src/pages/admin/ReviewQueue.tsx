import { useState } from "react";
import ModerationQueue from "./ModerationQueue";
import DisputeReview from "./DisputeReview";
import AverageRateManager from "./AverageRateManager";
import PaymentsQueue from "./PaymentsQueue";

const TABS = [
  { key: "messages", label: "Messages" },
  { key: "disputes", label: "Disputes" },
  { key: "rates", label: "Rates" },
  { key: "payments", label: "Payments" },
] as const;

export default function ReviewQueue() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("messages");

  return (
    <div>
      <div className="flex gap-2 border-b border-[var(--border)] px-5 pt-6">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`pb-3 text-xs font-medium ${tab === t.key ? "border-b-2 border-teal text-teal" : "text-[var(--text-secondary)]"}`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === "messages" && <ModerationQueue />}
      {tab === "disputes" && <DisputeReview />}
      {tab === "rates" && <AverageRateManager />}
      {tab === "payments" && <PaymentsQueue />}
    </div>
  );
}