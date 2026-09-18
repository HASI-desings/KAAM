import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";

const AVERAGE_PRICE = 9200; // Demo constant — real value comes from check-average-rate Edge Function.

export function OfferSubmission({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [price, setPrice] = useState("");
  const numeric = Number(price) || 0;
  const belowFloor = numeric > 0 && numeric < AVERAGE_PRICE;

  return (
    <BottomSheet open={open} onClose={onClose}>
      <h2 className="mb-4 text-lg font-semibold">Offer Submission</h2>

      <label className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Your price (PKR)</label>
      <motion.input
        value={price}
        onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ""))}
        placeholder="9,500"
        inputMode="numeric"
        animate={{ borderColor: belowFloor ? "#D98C3F" : "#E3E3DF" }}
        transition={{ duration: 0.3 }}
        className="w-full rounded-xl2 border bg-transparent px-3 py-2.5 text-sm outline-none focus:border-teal"
      />
      <p className="mt-1.5 text-[11px] text-amber">Suggested average: Rs {AVERAGE_PRICE.toLocaleString()}</p>

      <AnimatePresence>
        {belowFloor && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 text-xs text-warning"
          >
            Your price is below the category average and may need re-confirmation from the client.
          </motion.p>
        )}
      </AnimatePresence>

      <Button className="mt-5 w-full" disabled={numeric === 0} onClick={onClose}>
        Send Offer
      </Button>
    </BottomSheet>
  );
}
