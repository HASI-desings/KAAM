import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
interface ModalProps{open:boolean;onClose:()=>void;children:ReactNode;title?:string;}
const spring={type:"spring",stiffness:300,damping:30} as const;
export function Modal({open,onClose,children,title}:ModalProps){return <AnimatePresence>{open&&<motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}><motion.div className="w-full max-w-sm rounded-xl2 bg-[var(--bg-elevated)] p-6 shadow-lg" style={{boxShadow:"var(--shadow-soft)"}} initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.95,opacity:0}} transition={spring} onClick={e=>e.stopPropagation()}>{title&&<h2 className="text-lg font-semibold mb-3">{title}</h2>}{children}</motion.div></motion.div>}</AnimatePresence>}
