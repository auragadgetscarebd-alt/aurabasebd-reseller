import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import type { Product } from "../../types";

interface CartItem {
  product: Product;
  quantity: number;
}

export default function CustomerStorefront() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [orderForm, setOrderForm] = useState({ address: "", notes: "" });
  const [orderStatus, setOrderStatus] = useState<"idle" | "placing" | "success" | "error">("idle");
  const [orderError, setOrderError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get<Product[]>("/products")
      .then((data) => setProducts(data.filter((p) => p.isActive)))
      .finally(() => setLoading(false));
  }, []);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id);
      if (existing) {
        return prev.map((c) =>
          c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.product.id === id ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0),
    );
  };

  const total = cart.reduce((s, c) => s + parseFloat(c.product.price) * c.quantity, 0);
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);

  const placeOrder = async () => {
    setOrderStatus("placing");
    setOrderError("");
    try {
      await api.post("/orders", {
        shippingAddress: orderForm.address || undefined,
        notes: orderForm.notes || undefined,
        items: cart.map((c) => ({ productId: c.product.id, quantity: c.quantity })),
      });
      setCart([]);
      setShowCart(false);
      setOrderStatus("success");
      setTimeout(() => setOrderStatus("idle"), 4000);
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : "Failed to place order");
      setOrderStatus("error");
    }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) return <div className="text-center py-20 text-gray-400">Loading products...</div>;

  return (
    <div>
      {orderStatus === "success" && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 flex items-center gap-2">
          <span>✅</span>
          <span>Order placed successfully! Check your orders for status.</span>
        </div>
      )}

      <div className="flex items-center gap-4 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..."
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button
          onClick={() => setShowCart(true)}
          className="relative bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
        >
          🛒 Cart
          {cartCount > 0 && (
            <span className="bg-white text-purple-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {showCart && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Your Cart</h3>
              <button onClick={() => setShowCart(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            {cart.length === 0 ? (
              <p className="text-center py-8 text-gray-400">Your cart is empty</p>
            ) : (
              <>
                <div className="space-y-3 mb-4">
                  {cart.map((c) => (
                    <div key={c.product.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{c.product.name}</p>
                        <p className="text-xs text-gray-400">৳ {parseFloat(c.product.price).toLocaleString()} each</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(c.product.id, -1)} className="w-7 h-7 rounded-lg bg-gray-200 hover:bg-gray-300 text-sm font-bold">−</button>
                        <span className="w-6 text-center text-sm font-medium">{c.quantity}</span>
                        <button onClick={() => updateQty(c.product.id, 1)} className="w-7 h-7 rounded-lg bg-gray-200 hover:bg-gray-300 text-sm font-bold">+</button>
                      </div>
                      <span className="text-sm font-semibold text-purple-700 w-20 text-right">
                        ৳ {(parseFloat(c.product.price) * c.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-3 mb-4">
                  <div className="flex justify-between text-base font-bold">
                    <span>Total</span>
                    <span className="text-purple-700">৳ {total.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Shipping Address</label>
                    <input
                      value={orderForm.address}
                      onChange={(e) => setOrderForm((f) => ({ ...f, address: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Your delivery address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Notes</label>
                    <textarea
                      value={orderForm.notes}
                      onChange={(e) => setOrderForm((f) => ({ ...f, notes: e.target.value }))}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Any special instructions?"
                    />
                  </div>
                </div>

                {orderError && <p className="text-red-500 text-sm mb-3">{orderError}</p>}

                <button
                  onClick={placeOrder}
                  disabled={orderStatus === "placing"}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  {orderStatus === "placing" ? "Placing Order..." : "Place Order"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No products found</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all overflow-hidden">
              {p.imageUrl ? (
                <img src={p.imageUrl} alt={p.name} className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-40 bg-gradient-to-br from-purple-50 to-slate-100 flex items-center justify-center">
                  <span className="text-5xl">📦</span>
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 mb-1">{p.name}</h3>
                {p.description && (
                  <p className="text-xs text-gray-400 mb-3 line-clamp-2">{p.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-purple-700">৳ {parseFloat(p.price).toLocaleString()}</p>
                    <p className="text-xs text-gray-400">In stock: {p.stock}</p>
                  </div>
                  <button
                    onClick={() => addToCart(p)}
                    disabled={p.stock === 0}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  >
                    {p.stock === 0 ? "Out of Stock" : "Add to Cart"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
