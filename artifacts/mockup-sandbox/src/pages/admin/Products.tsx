import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import type { Product } from "../../types";

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: "", description: "", price: "", stock: "0", imageUrl: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () =>
    api.get<Product[]>("/products").then(setProducts).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "", price: "", stock: "0", imageUrl: "" });
    setError("");
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({ name: p.name, description: p.description ?? "", price: p.price, stock: String(p.stock), imageUrl: p.imageUrl ?? "" });
    setError("");
    setShowForm(true);
  };

  const handleSave = async () => {
    setError("");
    if (!form.name || !form.price) { setError("Name and price are required"); return; }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        price: form.price,
        stock: parseInt(form.stock, 10),
        imageUrl: form.imageUrl || undefined,
      };
      if (editing) {
        await api.patch<Product>(`/products/${editing.id}`, payload);
      } else {
        await api.post<Product>("/products", payload);
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this product?")) return;
    await api.delete(`/products/${id}`);
    load();
  };

  const toggleActive = async (p: Product) => {
    await api.patch(`/products/${p.id}`, { isActive: !p.isActive });
    load();
  };

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-700">Products ({products.length})</h2>
        <button onClick={openCreate} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + Add Product
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <h3 className="text-lg font-semibold mb-4">{editing ? "Edit Product" : "Add Product"}</h3>
            <div className="space-y-3">
              {[
                { label: "Name *", key: "name", type: "text" },
                { label: "Price (৳) *", key: "price", type: "number" },
                { label: "Stock", key: "stock", type: "number" },
                { label: "Image URL", key: "imageUrl", type: "text" },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
                  <input
                    type={type}
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {products.map((p) => (
          <div key={p.id} className={`bg-white rounded-xl border ${p.isActive ? "border-gray-200" : "border-gray-100 opacity-60"} p-4`}>
            {p.imageUrl && (
              <img src={p.imageUrl} alt={p.name} className="w-full h-32 object-cover rounded-lg mb-3" />
            )}
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-gray-800">{p.name}</h3>
                {p.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{p.description}</p>}
              </div>
              <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {p.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="flex items-center justify-between mt-3">
              <div>
                <p className="text-lg font-bold text-purple-700">৳ {parseFloat(p.price).toLocaleString()}</p>
                <p className="text-xs text-gray-400">Stock: {p.stock}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggleActive(p)} className="text-xs px-2 py-1 border border-gray-200 rounded-lg hover:bg-gray-50">
                  {p.isActive ? "Disable" : "Enable"}
                </button>
                <button onClick={() => openEdit(p)} className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">Edit</button>
                <button onClick={() => handleDelete(p.id)} className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded-lg hover:bg-red-100">Del</button>
              </div>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <div className="col-span-3 text-center py-20 text-gray-400">No products yet</div>
        )}
      </div>
    </div>
  );
}
