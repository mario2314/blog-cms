import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, getSettings } from "../api.js";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getSettings().then(setSettings).catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { token } = await login(username, password);
      localStorage.setItem("token", token);
      navigate("/admin");
    } catch {
      setError("Username atau password salah.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full rounded-lg border border-grey-light px-4 py-2.5 font-body text-primary focus:border-secondary focus:ring-secondary";

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="hidden flex-col justify-center bg-primary px-14 py-10 text-white lg:flex">
        {settings?.hero_eyebrow && (
          <p className="font-body text-sm font-semibold uppercase tracking-wide text-yellow-dark">{settings.hero_eyebrow}</p>
        )}
        <h1 className="pt-3 font-body text-4xl font-bold">{settings?.site_name || "Blog"}</h1>
        <p className="max-w-sm pt-4 font-body font-light text-blue-light">
          {settings?.hero_subtitle || "Masuk untuk mulai mengelola artikel."}
        </p>
        <ul className="pt-6 space-y-2 font-body text-sm font-light text-blue-light">
          <li className="flex items-center gap-2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-secondary shrink-0"><path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> Kelola artikel resep, review, dan tips</li>
          <li className="flex items-center gap-2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-secondary shrink-0"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/><circle cx="9" cy="10" r="1.5" fill="currentColor"/><path d="M21 16l-5-5-4 4-2-2-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> Unggah foto masakan langsung dari perangkat</li>
          <li className="flex items-center gap-2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-secondary shrink-0"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg> Atur akun & pengaturan situs dengan aman</li>
        </ul>
      </div>

      <div className="flex items-center justify-center px-6 py-16">
        <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-xl border border-grey-lighter p-8 shadow-sm">
          <p className="font-body text-xs font-semibold uppercase tracking-wide text-gray-500">Masuk</p>
          <h2 className="pt-1 pb-6 font-body text-2xl font-semibold text-primary">Dashboard Admin</h2>

          <label htmlFor="username" className="block pb-1.5 font-body text-sm font-medium text-primary">Username</label>
          <input id="username" className={inputClass} value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />

          <label htmlFor="password" className="block pb-1.5 pt-4 font-body text-sm font-medium text-primary">Password</label>
          <input id="password" type="password" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />

          {error && <p role="alert" className="pt-3 font-body text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-secondary py-2.5 font-body font-semibold text-white transition-colors hover:bg-green disabled:opacity-60"
          >
            {loading ? "Memeriksa…" : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}




