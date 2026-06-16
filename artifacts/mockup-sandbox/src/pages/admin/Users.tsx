import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import type { User } from "../../types";

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "customer", phone: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () =>
    api.get<User[]>("/users").then(setUsers).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    setError("");
    if (!form.name || !form.email || !form.password) { setError("Name, email, and password are required"); return; }
    setSaving(true);
    try {
      await api.post<User>("/users", form);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (u: User) => {
    await api.patch(`/users/${u.id}`, { isActive: !u.isActive });
    load();
  };

  const deleteUser = async (id: number) => {
    if (!confirm("Delete this user?")) return;
    await api.delete(`/users/${id}`);
    load();
  };

  const filtered = filter === "all" ? users : users.filter((u) => u.role === filter);
  const roleColors: Record<string, string> = {
    admin: "bg-red-100 text-red-700",
    reseller: "bg-blue-100 text-blue-700",
    customer: "bg-green-100 text-green-700",
  };

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2 flex-wrap">
          {["all", "admin", "reseller", "customer"].map((r) => (
            <button
              key={r}
              onClick={() => setFilter(r)}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium capitalize transition-colors ${
                filter === r ? "bg-purple-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {r} ({r === "all" ? users.length : users.filter((u) => u.role === r).length})
            </button>
          ))}
        </div>
        <button onClick={() => { setShowForm(true); setError(""); }} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + Add User
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-semibold mb-4">Create User</h3>
            <div className="space-y-3">
              {[
                { label: "Full Name *", key: "name", type: "text" },
                { label: "Email *", key: "email", type: "email" },
                { label: "Password *", key: "password", type: "password" },
                { label: "Phone", key: "phone", type: "tel" },
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
                <label className="block text-sm font-medium text-gray-600 mb-1">Role *</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="customer">Customer</option>
                  <option value="reseller">Reseller</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={handleCreate} disabled={saving} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
                {saving ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">User</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Role</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Phone</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Joined</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium">{u.name}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${roleColors[u.role] ?? "bg-gray-100 text-gray-600"}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{u.phone ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${u.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {u.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => toggleActive(u)} className="text-xs px-2 py-1 border border-gray-200 rounded-lg hover:bg-gray-50">
                    {u.isActive ? "Disable" : "Enable"}
                  </button>
                  <button onClick={() => deleteUser(u.id)} className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded-lg hover:bg-red-100">Del</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">No users found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
