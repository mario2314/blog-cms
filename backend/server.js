require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const db = require("./db");

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || "ganti-secret-ini-di-env";
const PORT = process.env.PORT || 4000;

const dataDir = process.env.DATA_DIR || __dirname;
const uploadsDir = path.join(dataDir, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

app.use(cors({ origin: process.env.FRONTEND_URL || "*" }));
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));

function slugify(text) {
  return text.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "Token tidak ada" });
  const token = header.split(" ")[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Token tidak valid" });
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
    if (!allowed.includes(path.extname(file.originalname).toLowerCase())) return cb(new Error("Format file tidak didukung"));
    cb(null, true);
  },
});

app.post("/api/admin/upload", authMiddleware, upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Tidak ada file yang diupload" });
  try {
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;
    await sharp(req.file.buffer)
      .resize({ width: 900, height: 900, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 72, mozjpeg: true })
      .toFile(path.join(uploadsDir, filename));
    const base = process.env.BACKEND_URL || `http://localhost:${PORT}`;
    res.json({ url: `${base}/uploads/${filename}` });
  } catch (err) {
    res.status(500).json({ error: "Gagal memproses gambar" });
  }
});

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare("SELECT * FROM admin_users WHERE username = ?").get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Username atau password salah" });
  }
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ token });
});

app.get("/api/admin/me", authMiddleware, (req, res) => {
  const user = db.prepare("SELECT id, username FROM admin_users WHERE id = ?").get(req.user.id);
  if (!user) return res.status(404).json({ error: "Akun tidak ditemukan" });
  res.json(user);
});

app.put("/api/admin/account", authMiddleware, (req, res) => {
  const { currentPassword, newUsername, newPassword } = req.body;
  const user = db.prepare("SELECT * FROM admin_users WHERE id = ?").get(req.user.id);
  if (!user || !bcrypt.compareSync(currentPassword || "", user.password_hash)) {
    return res.status(401).json({ error: "Password saat ini salah" });
  }
  const username = (newUsername || user.username).trim();
  if (!username) return res.status(400).json({ error: "Username tidak boleh kosong" });
  if (username !== user.username) {
    const clash = db.prepare("SELECT id FROM admin_users WHERE username = ? AND id != ?").get(username, user.id);
    if (clash) return res.status(400).json({ error: "Username sudah dipakai" });
  }
  if (newPassword && newPassword.length < 6) return res.status(400).json({ error: "Password baru minimal 6 karakter" });
  const passwordHash = newPassword ? bcrypt.hashSync(newPassword, 10) : user.password_hash;
  db.prepare("UPDATE admin_users SET username = ?, password_hash = ? WHERE id = ?").run(username, passwordHash, user.id);
  const token = jwt.sign({ id: user.id, username }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ success: true, username, token });
});

app.get("/api/settings", (req, res) => {
  const settings = db.prepare("SELECT * FROM settings WHERE id = 1").get();
  if (!settings) return res.status(404).json({ error: "Pengaturan belum ada" });
  res.json(settings);
});

app.put("/api/admin/settings", authMiddleware, (req, res) => {
  const { site_name, hero_eyebrow, hero_title, hero_subtitle, hero_image, story, footer_text } = req.body;
  if (!site_name || !hero_title) return res.status(400).json({ error: "Nama situs & judul hero wajib diisi" });
  db.prepare(`
    UPDATE settings SET site_name=?, hero_eyebrow=?, hero_title=?, hero_subtitle=?, hero_image=?, story=?, footer_text=? WHERE id=1
  `).run(site_name, hero_eyebrow || "", hero_title, hero_subtitle || "", hero_image || "", story || "", footer_text || "");
  res.json({ success: true });
});

app.get("/api/posts", (req, res) => {
  const posts = db.prepare(
    "SELECT id, title, slug, excerpt, cover_image, category, created_at FROM posts WHERE published = 1 ORDER BY created_at DESC"
  ).all();
  res.json(posts);
});

app.get("/api/posts/:slug", (req, res) => {
  const post = db.prepare("SELECT * FROM posts WHERE slug = ? AND published = 1").get(req.params.slug);
  if (!post) return res.status(404).json({ error: "Post tidak ditemukan" });
  res.json(post);
});

app.get("/api/admin/posts", authMiddleware, (req, res) => {
  res.json(db.prepare("SELECT * FROM posts ORDER BY created_at DESC").all());
});

app.get("/api/admin/posts/:id", authMiddleware, (req, res) => {
  const post = db.prepare("SELECT * FROM posts WHERE id = ?").get(req.params.id);
  if (!post) return res.status(404).json({ error: "Post tidak ditemukan" });
  res.json(post);
});

app.post("/api/admin/posts", authMiddleware, (req, res) => {
  const { title, excerpt, content, cover_image, category, published } = req.body;
  if (!title || !content) return res.status(400).json({ error: "Title & content wajib diisi" });
  let slug = slugify(title);
  if (db.prepare("SELECT id FROM posts WHERE slug = ?").get(slug)) slug = `${slug}-${Date.now()}`;
  const result = db.prepare(
    "INSERT INTO posts (title, slug, excerpt, content, cover_image, category, published) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(title, slug, excerpt || "", content, cover_image || "", category || "Resep", published ? 1 : 0);
  res.json({ id: result.lastInsertRowid, slug });
});

app.put("/api/admin/posts/:id", authMiddleware, (req, res) => {
  const { title, excerpt, content, cover_image, category, published } = req.body;
  db.prepare(
    `UPDATE posts SET title=?, excerpt=?, content=?, cover_image=?, category=?, published=?, updated_at=datetime('now') WHERE id=?`
  ).run(title, excerpt || "", content, cover_image || "", category || "Resep", published ? 1 : 0, req.params.id);
  res.json({ success: true });
});

app.delete("/api/admin/posts/:id", authMiddleware, (req, res) => {
  db.prepare("DELETE FROM posts WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

app.listen(PORT, () => console.log(`Backend jalan di http://localhost:${PORT}`));
