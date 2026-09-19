// Marks screens that are still running on hardcoded demo data, not your
// live Supabase tables — so it's visibly obvious, not silently misleading.
export function DemoBadge() {
  return (
    <div className="sticky top-0 z-10 bg-amber/15 px-4 py-1.5 text-center text-[10px] font-medium text-amber">
      Demo screen — not yet connected to Supabase
    </div>
  );
}
