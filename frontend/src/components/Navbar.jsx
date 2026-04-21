import { Beaker, Moon, Sun, LogOut } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { clearAuth, getUser } from "../lib/auth";

/**
 * Glassmorphism Navbar — visible on every route.
 *
 * • Always shows the Beaker logo + "CRCE Lab Manager" brand on the left.
 * • On auth pages (/login, /signup) only the brand + theme toggle are rendered.
 * • Authenticated pages additionally show role-specific nav links + logout.
 */
function Navbar({ theme, setTheme }) {
  const navigate  = useNavigate();
  const location  = useLocation();
  const user      = getUser();
  const role      = String(user?.role || "").toUpperCase();
  const themeLabel = useMemo(
    () => (theme === "dark" ? "Switch to light" : "Switch to dark"),
    [theme]
  );

  const isAuthPage = ["/login", "/signup"].includes(location.pathname);

  function logout() {
    clearAuth();
    navigate("/login");
  }

  function toggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  return (
    <header className="navbar-glass">
      {/* ── Brand ───────────────────────────────────────────── */}
      <Link to="/" className="navbar-brand" aria-label="CRCE Lab Manager home">
        <span className="navbar-icon">
          <Beaker size={22} />
        </span>
        <span className="navbar-title">CRCE Lab Manager</span>
      </Link>

      {/* ── Right-side controls ─────────────────────────────── */}
      <div className="navbar-controls">
        {/* Role-based nav links — hidden on auth pages */}
        {!isAuthPage && role === "STUDENT" && (
          <>
            <NavLink to="/labs"                   label="Labs"          current={location.pathname} />
            <NavLink to="/requests"               label="My Requests"   current={location.pathname} />
            <NavLink to="/settings/notifications" label="Notifications" current={location.pathname} />
          </>
        )}

        {!isAuthPage && role === "ADMIN" && (
          <>
            <NavLink to="/admin/labs"        label="Labs"       current={location.pathname} />
            <NavLink to="/admin/stock-audit" label="Stock Audit" current={location.pathname} />
          </>
        )}

        {/* Theme toggle */}
        <button
          className="navbar-icon-btn"
          onClick={toggleTheme}
          aria-label={themeLabel}
          title={themeLabel}
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Logout — hidden on auth pages */}
        {!isAuthPage && user && (
          <button
            className="navbar-logout-btn"
            onClick={logout}
            aria-label="Log out"
          >
            <LogOut size={15} />
            <span>Logout</span>
          </button>
        )}
      </div>
    </header>
  );
}

/** Highlighted nav link */
function NavLink({ to, label, current }) {
  const active = current === to || current.startsWith(`${to}/`);
  return (
    <Link
      to={to}
      className={`navbar-nav-link ${active ? "navbar-nav-link--active" : ""}`}
    >
      {label}
    </Link>
  );
}

export default Navbar;
