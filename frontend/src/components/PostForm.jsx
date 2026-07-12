import { useEffect, useState, useRef } from "react";
import { getAdminPost, createPost, updatePost, uploadImage } from "../api.js";
import { useToast } from "../context/ToastContext.jsx";

const CATEGORIES = ["Resep", "Review", "Tips"];
const inputClass = "w-full rounded-lg border border-grey-light px-4 py-2.5 font-body text-primary focus:border-secondary focus:ring-secondary";
const labelClass = "block pb-1.5 pt-4 font-body text-sm font-medium text-primary";

export default function PostForm({ postId, onDone }) {
  const [form, setForm] = useState({
    title: "", excerpt: "", content: "", cover_image: "", category: "Resep", published: false,
  });
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  const showToast = useToast();

  useEffect(() => {
    if (postId) getAdminPost(postId).then(setForm);
  }, [postId]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function doUpload(file) {
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadImage(file);
      update("cover_image", url);
      showToast("Gambar berhasil diunggah", "success");
    } catch {
      showToast("Upload gagal. Pastikan file gambar (jpg/png/webp) maks 5MB.", "error");
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(e) {
    doUpload(e.target.files[0]);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    doUpload(e.dataTransfer.files[0]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (postId) await updatePost(postId, form);
      else await createPost(form);
      onDone("Artikel berhasil disimpan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="font-body text-xl font-semibold text-primary">{postId ? "Edit Artikel" : "Artikel Baru"}</h2>

      <label htmlFor="title" className={labelClass}>Judul</label>
      <input id="title" className={inputClass} value={form.title} onChange={(e) => update("title", e.target.value)} required />

      <label htmlFor="category" className={labelClass}>Kategori</label>
      <select id="category" className={inputClass} value={form.category} onChange={(e) => update("category", e.target.value)}>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <label htmlFor="excerpt" className={labelClass}>Ringkasan</label>
      <textarea id="excerpt" className={inputClass} rows={2} value={form.excerpt} onChange={(e) => update("excerpt", e.target.value)} />

      <label htmlFor="cover_image_file" className={labelClass}>Gambar Cover</label>
      <div
        className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center font-body text-sm transition-colors ${
          dragOver ? "border-secondary bg-blue-light/20" : "border-grey-light text-gray-500"
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {form.cover_image ? (
          <img src={form.cover_image} alt="Pratinjau cover" className="mx-auto max-h-44 rounded-lg object-cover" />
        ) : (
          <p>{uploading ? "Mengunggah…" : "Klik atau seret gambar ke sini"}</p>
        )}
        <input ref={fileInputRef} id="cover_image_file" type="file" accept="image/*" onChange={handleFileChange} hidden />
      </div>

      <label htmlFor="content" className={labelClass}>Konten (bisa pakai HTML)</label>
      <textarea id="content" className={inputClass} rows={12} value={form.content} onChange={(e) => update("content", e.target.value)} required />

      <label className="mt-4 flex items-center gap-2 font-body text-sm font-medium text-primary">
        <input type="checkbox" checked={!!form.published} onChange={(e) => update("published", e.target.checked)} />
        Publish sekarang
      </label>

      <div className="pt-6">
        <button
          type="submit"
          disabled={saving || uploading}
          className="mr-2 rounded-lg bg-secondary px-5 py-2.5 font-body text-sm font-semibold text-white transition-colors hover:bg-green disabled:opacity-60"
        >
          {saving ? "Menyimpan…" : "Simpan"}
        </button>
        <button
          type="button"
          onClick={() => onDone()}
          className="rounded-lg border border-grey-light px-5 py-2.5 font-body text-sm font-semibold text-primary transition-colors hover:bg-grey-lightest"
        >
          Batal
        </button>
      </div>
    </form>
  );
}


