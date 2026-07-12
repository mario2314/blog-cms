import { useEffect, useRef, useState } from "react";
import { getSettings, updateSettings, uploadImage } from "../api.js";
import { useToast } from "../context/ToastContext.jsx";

const inputClass = "w-full rounded-lg border border-grey-light px-4 py-2.5 font-body text-primary focus:border-secondary focus:ring-secondary";
const labelClass = "block pb-1.5 pt-4 font-body text-sm font-medium text-primary";

export default function SettingsForm() {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const showToast = useToast();

  useEffect(() => {
    getSettings().then(setForm);
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadImage(file);
      update("hero_image", url);
      showToast("Gambar berhasil diunggah", "success");
    } catch {
      showToast("Upload gagal. Pastikan file gambar (jpg/png/webp) maks 5MB.", "error");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings(form);
      showToast("Pengaturan situs berhasil disimpan", "success");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  if (!form) return <p className="font-body text-primary">Memuat pengaturan…</p>;

  return (
    <form onSubmit={handleSubmit} className="max-w-xl">
      <p className="font-body text-sm font-light text-gray-500">
        Teks di bawah ini tampil di header, beranda, dan footer situs.
      </p>

      <label htmlFor="site_name" className={labelClass}>Nama Situs</label>
      <input id="site_name" className={inputClass} value={form.site_name} onChange={(e) => update("site_name", e.target.value)} required />

      <label htmlFor="hero_eyebrow" className={labelClass}>Label Kecil di Atas Judul Hero</label>
      <input id="hero_eyebrow" className={inputClass} value={form.hero_eyebrow} onChange={(e) => update("hero_eyebrow", e.target.value)} />

      <label htmlFor="hero_title" className={labelClass}>Judul Besar Hero</label>
      <input id="hero_title" className={inputClass} value={form.hero_title} onChange={(e) => update("hero_title", e.target.value)} required />

      <label htmlFor="hero_subtitle" className={labelClass}>Deskripsi Hero</label>
      <textarea id="hero_subtitle" className={inputClass} rows={3} value={form.hero_subtitle} onChange={(e) => update("hero_subtitle", e.target.value)} />

      <label className={labelClass}>Gambar Unggulan (Featured Image)</label>
      <div
        className="cursor-pointer rounded-lg border-2 border-dashed border-grey-light p-6 text-center font-body text-sm text-gray-500 transition-colors hover:border-secondary"
        onClick={() => fileInputRef.current?.click()}
      >
        {form.hero_image ? (
          <img src={form.hero_image} alt="Pratinjau gambar unggulan" className="mx-auto max-h-52 rounded-lg object-cover" />
        ) : (
          <p>{uploading ? "Mengunggah…" : "Klik untuk pilih gambar"}</p>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} hidden />
      </div>

      <label htmlFor="story" className={labelClass}>My Story (pisahkan paragraf dengan baris kosong)</label>
      <textarea id="story" className={inputClass} rows={6} value={form.story} onChange={(e) => update("story", e.target.value)} />

      <label htmlFor="footer_text" className={labelClass}>Teks Footer</label>
      <input id="footer_text" className={inputClass} value={form.footer_text} onChange={(e) => update("footer_text", e.target.value)} />

      <button
        type="submit"
        disabled={saving || uploading}
        className="mt-6 rounded-lg bg-secondary px-5 py-2.5 font-body text-sm font-semibold text-white transition-colors hover:bg-green disabled:opacity-60"
      >
        {saving ? "Menyimpan…" : "Simpan Pengaturan"}
      </button>
    </form>
  );
}
