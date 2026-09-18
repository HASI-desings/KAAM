import { motion } from "framer-motion";
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "destructive";
  children: ReactNode;
}

// Design.md §5: press feedback scale(0.97) over 100ms ease-out, disabled = 40% opacity, no press feedback.
export function Button({ variant = "primary", disabled, children, className = "", ...props }: ButtonProps) {
  const base = "px-5 py-3 rounded-xl2 font-semibold text-[15px] transition-colors";
  const styles = {
    primary: "bg-teal text-white",
    secondary: "bg-transparent border border-teal text-teal",
    destructive: "bg-danger text-white"
  }[variant];

  return (
    <motion.button
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ type: "tween", duration: 0.1, ease: "easeOut" }}
      disabled={disabled}
      className={`${base} ${styles} ${disabled ? "opacity-40 pointer-events-none" : ""} ${className}`}
      {...(props as any)}
    >
      {children}
    </motion.button>
  );
}
