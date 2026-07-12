import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminPosts, deletePost, getAdminMe, updateAdminAccount } from "../api.js";
import PostForm from "../components/PostForm.jsx";
import SettingsForm from "../components/SettingsForm.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { useToast } from "../context/ToastContext.jsx";

const inputClass = "w-full rounded-lg border border-grey-light px-4 py-2.5 font-body text-primary focus:border-secondary focus:ring-secondary";
const labelClass = "block pb-1.5 pt-4 font-body text-sm font-medium text-primary";

export default function AdminDashboard() {
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [tab, setTab] = useState("artikel");
  const [confirmId, setConfirmId] = useState(null);
  const [account, setAccount] = useState(null);
  const [accountForm, setAccountForm] = useState({ currentPassword: "", newUsername: "", newPassword:"" });
  const [savingAccount, setSavingAccount] = useState(false);
  const navigate = useNavigate();
  const showToast = useToast();

  function loadPosts() {
    getAdminPosts().then(setPosts);
  }
  useEffect(loadPosts, []);

  useEffect(() => {
    getAdminMe()
      .then((data) => {
        setAccount(data);
        setAccountForm((f) => ({ ...f, newUsername: data.username }));
      })
      .catch(() => {
        localStorage.removeItem("token");
        navigate("/admin/login");
      });
  }, [navigate]);

  async function handleDelete() {
    await deletePost(confirmId);
    setConfirmId(null);
    loadPosts();
    showToast("Artikel berhasil dihapus", "success");
  }

  function logout() {
    localStorage.removeItem("token");
    navigate("/admin/login");
  }

  async function handleAccountSubmit(e) {
    e.preventDefault();
    setSavingAccount(true);
    try {
      const result = await updateAdminAccount(accountForm);
      localStorage.setItem("token", result.token);
      setAccount({ username: result.username });
      setAccountForm({ currentPassword: "", newUsername: result.username, newPassword: "" });
      showToast("Akun berhasil diperbarui", "success");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSavingAccount(false);
    }
  }

  const tabs = [
    { key: "artikel", label: "Artikel" },
    { key: "pengaturan", label: "Pengaturan Situs" },
    { key: "akun", label: "Akun" },
  ];

  if (editing) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <PostForm
          postId={editing === "new" ? null : editing}
          onDone={(msg) => {
            setEditing(null);
            loadPosts();
            if (msg) showToast(msg, "success");
          }}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6">
        <div>
          <h1 className="font-body text-2xl font-semibold text-primary">Dashboard Admin</h1>
          <p className="pt-1 font-body text-sm text-gray-500">
            {account ? ((<>Masuk sebagai <strong className="text-primary">{account.username}</strong></>)) : "Memuat akun..."}
          </p>
        </div>
        <div className="flex gap-2">
          {tab === "artikel" && (
            <button
              type="button"
              onClick={() => setEditing("new")}
              className="rounded-lg bg-secondary px-4 py-2 font-body text-sm font-semibold text-white transition-colors hover:bg-green"
            >
              + Artikel Baru
            </button>
          )}
          <button
            type="button"
            onClick={logout}
            className="rounded-lg border border-grey-light px-4 py-2 font-body text-sm font-semibold text-primary transition-colors hover:bg-grey-lightest"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="flex gap-1 border-b border-grey-lighter" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={"border-b-2 px-4 py-2.5 font-body text-sm font-semibold transition-colors " + (tab === t.key ? "border-secondary text-secondary" : "border-transparent text-gray-500 hover:text-primary")}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="pt-6">
        {tab === "artikel" && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-grey-lighter text-left">
                  <th className="py-2 font-body text-xs font-semibold uppercase tracking-wide text-gray-500">Judul</th>
                  <th className="py-2 font-body text-xs font-semibold uppercase tracking-wide text-gray-500">Kategori</th>
                  <th className="py-2 font-body text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                  <th className="py-2 font-body text-xs font-semibold uppercase tracking-wide text-gray-500">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {posts.map((p) => (
                  <tr key={p.id} className="border-b border-grey-lighter">
                    <td className="py-3 font-body text-sm text-primary">{p.title}</td>
                    <td className="py-3 font-body text-sm text-primary">{p.category}</td>
                    <td className="py-3">
                      <span className={"rounded-full px-2.5 py-1 font-body text-xs font-semibold " + (p.published ? "bg-green-light text-green-dark" : "bg-grey-lighter text-primary")}>
                        {p.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap py-3">
                      <button
                        type="button"
                        onClick={() => setEditing(p.id)}
                        className="mr-2 rounded-lg border border-grey-light px-3 py-1.5 font-body text-xs font-semibold text-primary hover:bg-grey-lightest"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmId(p.id)}
                        className="rounded-lg bg-red-600 px-3 py-1.5 font-body text-xs font-semibold text-white hover:bg-red-700"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
                {posts.length === 0 && (
                  <tr><td colSpan="4" className="py-6 font-body text-sm text-gray-500">Belum ada artikel. Klik "+ Artikel Baru" untuk mulai menulis.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === "pengaturan" && <SettingsForm />}

        {tab === "akun" && (
          <form onSubmit={handleAccountSubmit} className="max-w-md">
            <p className="font-body text-sm font-light text-grey">
              Ubah username dan/atau password admin. Password saat ini wajib diisi untuk konfirmasi.
            </p>

            <label htmlFor="newUsername" className={labelClass}>Username</label>
            <input id="newUsername" className={inputClass} value={accountForm.newUsername} onChange={(e) => setAccountForm((f) => ({ ...f, newUsername: e.target.value }))} required />

            <label htmlFor="newPassword" className={labelClass}>Password Baru (kosongkan jika tidak diganti)</label>
            <input id="newPassword" type="password" className={inputClass} value={accountForm.newPassword} onChange={(e) => setAccountForm((f) => ({ ...f, newPassword: e.target.value }))} placeholder="Minimal 6 karakter" />

            <label htmlFor="currentPassword" className={labelClass}>Password Saat Ini (wajib)</label>
            <input id="currentPassword" type="password" className={inputClass} value={accountForm.currentPassword} onChange={(e) => setAccountForm((f) => ({ ...f, currentPassword: e.target.value }))} required />

            <button
              type="submit"
              disabled={savingAccount}
              className="mt-6 rounded-lg bg-secondary px-5 py-2.5 font-body text-sm font-semibold text-white transition-colors hover:bg-green disabled:opacity-60"
            >
              {savingAccount ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </form>
        )}
      </div>

      <ConfirmDialog
        open={confirmId !== null}
        title="Hapus artikel?"
        message="Artikel yang dihapus tidak bisa dikembalikan."
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}
