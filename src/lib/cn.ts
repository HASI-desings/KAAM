// Small className-join helper. Not pulling in shadcn/radix for this — this
// project is Vite + plain Tailwind, not a Next.js/shadcn setup, and the only
// thing we actually need from that reference component is the motion
// pattern, which framer-motion + lucide-react (already installed) cover.
export function cn(...inputs: Array<string | false | null | undefined>) {
  return inputs.filter(Boolean).join(" ");
}
