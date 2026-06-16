import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import type { Payment } from "../../types";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  verified: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

const METHOD_ICONS: Record<string, string> = {
  bkash: "🟣",
  nagad: "🟠",
  rocket: "🔵",
};

export default function AdminPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [activeId, setActiveId] = useState<number | null>(null);

  const load = () =>
    api.get<Payment[]>("/payments").then((data) => setPayments(data.sort((a, b) => b.id - a.id))).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const verify = async (id: number, status: "verified" | "rejected") => {
    setUpdating(id);
    try {
      await api.patch(`/payments/${id}`, { status, notes: notes || undefined });
      setActiveId(null);
      setNotes("");
      load();
    } finally {
      setUpdating(null);
    }
  };

  const filtered = filter === "all" ? payments : payments.filter((p) => p.status === filter);

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;

  return (
    <div>
      <div className="flex gap-2 flex-wrap mb-6">
        {["all", "pending", "verified", "rejected"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium capitalize transition-colors ${
              filter === s ? "bg-purple-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {s} ({s === "all" ? payments.length : payments.filter((p) => p.status === s).length})
          </button>
        ))}
      </div>

      {activeId !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-semibold mb-3">Review Payment #{activeId}</h3>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Add notes..."
              />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setActiveId(null); setNotes(""); }} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
              <button
                onClick={() => verify(activeId, "rejected")}
                disabled={updating === activeId}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50"
              >
                Reject
              </button>
              <button
                onClick={() => verify(activeId, "verified")}
                disabled={updating === activeId}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50"
              >
                Verify
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">#</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Order</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Method</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Txn ID</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Amount</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{p.id}</td>
                <td className="px-4 py-3">#{p.orderId}</td>
                <td className="px-4 py-3 capitalize">{METHOD_ICONS[p.method] ?? "💳"} {p.method}</td>
                <td className="px-4 py-3 font-mono text-xs bg-gray-50 rounded">{p.transactionId}</td>
                <td className="px-4 py-3 font-semibold">৳ {parseFloat(p.amount).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[p.status] ?? "bg-gray-100"}`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  {p.status === "pending" && (
                    <button
                      onClick={() => setActiveId(p.id)}
                      className="text-xs px-3 py-1 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 font-medium"
                    >
                      Review
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">No payments found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
