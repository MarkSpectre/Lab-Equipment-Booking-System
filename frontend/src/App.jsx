import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { Toaster } from "sonner";
import ProtectedRoute from "./components/ProtectedRoute";
import { Button } from "./components/ui/button";
import { clearAuth, getUser } from "./lib/auth";
import AdminLabInventoryPage from "./pages/AdminLabInventoryPage";
import AdminLabsPage from "./pages/AdminLabsPage";
import LabInventoryPage from "./pages/LabInventoryPage";
import LabsPage from "./pages/LabsPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import StockAuditPage from "./pages/StockAuditPage";
import StudentDashboardPage from "./pages/StudentDashboardPage";

const THEME_KEY = "lab-ui-theme";

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || "light");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  return (
    <BrowserRouter>
      <div className="mx-auto min-h-screen max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <TopBar theme={theme} setTheme={setTheme} />

        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/admin" element={<Navigate to="/admin/labs" replace />} />
          <Route path="/dashboard" element={<Navigate to="/labs" replace />} />

          <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
            <Route path="/requests" element={<StudentDashboardPage />} />
            <Route path="/labs" element={<LabsPage />} />
            <Route path="/labs/:labId" element={<LabInventoryPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/admin/labs" element={<AdminLabsPage />} />
            <Route path="/admin/labs/:labId" element={<AdminLabInventoryPage />} />
            <Route path="/admin/stock-audit" element={<StockAuditPage />} />
          </Route>

          <Route path="/" element={<HomeRedirect />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>

        <Toaster richColors position="top-right" />
      </div>
    </BrowserRouter>
  );
}

function TopBar({ theme, setTheme }) {
  const user = getUser();
  const normalizedRole = String(user?.role || "").toUpperCase();
  const navigate = useNavigate();
  const location = useLocation();
  const themeLabel = useMemo(() => (theme === "dark" ? "Switch to light" : "Switch to dark"), [theme]);

  function logout() {
    clearAuth();
    navigate("/login");
  }

  const hideShell = ["/login", "/signup"].includes(location.pathname);

  if (hideShell) {
    return (
      <header className="mb-8 flex items-center justify-end rounded-2xl border border-border/70 bg-card/70 px-5 py-4 backdrop-blur-sm">
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
          aria-label={themeLabel}
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          <span className="hidden sm:inline">{themeLabel}</span>
        </Button>
      </header>
    );
  }

  return (
    <header className="mb-8 flex flex-col gap-4 rounded-2xl border border-border/70 bg-card/70 px-5 py-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-xl font-semibold sm:text-2xl">Lab Equipment Borrowing System</h1>
        <p className="text-sm text-muted-foreground">{user?.name} ({user?.role})</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {normalizedRole === "STUDENT" ? (
          <>
            <NavLink to="/labs" label="Labs" current={location.pathname} />
            <NavLink to="/requests" label="My Requests" current={location.pathname} />
          </>
        ) : null}

        {normalizedRole === "ADMIN" ? (
          <>
            <NavLink to="/admin/labs" label="Admin Labs" current={location.pathname} />
            <NavLink to="/admin/stock-audit" label="Stock Audit" current={location.pathname} />
          </>
        ) : null}

        <Button
          variant="outline"
          className="gap-2"
          onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
          aria-label={themeLabel}
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </Button>

        <Button variant="ghost" onClick={logout}>
          Logout
        </Button>
      </div>
    </header>
  );
}

function NavLink({ to, label, current }) {
  const active = current === to || current.startsWith(`${to}/`);
  return (
    <Link
      className={`rounded-xl px-3 py-2 text-sm ${active ? "bg-primary text-primary-foreground" : "border border-border hover:bg-muted"}`}
      to={to}
    >
      {label}
    </Link>
  );
}

function HomeRedirect() {
  const user = getUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const role = String(user.role || "").toLowerCase();

  if (role === "admin") {
    return <Navigate to="/admin/labs" replace />;
  }

  return <Navigate to="/labs" replace />;
}

function NotFoundPage() {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/70 p-8 text-center">
      <h2 className="text-2xl font-semibold">404</h2>
      <p className="mt-2 text-sm text-muted-foreground">This page does not exist. Use the navigation to continue.</p>
      <Link to="/" className="mt-4 inline-block rounded-xl border border-border px-4 py-2 text-sm hover:bg-muted">
        Back to Home
      </Link>
    </div>
  );
}

export default App;
