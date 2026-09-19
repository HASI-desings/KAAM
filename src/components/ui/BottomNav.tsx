import { useRef, useState } from "react";
import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { Home, Wallet as WalletIcon, MessageCircle, User, ShieldCheck, Menu } from "lucide-react";

export type NavKey = "feed" | "wallet" | "chat" | "profile" | "admin";

interface BottomNavProps {
  active: NavKey;
  onNavigate: (key: NavKey) => void;
  isAdmin: boolean;
}

const EXPAND_SCROLL_THRESHOLD = 60;

const containerVariants = {
  expanded: { transition: { type: "spring", damping: 20, stiffness: 300, staggerChildren: 0.06, delayChildren: 0.1 } },
  collapsed: { transition: { type: "spring", damping: 20, stiffness: 300, when: "afterChildren", staggerChildren: 0.04, staggerDirection: -1 } }
};

const itemVariants = {
  expanded: { opacity: 1, scale: 1, width: "auto", transition: { type: "spring", damping: 16 } },
  collapsed: { opacity: 0, scale: 0.8, width: 0, transition: { duration: 0.15 } }
};

const baseItems: { key: NavKey; label: string; icon: typeof Home }[] = [
  { key: "feed", label: "Feed", icon: Home },
  { key: "wallet", label: "Wallet", icon: WalletIcon },
  { key: "chat", label: "Chat", icon: MessageCircle },
  { key: "profile", label: "Profile", icon: User }
];

export function BottomNav({ active, onNavigate, isAdmin }: BottomNavProps) {
  const [expanded, setExpanded] = useState(true);
  const { scrollY } = useScroll();
  const lastY = useRef(0);
  const collapsedAt = useRef(0);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const prev = lastY.current;
    if (expanded && latest > prev && latest > 80) {
      setExpanded(false);
      collapsedAt.current = latest;
    } else if (!expanded && latest < prev && collapsedAt.current - latest > EXPAND_SCROLL_THRESHOLD) {
      setExpanded(true);
    }
    lastY.current = latest;
  });

  const items = isAdmin ? [...baseItems, { key: "admin" as NavKey, label: "Admin", icon: ShieldCheck }] : baseItems;

  return (
    <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2">
      <motion.nav
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1, width: expanded ? "auto" : "3.25rem" }}
        variants={containerVariants}
        onClick={() => !expanded && setExpanded(true)}
        className={`flex h-14 items-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--bg-elevated)]/90 px-2 backdrop-blur-md ${
          !expanded ? "cursor-pointer justify-center" : "gap-1"
        }`}
        style={{ boxShadow: "var(--shadow-soft)" }}
      >
        <AnimatePresence initial={false} mode="wait">
          {expanded ? (
            <motion.div key="expanded" className="flex items-center gap-1" initial="collapsed" animate="expanded" exit="collapsed" variants={containerVariants}>
              {items.map(({ key, label, icon: Icon }) => {
                const isActive = active === key;
                return (
                  <motion.button
                    key={key}
                    variants={itemVariants}
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate(key);
                    }}
                    className="relative flex flex-col items-center justify-center gap-0.5 rounded-full px-3 py-1.5"
                  >
                    {isActive && (
                      <motion.div layoutId="nav-pill" className="absolute inset-0 rounded-full bg-teal/10" transition={{ type: "spring", stiffness: 350, damping: 30 }} />
                    )}
                    <Icon size={18} className={`relative z-10 ${isActive ? "text-teal" : "text-[var(--text-secondary)]"}`} />
                    <span className={`relative z-10 text-[9px] font-medium ${isActive ? "text-teal" : "text-[var(--text-secondary)]"}`}>{label}</span>
                  </motion.button>
                );
              })}
            </motion.div>
          ) : (
            <motion.div key="collapsed" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
              <Menu size={20} className="text-teal" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </div>
  );
}
