import { motion } from "framer-motion";
export function Spinner({size=18,className="border-white/30 border-t-white"}:{size?:number;className?:string}){return <motion.span style={{width:size,height:size}} className={`inline-block rounded-full border-2 ${className}`} animate={{rotate:360}} transition={{repeat:Infinity,ease:"linear",duration:0.7}}/>}
