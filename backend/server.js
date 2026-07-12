require("dotenv").config();
const express = require("express");
const cors = require("cors");
const compression = require("compression");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./db");

const app = express();
app.set("trust proxy", 1);

const JWT_SECRET = process.env.JWT_SECRET || "ganti-secret-ini-di-env";

app.use(compression());
app.use(cors());
app.use(express.json());

const dataDir = process.env.DATA_DIR || __dirname;
const uploadDir = path.join(dataDir, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use("/uploads", express.static(uploadDir, { maxAge: "7d" }));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + ext);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) return cb(new Error("File harus berupa gambar"));
    cb(null, true);
  },
});

function slugify(text) {
  return text.toLowerCase().trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function safeParseSocials(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
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

function signToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "7d" });
}

function asyncHandler(fn) {
  return (req, res, next) => {
    try {
      const result = fn(req, res, next);
      if (result && result.catch) result.catch(next);
    } catch (err) {
      next(err);
    }
  };
}

app.post("/api/auth/login", asyncHandler((req, res) => {
  const { username, password } = req.body;
  const user = db.prepare("SELECT * FROM admin_users WHERE username = ?").get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Username atau password salah" });
  }
  res.json({ token: signToken(user) });
}));

app.get("/api/admin/me", authMiddleware, asyncHandler((req, res) => {
  const user = db.prepare("SELECT id, username FROM admin_users WHERE id = ?").get(req.user.id);
  if (!user) return res.status(404).json({ error: "User tidak ditemukan" });
  res.json(user);
}));

app.put("/api/admin/account", authMiddleware, asyncHandler((req, res) => {
  const { currentPassword, newUsername, newPassword } = req.body;
  const user = db.prepare("SELECT * FROM admin_users WHERE id = ?").get(req.user.id);
  if (!user || !bcrypt.compareSync(currentPassword, user.password_hash)) {
    return res.status(401).json({ error: "Password saat ini salah" });
  }
  const username = newUsername && newUsername.trim() ? newUsername.trim() : user.username;
  const passwordHash = newPassword && newPassword.trim() ? bcrypt.hashSync(newPassword, 10) : user.password_hash;
  db.prepare("UPDATE admin_users SET username=?, password_hash=? WHERE id=?").run(username, passwordHash, user.id);
  const updatedUser = { id: user.id, username };
  res.json({ success: true, username, token: signToken(updatedUser) });
}));

app.get("/api/posts", asyncHandler((req, res) => {
  res.set("Cache-Control", "public, max-age=60");
  const posts = db.prepare(
    "SELECT id, title, slug, excerpt, cover_image, category, created_at FROM posts WHERE published = 1 ORDER BY created_at DESC"
  ).all();
  res.json(posts);
}));

app.get("/api/posts/:slug", asyncHandler((req, res) => {
  res.set("Cache-Control", "public, max-age=60");
  const post = db.prepare("SELECT * FROM posts WHERE slug = ? AND published = 1").get(req.params.slug);
  if (!post) return res.status(404).json({ error: "Post tidak ditemukan" });
  res.json(post);
}));

app.get("/api/settings", asyncHandler((req, res) => {
  res.set("Cache-Control", "public, max-age=60");
  const settings = db.prepare("SELECT * FROM settings WHERE id = 1").get();
  if (!settings) return res.status(404).json({ error: "Settings belum ada" });
  res.json({
    site_name: settings.site_name || "Blog",
    hero_eyebrow: settings.hero_eyebrow || "",
    hero_title: settings.hero_title || "Selamat datang",
    hero_subtitle: settings.hero_subtitle || "",
    story: settings.story || "",
    footer_text: settings.footer_text || "",
    socials: safeParseSocials(settings.socials),
  });
}));

app.put("/api/admin/settings", authMiddleware, asyncHandler((req, res) => {
  const current = db.prepare("SELECT * FROM settings WHERE id = 1").get();
  const { site_name, hero_eyebrow, hero_title, hero_subtitle, footer_text, story, socials } = req.body;
  db.prepare(
    "UPDATE settings SET site_name=?, hero_eyebrow=?, hero_title=?, hero_subtitle=?, story=?, footer_text=?, socials=? WHERE id=1"
  ).run(
    site_name ?? current.site_name,
    hero_eyebrow ?? current.hero_eyebrow,
    hero_title ?? current.hero_title,
    hero_subtitle ?? current.hero_subtitle,
    story ?? current.story,
    footer_text ?? current.footer_text,
    socials ? JSON.stringify(socials) : current.socials
  );
  res.json({ success: true });
}));

app.get("/api/admin/posts", authMiddleware, asyncHandler((req, res) => {
  const posts = db.prepare("SELECT * FROM posts ORDER BY created_at DESC").all();
  res.json(posts);
}));

app.get("/api/admin/posts/:id", authMiddleware, asyncHandler((req, res) => {
  const post = db.prepare("SELECT * FROM posts WHERE id = ?").get(req.params.id);
  if (!post) return res.status(404).json({ error: "Post tidak ditemukan" });
  res.json(post);
}));

app.post("/api/admin/posts", authMiddleware, asyncHandler((req, res) => {
  const { title, excerpt, content, cover_image, category, published } = req.body;
  if (!title || !content) return res.status(400).json({ error: "Title & content wajib diisi" });

  let slug = slugify(title);
  const clash = db.prepare("SELECT id FROM posts WHERE slug = ?").get(slug);
  if (clash) slug = `${slug}-${Date.now()}`;

  const result = db.prepare(
    "INSERT INTO posts (title, slug, excerpt, content, cover_image, category, published) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(title, slug, excerpt || "", content, cover_image || "", category || "Resep", published ? 1 : 0);

  res.json({ id: result.lastInsertRowid, slug });
}));

app.put("/api/admin/posts/:id", authMiddleware, asyncHandler((req, res) => {
  const { title, excerpt, content, cover_image, category, published } = req.body;
  db.prepare(
    `UPDATE posts SET title=?, excerpt=?, content=?, cover_image=?, category=?, published=?, updated_at=datetime("now") WHERE id=?`
  ).run(title, excerpt || "", content, cover_image || "", category || "Resep", published ? 1 : 0, req.params.id);
  res.json({ success: true });
}));

app.delete("/api/admin/posts/:id", authMiddleware, asyncHandler((req, res) => {
  db.prepare("DELETE FROM posts WHERE id = ?").run(req.params.id);
  res.json({ success: true });
}));

app.post("/api/admin/upload", authMiddleware, upload.single("image"), asyncHandler((req, res) => {
  if (!req.file) return res.status(400).json({ error: "Tidak ada file diunggah" });
  const baseUrl = process.env.PUBLIC_URL || `${req.protocol}://${req.get("host")}`;
  const url = `${baseUrl}/uploads/${req.file.filename}`;
  res.json({ url });
}));

app.use("/api", (req, res) => {
  res.status(404).json({ error: "Endpoint tidak ditemukan" });
});

app.use((err, req, res, next) => {
  console.error("Server error:", err.message);
  console.error(err.stack);
  res.status(500).json({ error: "Terjadi kesalahan di server", detail: err.message });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend jalan di http://localhost:${PORT}`));
