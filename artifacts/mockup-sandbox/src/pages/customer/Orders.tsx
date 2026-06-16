import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import type { Order, Payment } from "../../types";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const METHOD_LABELS: Record<string, string> = {
  bkash: "🟣 bKash",
  nagad: "🟠 Nagad",
  rocket: "🔵 Rocket",
};

export default function CustomerOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [payForm, setPayForm] = useState<{ orderId: number | null; method: string; txnId: string; amount: string }>({
    orderId: null, method: "bkash", txnId: "", amount: "",
  });
  const [payError, setPayError] = useState("");
  const [payLoading, setPayLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState<number | null>(null);

  const load = () =>
    Promise.all([
      api.get<Order[]>("/orders"),
      api.get<Payment[]>("/payments"),
    ]).then(([o, p]) => {
      setOrders(o.sort((a, b) => b.id - a.id));
      setPayments(p);
    }).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const cancelOrder = async (id: number) => {
    if (!confirm("Cancel this order?")) return;
    setCancelLoading(id);
    try {
      await api.patch(`/orders/${id}`, { status: "cancelled" });
      load();
    } finally {
      setCancelLoading(null);
    }
  };

  const submitPayment = async () => {
    setPayError("");
    if (!payForm.txnId || !payForm.amount) { setPayError("Transaction ID and amount are required"); return; }
    setPayLoading(true);
    try {
      await api.post("/payments", {
        orderId: payForm.orderId,
        method: payForm.method,
        transactionId: payForm.txnId,
        amount: payForm.amount,
      });
      setPayForm({ orderId: null, method: "bkash", txnId: "", amount: "" });
      load();
    } catch (err) {
      setPayError(err instanceof Error ? err.message : "Failed to submit payment");
    } finally {
      setPayLoading(false);
    }
  };

  const getOrderPayment = (orderId: number) => payments.find((p) => p.orderId === orderId);

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;

  return (
    <div className="space-y-4">
      {payForm.orderId !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Submit Payment for Order #{payForm.orderId}</h3>
              <button onClick={() => setPayForm((f) => ({ ...f, orderId: null }))} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
              <p className="text-sm font-medium text-blue-800 mb-1">Payment Instructions</p>
              <p className="text-xs text-blue-600">Send payment to our number <strong>01858406619</strong> via your selected method, then enter the Transaction ID below.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {["bkash", "nagad", "rocket"].map((m) => (
                    <button
                      key={m}
                      onClick={() => setPayForm((f) => ({ ...f, method: m }))}
                      className={`py-2 rounded-lg text-sm font-medium border transition-colors capitalize ${
                        payForm.method === m
                          ? "bg-purple-600 text-white border-purple-600"
                          : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {METHOD_LABELS[m] ?? m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Transaction ID *</label>
                <input
                  value={payForm.txnId}
                  onChange={(e) => setPayForm((f) => ({ ...f, txnId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter your transaction ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Amount (৳) *</label>
                <input
                  type="number"
                  value={payForm.amount}
                  onChange={(e) => setPayForm((f) => ({ ...f, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Enter amount paid"
                />
              </div>
            </div>
            {payError && <p className="text-red-500 text-sm mt-3">{payError}</p>}
            <div className="flex gap-3 mt-5">
              <button onClick={() => setPayForm((f) => ({ ...f, orderId: null }))} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
              <button
                onClick={submitPayment}
                disabled={payLoading}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
              >
                {payLoading ? "Submitting..." : "Submit Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">🛒</p>
          <p>No orders yet. Go to Shop to place an order!</p>
        </div>
      ) : (
        orders.map((o) => {
          const payment = getOrderPayment(o.id);
          return (
            <div key={o.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">Order #{o.id}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[o.status] ?? "bg-gray-100"}`}>
                      {o.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleString()}</p>
                  {o.shippingAddress && <p className="text-xs text-gray-500 mt-1">📍 {o.shippingAddress}</p>}
                  {o.notes && <p className="text-xs text-gray-400 mt-0.5">📝 {o.notes}</p>}
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-purple-700">৳ {parseFloat(o.totalAmount).toLocaleString()}</p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between flex-wrap gap-2">
                {payment ? (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500">Payment:</span>
                    <span className="font-medium capitalize">{payment.method}</span>
                    <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{payment.transactionId}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      payment.status === "verified" ? "bg-green-100 text-green-700" :
                      payment.status === "rejected" ? "bg-red-100 text-red-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {payment.status}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-gray-400">No payment submitted</span>
                )}
                <div className="flex gap-2">
                  {!payment && o.status !== "cancelled" && (
                    <button
                      onClick={() => setPayForm({ orderId: o.id, method: "bkash", txnId: "", amount: o.totalAmount })}
                      className="text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 font-medium"
                    >
                      Pay Now
                    </button>
                  )}
                  {o.status === "pending" && (
                    <button
                      onClick={() => cancelOrder(o.id)}
                      disabled={cancelLoading === o.id}
                      className="text-xs px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 font-medium disabled:opacity-50"
                    >
                      {cancelLoading === o.id ? "Cancelling..." : "Cancel"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
