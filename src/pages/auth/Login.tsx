import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { PageTransition } from "@/components/ui/PageTransition";

// Design.md §4.1: centered card, staggered field entrance (50ms delay each),
// OTP boxes auto-advance, gentle shake spring on wrong code.
const fieldVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, type: "spring", stiffness: 300, damping: 24 } })
};

export default function Login() {
  const [mode, setMode] = useState<"credentials" | "otp">("credentials");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState(false);

  function handleOtpChange(i: number, val: string) {
    if (!/^[0-9]?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) {
      const nextInput = document.getElementById(`otp-${i + 1}`);
      nextInput?.focus();
    }
  }

  function submitOtp() {
    // Real verification happens against Supabase Auth in Phase 1.
    // Placeholder: any incomplete code "fails" to demonstrate the shake state.
    if (otp.some((d) => d === "")) {
      setOtpError(true);
      setTimeout(() => setOtpError(false), 500);
    }
  }

  return (
    <PageTransition>
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <motion.h1
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-2xl font-bold tracking-tight text-teal"
        >
          SkillX
        </motion.h1>

        <div className="w-full max-w-sm rounded-xl2 border border-[var(--border)] bg-[var(--bg-elevated)] p-6" style={{ boxShadow: "var(--shadow-soft)" }}>
          {mode === "credentials" ? (
            <div className="space-y-4">
              {["Full name", "Email", "Mobile number"].map((label, i) => (
                <motion.div key={label} custom={i} initial="hidden" animate="visible" variants={fieldVariants}>
                  <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">{label}</label>
                  <input
                    type="text"
                    className="w-full rounded-xl2 border border-[var(--border)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-teal"
                  />
                </motion.div>
              ))}
              <Button className="w-full" onClick={() => setMode("otp")}>
                Sign Up
              </Button>
              <p className="text-center text-xs text-[var(--text-secondary)]">Already have an account? Log in</p>
            </div>
          ) : (
            <div className="space-y-5">
              <p className="text-sm text-[var(--text-secondary)]">Enter the 6-digit code sent to your mobile.</p>
              <motion.div
                animate={otpError ? { x: [0, -8, 8, -6, 6, 0] } : { x: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 12 }}
                className="flex justify-between gap-2"
              >
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    maxLength={1}
                    className={`h-12 w-11 rounded-xl2 border text-center text-lg font-semibold outline-none ${
                      otpError ? "border-danger" : "border-[var(--border)] focus:border-teal"
                    }`}
                  />
                ))}
              </motion.div>
              <Button className="w-full" onClick={submitOtp}>
                Verify
              </Button>
              <button className="w-full text-center text-xs text-teal underline underline-offset-2">
                Resend code (30s)
              </button>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
