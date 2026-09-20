import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "@/context/AuthContext";
import { useAuth } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { BottomNav, type NavKey } from "@/components/ui/BottomNav";
import Login from "@/pages/auth/Login";
import CompleteProfile from "@/pages/profile/CompleteProfile";
import JobFeed from "@/pages/feed/JobFeed";
import JobDetails from "@/pages/feed/JobDetails";
import PostJob from "@/pages/jobs/PostJob";
import { OfferSubmission } from "@/pages/jobs/OfferSubmission";
import JobInProgress from "@/pages/jobs/JobInProgress";
import Wallet from "@/pages/wallet/Wallet";
import Chat from "@/pages/chat/Chat";
import ChatInbox from "@/pages/chat/ChatInbox";
import Portfolio from "@/pages/profile/Portfolio";
import Plans from "@/pages/subscription/Plans";
import ReviewQueue from "@/pages/admin/ReviewQueue";
import type { Job } from "@/types";

type Screen = "editProfile" | "feed" | "jobDetails" | "post" | "inProgress" | "wallet" | "chat" | "chatThread" | "portfolio" | "plans" | "admin";

function Shell() {
  const { session, profile, loading } = useAuth();
  const [screen, setScreen] = useState<Screen>("feed");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [offerOpen, setOfferOpen] = useState(false);

  if (loading) return <div className="flex min-h-screen items-center justify-center text-sm text-[var(--text-secondary)]">Loadingâ¦</div>;
  if (!session) return <Login />;
  if (profile && !profile.isProfileComplete) return <CompleteProfile onDone={() => setScreen("feed")} />;

  function navKeyForScreen(s: Screen): NavKey {
    if (s === "editProfile" || s === "portfolio") return "profile";
    if (s === "jobDetails" || s === "inProgress") return "feed";
    if (s === "post") return "post";
    if (s === "chatThread") return "chat";
    return s as NavKey;
  }

  return <div className="app-shell border-x border-[var(--border)] pb-24">
    <ErrorBoundary key={screen}>
      <AnimatePresence mode="wait">
        {screen === "editProfile" && <CompleteProfile key="editProfile" onDone={() => setScreen("portfolio")} />}
        {screen === "feed" && <JobFeed key="feed" onOpenJob={(job) => { setSelectedJob(job); setScreen(job.status === "open" ? "jobDetails" : "inProgress"); }} onPost={() => setScreen("post")} />}
        {screen === "post" && <PostJob key="post" onPosted={() => setScreen("feed")} />}
        {screen === "jobDetails" && selectedJob && <JobDetails key="jobDetails" job={selectedJob} onBack={() => setScreen("feed")} onSubmitOffer={() => setOfferOpen(true)} onAccepted={() => setScreen("inProgress")} />}
        {screen === "inProgress" && selectedJob && <JobInProgress key="inProgress" jobId={selectedJob.id} onBack={() => setScreen("feed")} onOpenChat={() => setScreen("chat")} />}
        {screen === "wallet" && <Wallet key="wallet" />}
        {screen === "chat" && !selectedJob && <ChatInbox key="chatInbox" onOpenChat={(jobId) => { setSelectedJob({ id: jobId } as any); setScreen("chatThread"); }} />}
        {screen === "chatThread" && selectedJob && <Chat key="chatThread" jobId={selectedJob.id} onBack={() => setScreen("chat")} />}
        {screen === "portfolio" && <Portfolio key="portfolio" onEditProfile={() => setScreen("editProfile")} onOpenPlans={() => setScreen("plans")} />}
        {screen === "plans" && <Plans key="plans" />}
        {screen === "admin" && profile?.isAdmin && <ReviewQueue key="admin" />}
      </AnimatePresence>
    </ErrorBoundary>
    {selectedJob && <OfferSubmission jobId={selectedJob.id} open={offerOpen} onClose={() => setOfferOpen(false)} />}
    <BottomNav active={navKeyForScreen(screen)} isAdmin={!!profile?.isAdmin} onNavigate={(key) => setScreen(key === "profile" ? "portfolio" : key as Screen)} />
  </div>;
}
export default function App(){return <AuthProvider><Shell/></AuthProvider>;}