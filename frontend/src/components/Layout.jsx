import { Link, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { getSettings } from "../api.js";

export default function Layout() {
  const [settings, setSettings] = useState(null);
  const isLoggedIn = !!localStorage.getItem("token");
  const adminHref = isLoggedIn ? "/admin" : "/admin/login";
  const adminLabel = isLoggedIn ? "Dashboard" : "Kelola Artikel";
  const year = new Date().getFullYear();

  useEffect(() => {
    getSettings().then(setSettings).catch(() => {});
  }, []);

  const siteName = settings?.site_name || "Blog";

  return (
    <div>
      <header className="border-b border-grey-lighter">
        <div className="container mx-auto flex items-center justify-between px-4 py-5">
          <Link to="/" className="flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-secondary">
              <path d="M3 12h18a1 1 0 011 1 8 8 0 01-8 8H10a8 8 0 01-8-8 1 1 0 011-1z" fill="currentColor" opacity=".9"/>
              <path d="M12 3c.5 1 .2 2-.5 2.5S10 7 11 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span className="font-body text-xl font-bold text-primary">{siteName}</span>
          </Link>
          <nav aria-label="Navigasi utama">
            <Link
              to={adminHref}
              className="rounded-full border border-primary px-4 py-1.5 font-body text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white"
            >
              {adminLabel}
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="border-t border-grey-lighter">
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="font-body text-sm font-light text-gray-500">
            &copy; {year} {siteName}. {settings?.footer_text || ""}
          </p>
        </div>
      </footer>
    </div>
  );
}
