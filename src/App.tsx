import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "@/context/AuthContext";
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

type Screen =
  | "login" | "profile" | "feed" | "jobDetails" | "inProgress"
  | "escrow" | "wallet" | "chat" | "ratings" | "portfolio" | "plans" | "admin";

const NAV: { key: Screen; label: string }[] = [
  { key: "login", label: "Auth" },
  { key: "profile", label: "Profile" },
  { key: "feed", label: "Feed" },
  { key: "inProgress", label: "In Progress" },
  { key: "escrow", label: "Escrow" },
  { key: "wallet", label: "Wallet" },
  { key: "chat", label: "Chat" },
  { key: "ratings", label: "Ratings" },
  { key: "portfolio", label: "Portfolio" },
  { key: "plans", label: "Plans" },
  { key: "admin", label: "Admin" }
];

// Demo-mode shell: this in-memory screen switcher stands in for real routing
// until Supabase Auth + protected routes are wired in Phase 1 (see router.tsx
// for the real react-router structure this will move to).
export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [offerOpen, setOfferOpen] = useState(false);

  return (
    <AuthProvider>
      <div className="app-shell border-x border-[var(--border)]">
        <AnimatePresence mode="wait">
          {screen === "login" && <Login key="login" />}
          {screen === "profile" && <CompleteProfile key="profile" />}
          {screen === "feed" && (
            <JobFeed
              key="feed"
              onOpenJob={(job) => {
                setSelectedJob(job);
                setScreen("jobDetails");
              }}
            />
          )}
          {screen === "jobDetails" && selectedJob && (
            <JobDetails
              key="jobDetails"
              job={selectedJob}
              onBack={() => setScreen("feed")}
              onSubmitOffer={() => setOfferOpen(true)}
            />
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

        <OfferSubmission open={offerOpen} onClose={() => setOfferOpen(false)} />

        {/* Dev-only screen switcher — remove once real navigation (router.tsx) is wired to auth state */}
        <div className="sticky bottom-0 flex flex-wrap gap-1 border-t border-[var(--border)] bg-[var(--bg-elevated)] p-2">
          {NAV.map((n) => (
            <button
              key={n.key}
              onClick={() => setScreen(n.key)}
              className={`rounded-md px-2 py-1 text-[10px] font-medium ${
                screen === n.key ? "bg-teal text-white" : "bg-[var(--border)] text-[var(--text-secondary)]"
              }`}
            >
              {n.label}
            </button>
          ))}
        </div>
      </div>
    </AuthProvider>
  );
}
