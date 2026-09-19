import { motion, AnimatePresence } from "framer-motion";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner } from "./Spinner";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "destructive";
  loading?: boolean;
  children: ReactNode;
}

export function Button({ variant = "primary", disabled, loading, children, className = "", ...props }: ButtonProps) {
  const base = "relative px-5 py-3 rounded-xl2 font-semibold text-[15px] transition-colors";
  const styles = {
    primary: "bg-teal text-white",
    secondary: "bg-transparent border border-teal text-teal",
    destructive: "bg-danger text-white"
  }[variant];
  const spinnerColor = variant === "secondary" ? "border-teal/30 border-t-teal" : "border-white/30 border-t-white";
  const isBlocked = disabled || loading;

  return (
    <motion.button
      whileTap={isBlocked ? undefined : { scale: 0.97 }}
      transition={{ type: "tween", duration: 0.1, ease: "easeOut" }}
      disabled={isBlocked}
      className={`${base} ${styles} ${disabled && !loading ? "opacity-40" : ""} ${isBlocked ? "pointer-events-none" : ""} ${className}`}
      {...(props as any)}
    >
      <AnimatePresence mode="wait" initial={false}>
        {loading ? (
          <motion.span
            key="spinner"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.15 }}
            className="flex items-center justify-center"
          >
            <Spinner size={16} className={spinnerColor} />
          </motion.span>
        ) : (
          <motion.span key="label" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
