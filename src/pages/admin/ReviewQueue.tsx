import { PageTransition } from "@/components/ui/PageTransition";

// Design.md §4.13: function over form — no motion polish on this internal page by design.
const rows = [
  { id: "F001", from: "User A1F3", to: "User B29K", status: "pending" },
  { id: "F002", from: "User C5D2", to: "User D71M", status: "safe" },
  { id: "F003", from: "User E9Q1", to: "User F33T", status: "violation" }
];

export default function ReviewQueue() {
  return (
    <PageTransition>
      <div className="min-h-screen px-5 py-8">
        <h1 className="mb-4 text-lg font-bold">Admin Review Queue</h1>
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
              <th className="py-2">ID</th>
              <th>From</th>
              <th>To</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-[var(--border)]">
                <td className="py-2">{r.id}</td>
                <td>{r.from}</td>
                <td>{r.to}</td>
                <td className="capitalize">{r.status}</td>
                <td>
                  <select className="rounded border border-[var(--border)] bg-transparent px-1 py-0.5 text-xs">
                    <option>pending</option>
                    <option>violation</option>
                    <option>safe</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageTransition>
  );
}
