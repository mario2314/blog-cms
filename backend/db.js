const path = require("path");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");

const dataDir = process.env.DATA_DIR || __dirname;
const dbPath = path.join(dataDir, "blog.db");
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    cover_image TEXT,
    category TEXT DEFAULT "Resep",
    published INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    site_name TEXT NOT NULL,
    hero_eyebrow TEXT,
    hero_title TEXT NOT NULL,
    hero_subtitle TEXT,
    story TEXT,
    footer_text TEXT NOT NULL,
    socials TEXT
  );
`);

const postColumns = db.prepare("PRAGMA table_info(posts)").all().map((c) => c.name);
if (!postColumns.includes("category")) {
  db.exec("ALTER TABLE posts ADD COLUMN category TEXT DEFAULT \"Resep\"");
  console.log("Kolom category ditambahkan ke tabel posts");
}

const settingsColumns = db.prepare("PRAGMA table_info(settings)").all().map((c) => c.name);
if (!settingsColumns.includes("story")) {
  db.exec("ALTER TABLE settings ADD COLUMN story TEXT");
  console.log("Kolom story ditambahkan ke tabel settings");
}
if (!settingsColumns.includes("socials")) {
  db.exec("ALTER TABLE settings ADD COLUMN socials TEXT");
  console.log("Kolom socials ditambahkan ke tabel settings");
}

const existingAdmin = db.prepare("SELECT * FROM admin_users WHERE username = ?").get("admin");
if (!existingAdmin) {
  const hash = bcrypt.hashSync("admin123", 10);
  db.prepare("INSERT INTO admin_users (username, password_hash) VALUES (?, ?)").run("admin", hash);
  console.log("Admin default dibuat -> username: admin | password: admin123 (GANTI SEGERA)");
}

const existingSettings = db.prepare("SELECT * FROM settings WHERE id = 1").get();
if (!existingSettings) {
  db.prepare(
    "INSERT INTO settings (id, site_name, hero_eyebrow, hero_title, hero_subtitle, story, footer_text, socials) VALUES (1, ?, ?, ?, ?, ?, ?, ?)"
  ).run(
    "Rasa Nusantara",
    "warung digital",
    "Dapur naskah untuk resep, review, dan tips kuliner",
    "Masuk untuk mulai menulis cerita rasa hari ini.",
    "Ceritakan sedikit tentang blog ini di sini.\n\nBisa beberapa paragraf, dipisah baris kosong.",
    "Blog kuliner. Semua hak cipta dilindungi.",
    JSON.stringify([
      { icon: "bxl-instagram", url: "https://instagram.com" },
      { icon: "bxl-github", url: "https://github.com" }
    ])
  );
  console.log("Settings default dibuat");
} else if (!existingSettings.story || !existingSettings.socials) {
  db.prepare("UPDATE settings SET story = ?, socials = ? WHERE id = 1").run(
    existingSettings.story || "Ceritakan sedikit tentang blog ini di sini.\n\nBisa beberapa paragraf, dipisah baris kosong.",
    existingSettings.socials || JSON.stringify([
      { icon: "bxl-instagram", url: "https://instagram.com" },
      { icon: "bxl-github", url: "https://github.com" }
    ])
  );
  console.log("Data story/socials default diisi ke row settings yang sudah ada");
}

module.exports = db;
