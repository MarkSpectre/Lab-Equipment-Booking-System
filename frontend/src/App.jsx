import { useEffect, useState } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import { getUser } from "./lib/auth";
import AdminLabInventoryPage from "./pages/AdminLabInventoryPage";
import AdminLabsPage from "./pages/AdminLabsPage";
import LabInventoryPage from "./pages/LabInventoryPage";
import LabsPage from "./pages/LabsPage";
import LoginPage from "./pages/LoginPage";
import NotificationSettingsPage from "./pages/NotificationSettingsPage";
import SignupPage from "./pages/SignupPage";
import StockAuditPage from "./pages/StockAuditPage";
import StudentDashboardPage from "./pages/StudentDashboardPage";

const THEME_KEY = "lab-ui-theme";

function App() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem(THEME_KEY) || "dark"
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  return (
    <BrowserRouter>
      {/* Layout wraps ALL routes — Navbar is always rendered */}
      <Layout theme={theme} setTheme={setTheme}>
        <Routes>
          {/* ── Public auth routes ──────────────────────────── */}
          <Route path="/login"  element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* ── Convenience redirects ───────────────────────── */}
          <Route path="/admin"     element={<Navigate to="/admin/labs" replace />} />
          <Route path="/dashboard" element={<Navigate to="/labs" replace />} />

          {/* ── Student-only routes ─────────────────────────── */}
          <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
            <Route path="/requests"                  element={<StudentDashboardPage />} />
            <Route path="/labs"                      element={<LabsPage />} />
            <Route path="/labs/:labId"               element={<LabInventoryPage />} />
            <Route path="/settings/notifications"    element={<NotificationSettingsPage />} />
          </Route>

          {/* ── Admin-only routes ───────────────────────────── */}
          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/admin/labs"          element={<AdminLabsPage />} />
            <Route path="/admin/labs/:labId"   element={<AdminLabInventoryPage />} />
            <Route path="/admin/stock-audit"   element={<StockAuditPage />} />
          </Route>

          {/* ── Root redirect ───────────────────────────────── */}
          <Route path="/"  element={<HomeRedirect />} />
          <Route path="*"  element={<NotFoundPage />} />
        </Routes>
      </Layout>

      <Toaster richColors position="top-right" />
    </BrowserRouter>
  );
}

/** Redirects to the correct dashboard based on role after a hard navigation to "/" */
function HomeRedirect() {
  const user = getUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = String(user.role || "").toUpperCase();

  if (role === "ADMIN") {
    return <Navigate to="/admin/labs" replace />;
  }

  return <Navigate to="/labs" replace />;
}

function NotFoundPage() {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/70 p-8 text-center">
      <h2 className="text-2xl font-semibold">404</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        This page does not exist. Use the navigation to continue.
      </p>
      <Link
        to="/"
        className="mt-4 inline-block rounded-xl border border-border px-4 py-2 text-sm hover:bg-muted"
      >
        Back to Home
      </Link>
    </div>
  );
}

export default App;
