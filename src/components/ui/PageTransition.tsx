import { motion } from "framer-motion";
import type { ReactNode } from "react";
export function PageTransition({children}:{children:ReactNode}){return <motion.div initial={{x:24,opacity:0}} animate={{x:0,opacity:1}} exit={{x:-24,opacity:0}} transition={{type:"spring",stiffness:260,damping:26}}>{children}</motion.div>}
