import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "@/context/AuthContext";
import { useAuth } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { DemoBadge } from "@/components/ui/DemoBadge";
import { BottomNav, type NavKey } from "@/components/ui/BottomNav";
import Login from "@/pages/auth/Login";
import CompleteProfile from "@/pages/profile/CompleteProfile";
import JobFeed from "@/pages/feed/JobFeed";
import JobDetails from "@/pages/feed/JobDetails";
import { OfferSubmission } from "@/pages/jobs/OfferSubmission";
import JobInProgress from "@/pages/jobs/JobInProgress";
import EscrowConfirmation from "@/pages/wallet/EscrowConfirmation";
import Wallet from "@/pages/wallet/Wallet";
import Chat from "@/pages/chat/Chat";
import Portfolio from "@/pages/profile/Portfolio";
import Plans from "@/pages/subscription/Plans";
import ReviewQueue from "@/pages/admin/ReviewQueue";
import type { Job } from "@/types";

type Screen = "editProfile" | "feed" | "jobDetails" | "inProgress" | "escrow" | "wallet" | "chat" | "portfolio" | "plans" | "admin";

const DEMO_SCREENS: Screen[] = ["inProgress", "escrow", "chat", "plans", "admin"];

function Shell() {
  const { session, profile, loading } = useAuth();
  const [screen, setScreen] = useState<Screen>("feed");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [offerOpen, setOfferOpen] = useState(false);
  const [devMenuOpen, setDevMenuOpen] = useState(false);

  if (loading) return <div className="flex min-h-screen items-center justify-center text-sm text-[var(--text-secondary)]">Loading…</div>;
  if (!session) return <Login />;
  if (profile && !profile.isProfileComplete) return <CompleteProfile onDone={() => setScreen("feed")} />;

  function navKeyForScreen(s: Screen): NavKey {
    if (s === "editProfile" || s === "portfolio") return "profile";
    if (s === "jobDetails" || s === "inProgress" || s === "escrow") return "feed";
    return s as NavKey;
  }

  return (
    <div className="app-shell border-x border-[var(--border)] pb-24">
      {DEMO_SCREENS.includes(screen) && <DemoBadge />}

      <ErrorBoundary key={screen}>
        <AnimatePresence mode="wait">
          {screen === "editProfile" && <CompleteProfile key="editProfile" onDone={() => setScreen("portfolio")} />}
          {screen === "feed" && <JobFeed key="feed" onOpenJob={(job) => { setSelectedJob(job); setScreen("jobDetails"); }} />}
          {screen === "jobDetails" && selectedJob && (
            <JobDetails key="jobDetails" job={selectedJob} onBack={() => setScreen("feed")} onSubmitOffer={() => setOfferOpen(true)} />
          )}
          {screen === "inProgress" && <JobInProgress key="inProgress" />}
          {screen === "escrow" && <EscrowConfirmation key="escrow" />}
          {screen === "wallet" && <Wallet key="wallet" />}
          {screen === "chat" && <Chat key="chat" />}
          {screen === "portfolio" && <Portfolio key="portfolio" onEditProfile={() => setScreen("editProfile")} />}
          {screen === "plans" && <Plans key="plans" />}
          {screen === "admin" && profile?.isAdmin && <ReviewQueue key="admin" />}
        </AnimatePresence>
      </ErrorBoundary>

      {selectedJob && <OfferSubmission jobId={selectedJob.id} open={offerOpen} onClose={() => setOfferOpen(false)} />}

      <BottomNav
        active={navKeyForScreen(screen)}
        isAdmin={!!profile?.isAdmin}
        onNavigate={(key) => setScreen(key === "profile" ? "portfolio" : key)}
      />

      <div className="fixed bottom-1 left-1 z-40">
        <button onClick={() => setDevMenuOpen((v) => !v)} className="text-[9px] text-[var(--text-secondary)]/40">⋯</button>
        {devMenuOpen && (
          <div className="mt-1 flex flex-col gap-1 rounded-xl2 border border-[var(--border)] bg-[var(--bg-elevated)] p-2">
            {(["inProgress", "escrow", "plans"] as Screen[]).map((s) => (
              <button key={s} onClick={() => setScreen(s)} className="text-left text-[10px] text-[var(--text-secondary)]">
                {s}
              </button>
            ))}
          </div>
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
