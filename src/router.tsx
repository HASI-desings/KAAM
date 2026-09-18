/**
 * Real route structure — INTENTIONALLY NOT WIRED YET.
 * App.tsx currently uses an in-memory screen switcher so every screen is
 * viewable without a Supabase session. Once Phase 1 auth is live, replace
 * App.tsx's switcher with this router and gate the protected routes below
 * on useAuth().isAuthenticated.
 */
import { createBrowserRouter } from "react-router-dom";
import Login from "@/pages/auth/Login";
import CompleteProfile from "@/pages/profile/CompleteProfile";
import JobFeed from "@/pages/feed/JobFeed";

export const router = createBrowserRouter([
  { path: "/", element: <Login /> },
  { path: "/profile/complete", element: <CompleteProfile /> },
  { path: "/feed", element: <JobFeed onOpenJob={() => {}} /> }
  // Remaining routes (job details, wallet, chat, admin, etc.) follow the
  // same pattern — add them here once protected-route wrapping is decided.
]);
