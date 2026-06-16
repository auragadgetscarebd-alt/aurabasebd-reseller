import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import type { Order, Payment } from "../../types";

export default function ResellerDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Order[]>("/orders"),
      api.get<Payment[]>("/payments"),
    ]).then(([o, p]) => {
      setOrders(o);
      setPayments(p);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;

  const totalRevenue = payments
    .filter((p) => p.status === "verified")
    .reduce((s, p) => s + parseFloat(p.amount), 0);

  const STATUS_COLORS: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    processing: "bg-blue-100 text-blue-700",
    shipped: "bg-purple-100 text-purple-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "My Orders", value: orders.length, icon: "🛒", color: "bg-blue-50 text-blue-600 border-blue-200" },
          { label: "Active Orders", value: orders.filter((o) => !["delivered", "cancelled"].includes(o.status)).length, icon: "📋", color: "bg-purple-50 text-purple-600 border-purple-200" },
          { label: "Pending Payments", value: payments.filter((p) => p.status === "pending").length, icon: "⏳", color: "bg-orange-50 text-orange-600 border-orange-200" },
          { label: "Verified Payments", value: payments.filter((p) => p.status === "verified").length, icon: "✅", color: "bg-green-50 text-green-600 border-green-200" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-75">{s.label}</p>
                <p className="text-3xl font-bold mt-1">{s.value}</p>
              </div>
              <span className="text-3xl">{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">💰</span>
          <h3 className="font-semibold text-gray-700">Verified Revenue</h3>
        </div>
        <p className="text-4xl font-bold text-green-600">৳ {totalRevenue.toLocaleString()}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-700">Recent Orders</h3>
        </div>
        {orders.length === 0 ? (
          <p className="text-center py-10 text-gray-400">No orders yet</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {orders.slice(0, 8).map((o) => (
              <div key={o.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Order #{o.id}</p>
                  <p className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-sm">৳ {parseFloat(o.totalAmount).toLocaleString()}</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[o.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {o.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
