import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/Products";
import AdminOrders from "./pages/admin/Orders";
import AdminUsers from "./pages/admin/Users";
import AdminPayments from "./pages/admin/Payments";
import ResellerDashboard from "./pages/reseller/Dashboard";
import ResellerOrders from "./pages/reseller/Orders";
import CustomerStorefront from "./pages/customer/Storefront";
import CustomerOrders from "./pages/customer/Orders";
import { useState } from "react";

const ADMIN_NAV = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "products", label: "Products", icon: "📦" },
  { id: "orders", label: "Orders", icon: "🛒" },
  { id: "users", label: "Users", icon: "👥" },
  { id: "payments", label: "Payments", icon: "💳" },
];

const RESELLER_NAV = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "orders", label: "My Orders", icon: "🛒" },
];

const CUSTOMER_NAV = [
  { id: "shop", label: "Shop", icon: "🛍️" },
  { id: "orders", label: "My Orders", icon: "📋" },
];

function PageTitle(page: string, role: string): string {
  const titles: Record<string, string> = {
    dashboard: "Dashboard",
    products: "Product Management",
    orders: role === "customer" ? "My Orders" : "Orders",
    users: "User Management",
    payments: "Payment Management",
    shop: "Shop",
  };
  return titles[page] ?? page;
}

function AdminApp() {
  const [page, setPage] = useState("dashboard");
  return (
    <Layout
      page={page}
      setPage={setPage}
      navItems={ADMIN_NAV}
      title={PageTitle(page, "admin")}
      subtitle="Admin Panel"
    >
      {page === "dashboard" && <AdminDashboard />}
      {page === "products" && <AdminProducts />}
      {page === "orders" && <AdminOrders />}
      {page === "users" && <AdminUsers />}
      {page === "payments" && <AdminPayments />}
    </Layout>
  );
}

function ResellerApp() {
  const [page, setPage] = useState("dashboard");
  return (
    <Layout
      page={page}
      setPage={setPage}
      navItems={RESELLER_NAV}
      title={PageTitle(page, "reseller")}
      subtitle="Reseller Panel"
    >
      {page === "dashboard" && <ResellerDashboard />}
      {page === "orders" && <ResellerOrders />}
    </Layout>
  );
}

function CustomerApp() {
  const [page, setPage] = useState("shop");
  return (
    <Layout
      page={page}
      setPage={setPage}
      navItems={CUSTOMER_NAV}
      title={PageTitle(page, "customer")}
      subtitle="Customer Store"
    >
      {page === "shop" && <CustomerStorefront />}
      {page === "orders" && <CustomerOrders />}
    </Layout>
  );
}

function AppRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-xl font-bold text-white">A</span>
          </div>
          <p className="text-purple-300 text-sm">Loading AuraBaseBD...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Login />;
  if (user.role === "admin") return <AdminApp />;
  if (user.role === "reseller") return <ResellerApp />;
  return <CustomerApp />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
