import Navbar from "./Navbar";

/**
 * Global Layout
 *
 * Wraps every route with the persistent glassmorphism Navbar.
 * theme / setTheme are threaded in from App so the toggle state
 * is shared application-wide.
 */
function Layout({ children, theme, setTheme }) {
  return (
    <div className="layout-root">
      <Navbar theme={theme} setTheme={setTheme} />
      <main className="layout-main">{children}</main>
    </div>
  );
}

export default Layout;
