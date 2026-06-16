import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import type { Order } from "../../types";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function ResellerOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = () =>
    api.get<Order[]>("/orders").then((data) => setOrders(data.sort((a, b) => b.id - a.id))).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;

  return (
    <div>
      <div className="flex gap-2 flex-wrap mb-6">
        {["all", "pending", "processing", "shipped", "delivered", "cancelled"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium capitalize transition-colors ${
              filter === s ? "bg-purple-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {s} ({s === "all" ? orders.length : orders.filter((o) => o.status === s).length})
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
              <th className="px-4 py-3 text-left font-medium text-gray-500">Address</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((o) => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">#{o.id}</td>
                <td className="px-4 py-3 text-gray-500">Customer #{o.customerId}</td>
                <td className="px-4 py-3 font-semibold">৳ {parseFloat(o.totalAmount).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[o.status] ?? "bg-gray-100"}`}>
                    {o.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{o.shippingAddress ?? "—"}</td>
                <td className="px-4 py-3 text-gray-400">{new Date(o.createdAt).toLocaleDateString()}</td>
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
