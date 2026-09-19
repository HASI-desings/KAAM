import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "@/context/AuthContext";
import { useAuth } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { DemoBadge } from "@/components/ui/DemoBadge";
import Login from "@/pages/auth/Login";
import CompleteProfile from "@/pages/profile/CompleteProfile";
import JobFeed from "@/pages/feed/JobFeed";
import JobDetails from "@/pages/feed/JobDetails";
import { OfferSubmission } from "@/pages/jobs/OfferSubmission";
import JobInProgress from "@/pages/jobs/JobInProgress";
import EscrowConfirmation from "@/pages/wallet/EscrowConfirmation";
import Wallet from "@/pages/wallet/Wallet";
import Chat from "@/pages/chat/Chat";
import Ratings from "@/pages/profile/Ratings";
import Portfolio from "@/pages/profile/Portfolio";
import Plans from "@/pages/subscription/Plans";
import ReviewQueue from "@/pages/admin/ReviewQueue";
import type { Job } from "@/types";

type Screen = "profile" | "feed" | "jobDetails" | "inProgress" | "escrow" | "wallet" | "chat" | "ratings" | "portfolio" | "plans" | "admin";

// Screens still on hardcoded demo data — not wired to Supabase yet.
const DEMO_SCREENS: Screen[] = ["inProgress", "escrow", "chat", "ratings", "portfolio", "plans", "admin"];

const NAV: { key: Screen; label: string }[] = [
  { key: "profile", label: "Profile" }, { key: "feed", label: "Feed" }, { key: "inProgress", label: "In Progress" },
  { key: "escrow", label: "Escrow" }, { key: "wallet", label: "Wallet" }, { key: "chat", label: "Chat" },
  { key: "ratings", label: "Ratings" }, { key: "portfolio", label: "Portfolio" }, { key: "plans", label: "Plans" }, { key: "admin", label: "Admin" }
];

function Shell() {
  const { session, loading, signOut } = useAuth();
  const [screen, setScreen] = useState<Screen>("feed");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [offerOpen, setOfferOpen] = useState(false);
  const [devMenuOpen, setDevMenuOpen] = useState(false);

  if (loading) return <div className="flex min-h-screen items-center justify-center text-sm text-[var(--text-secondary)]">Loading…</div>;
  if (!session) return <Login />;

  return (
    <div className="app-shell border-x border-[var(--border)]">
      {DEMO_SCREENS.includes(screen) && <DemoBadge />}

      <ErrorBoundary key={screen}>
        <AnimatePresence mode="wait">
          {screen === "profile" && <CompleteProfile key="profile" />}
          {screen === "feed" && <JobFeed key="feed" onOpenJob={(job) => { setSelectedJob(job); setScreen("jobDetails"); }} />}
          {screen === "jobDetails" && selectedJob && (
            <JobDetails key="jobDetails" job={selectedJob} onBack={() => setScreen("feed")} onSubmitOffer={() => setOfferOpen(true)} />
          )}
          {screen === "inProgress" && <JobInProgress key="inProgress" />}
          {screen === "escrow" && <EscrowConfirmation key="escrow" />}
          {screen === "wallet" && <Wallet key="wallet" />}
          {screen === "chat" && <Chat key="chat" />}
          {screen === "ratings" && <Ratings key="ratings" />}
          {screen === "portfolio" && <Portfolio key="portfolio" />}
          {screen === "plans" && <Plans key="plans" />}
          {screen === "admin" && <ReviewQueue key="admin" />}
        </AnimatePresence>
      </ErrorBoundary>

      {selectedJob && <OfferSubmission jobId={selectedJob.id} open={offerOpen} onClose={() => setOfferOpen(false)} />}

      {/* Collapsed by default — this is a dev tool for jumping between screens
          during testing, not part of the real product navigation. */}
      <div className="sticky bottom-0 border-t border-[var(--border)] bg-[var(--bg-elevated)]">
        {devMenuOpen ? (
          <div className="flex flex-wrap items-center gap-1 p-2">
            {NAV.map((n) => (
              <button
                key={n.key}
                onClick={() => setScreen(n.key)}
                className={`rounded-md px-2 py-1 text-[10px] font-medium ${screen === n.key ? "bg-teal text-white" : "bg-[var(--border)] text-[var(--text-secondary)]"}`}
              >
                {n.label}
              </button>
            ))}
            <button onClick={signOut} className="rounded-md bg-danger px-2 py-1 text-[10px] font-medium text-white">Sign out</button>
            <button onClick={() => setDevMenuOpen(false)} className="ml-auto rounded-md px-2 py-1 text-[10px] text-[var(--text-secondary)]">✕</button>
          </div>
        ) : (
          <button onClick={() => setDevMenuOpen(true)} className="w-full py-1.5 text-center text-[10px] text-[var(--text-secondary)]">
            ⋯
          </button>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}
