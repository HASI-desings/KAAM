import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
interface ModalProps { open: boolean; onClose: () => void; children: ReactNode; title?: string; }
const spring = { type: "spring", stiffness: 300, damping: 30 } as const;
export function Modal({ open, onClose, children, title }: ModalProps) {
  return <AnimatePresence>{open && <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
    <motion.div className="flex max-h-[88dvh] w-full max-w-lg flex-col overflow-hidden rounded-xl2 bg-[var(--bg-elevated)] shadow-lg" style={{ boxShadow: "var(--shadow-soft)" }} initial={{ scale: .96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: .96, opacity: 0 }} transition={spring} onClick={(e) => e.stopPropagation()}>
      {title && <div className="shrink-0 border-b border-[var(--border)] px-5 py-4"><h2 className="text-lg font-semibold">{title}</h2></div>}
      <div className="min-h-0 overflow-y-auto px-5 py-4">{children}</div>
    </motion.div>
  </motion.div>}</AnimatePresence>;
}