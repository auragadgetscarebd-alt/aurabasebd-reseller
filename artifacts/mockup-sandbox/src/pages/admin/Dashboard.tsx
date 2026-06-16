import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import type { User, Product, Order, Payment } from "../../types";

interface Stats {
  users: number;
  products: number;
  orders: number;
  pending: number;
  revenue: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    users: 0,
    products: 0,
    orders: 0,
    pending: 0,
    revenue: "0",
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<User[]>("/users"),
      api.get<Product[]>("/products"),
      api.get<Order[]>("/orders"),
      api.get<Payment[]>("/payments"),
    ])
      .then(([users, products, orders, payments]) => {
        const verified = payments.filter((p) => p.status === "verified");
        const revenue = verified.reduce((sum, p) => sum + parseFloat(p.amount), 0);
        setStats({
          users: users.length,
          products: products.length,
          orders: orders.length,
          pending: payments.filter((p) => p.status === "pending").length,
          revenue: revenue.toFixed(2),
        });
        setRecentOrders(orders.slice(-5).reverse());
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    processing: "bg-blue-100 text-blue-700",
    shipped: "bg-purple-100 text-purple-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: stats.users, icon: "👥", color: "bg-blue-50 text-blue-600 border-blue-200" },
          { label: "Products", value: stats.products, icon: "📦", color: "bg-purple-50 text-purple-600 border-purple-200" },
          { label: "Total Orders", value: stats.orders, icon: "🛒", color: "bg-orange-50 text-orange-600 border-orange-200" },
          { label: "Pending Payments", value: stats.pending, icon: "⏳", color: "bg-red-50 text-red-600 border-red-200" },
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
          <h3 className="font-semibold text-gray-700">Total Verified Revenue</h3>
        </div>
        <p className="text-4xl font-bold text-green-600">৳ {parseFloat(stats.revenue).toLocaleString()}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-700">Recent Orders</h3>
        </div>
        {recentOrders.length === 0 ? (
          <p className="text-center py-10 text-gray-400">No orders yet</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentOrders.map((order) => (
              <div key={order.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Order #{order.id}</p>
                  <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-sm">৳ {parseFloat(order.totalAmount).toLocaleString()}</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[order.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {order.status}
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
