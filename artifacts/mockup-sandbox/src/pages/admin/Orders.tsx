import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import type { Order } from "../../types";

const STATUS_FLOW = ["pending", "processing", "shipped", "delivered", "cancelled"];
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  const load = () =>
    api.get<Order[]>("/orders").then((data) => setOrders(data.sort((a, b) => b.id - a.id))).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: number, status: string) => {
    setUpdating(id);
    try {
      await api.patch<Order>(`/orders/${id}`, { status });
      load();
    } finally {
      setUpdating(null);
    }
  };

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6">
        {["all", ...STATUS_FLOW].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
              filter === s ? "bg-purple-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {s} {s === "all" ? `(${orders.length})` : `(${orders.filter((o) => o.status === s).length})`}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Order</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Customer</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Amount</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((o) => (
              <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium">#{o.id}</td>
                <td className="px-4 py-3 text-gray-500">Customer #{o.customerId}</td>
                <td className="px-4 py-3 font-semibold">৳ {parseFloat(o.totalAmount).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[o.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {o.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400">{new Date(o.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <select
                    value={o.status}
                    disabled={updating === o.id || o.status === "delivered" || o.status === "cancelled"}
                    onChange={(e) => updateStatus(o.id, e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-40"
                  >
                    {STATUS_FLOW.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">No orders found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
