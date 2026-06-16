import { type ReactNode, useState } from "react";
import { useAuth } from "../context/AuthContext";

interface NavItem {
  id: string;
  label: string;
  icon: string;
}

interface LayoutProps {
  page: string;
  setPage: (page: string) => void;
  navItems: NavItem[];
  children: ReactNode;
  title: string;
  subtitle: string;
}

export default function Layout({ page, setPage, navItems, children, title, subtitle }: LayoutProps) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
  };

  const roleColors: Record<string, string> = {
    admin: "bg-red-100 text-red-700",
    reseller: "bg-blue-100 text-blue-700",
    customer: "bg-green-100 text-green-700",
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside
        className={`${sidebarOpen ? "w-64" : "w-16"} bg-slate-900 text-white flex flex-col transition-all duration-300 shrink-0`}
      >
        <div className="flex items-center gap-3 p-4 border-b border-slate-700">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center shrink-0">
            <span className="font-bold text-sm">A</span>
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="font-bold text-sm leading-tight truncate">AuraBaseBD</p>
              <p className="text-xs text-slate-400 truncate">{subtitle}</p>
            </div>
          )}
        </div>

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                page === item.id
                  ? "bg-purple-600 text-white"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              <span className="text-lg shrink-0">{item.icon}</span>
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-2 border-t border-slate-700">
          {sidebarOpen && (
            <div className="px-3 py-2 mb-2">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <span
                className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 ${roleColors[user?.role ?? "customer"]}`}
              >
                {user?.role}
              </span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-800 text-sm transition-colors"
          >
            <span>{sidebarOpen ? "◀" : "▶"}</span>
            {sidebarOpen && <span>Collapse</span>}
          </button>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-red-900/40 hover:text-red-300 text-sm transition-colors mt-1"
          >
            <span>🚪</span>
            {sidebarOpen && <span>{loggingOut ? "Signing out..." : "Sign Out"}</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>📞</span>
            <span>Support: 01858406619</span>
          </div>
        </div>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
