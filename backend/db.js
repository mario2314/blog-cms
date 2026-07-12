const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");

const db = new Database("blog.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    cover_image TEXT,
    category TEXT DEFAULT 'Resep',
    published INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    site_name TEXT NOT NULL,
    hero_eyebrow TEXT NOT NULL,
    hero_title TEXT NOT NULL,
    hero_subtitle TEXT NOT NULL,
    hero_image TEXT DEFAULT '',
    story TEXT DEFAULT '',
    footer_text TEXT NOT NULL
  );
`);

const postCols = db.prepare("PRAGMA table_info(posts)").all();
if (!postCols.some((c) => c.name === "category")) {
  db.exec("ALTER TABLE posts ADD COLUMN category TEXT DEFAULT 'Resep'");
}

const settingsCols = db.prepare("PRAGMA table_info(settings)").all();
if (!settingsCols.some((c) => c.name === "hero_image")) {
  db.exec("ALTER TABLE settings ADD COLUMN hero_image TEXT DEFAULT ''");
}
if (!settingsCols.some((c) => c.name === "story")) {
  db.exec("ALTER TABLE settings ADD COLUMN story TEXT DEFAULT ''");
}

const existingAdmin = db.prepare("SELECT * FROM admin_users WHERE username = ?").get("admin");
if (!existingAdmin) {
  const hash = bcrypt.hashSync("admin123", 10);
  db.prepare("INSERT INTO admin_users (username, password_hash) VALUES (?, ?)").run("admin", hash);
  console.log("Admin default dibuat -> username: admin | password: admin123 (GANTI SEGERA)");
}

const existingSettings = db.prepare("SELECT * FROM settings WHERE id = 1").get();
if (!existingSettings) {
  db.prepare(`
    INSERT INTO settings (id, site_name, hero_eyebrow, hero_title, hero_subtitle, hero_image, story, footer_text)
    VALUES (1, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    "Rasa Nusantara",
    "papan menu hari ini",
    "Cerita rasa dari dapur rumah Indonesia",
    "Resep, review tempat makan, dan tips dapur yang diuji langsung di dapur rumahan.",
    "/images/rendang.jpg",
    "Rasa Nusantara lahir dari kecintaan pada masakan rumahan Indonesia.\n\nSetiap resep di sini diuji langsung di dapur sendiri sebelum dibagikan.",
    "Semua hak cipta dilindungi."
  );
  console.log("Pengaturan situs default dibuat.");
}

const postCount = db.prepare("SELECT COUNT(*) AS count FROM posts").get().count;
if (postCount === 0) {
  const insert = db.prepare(`
    INSERT INTO posts (title, slug, excerpt, content, cover_image, category, published)
    VALUES (@title, @slug, @excerpt, @content, @cover_image, @category, @published)
  `);
  const dummyPosts = [
    { title: "Resep Rendang Daging Sapi Empuk Ala Rumahan", slug: "resep-rendang-daging-sapi-empuk-ala-rumahan", excerpt: "Rendang khas Minang dengan bumbu rempah lengkap dan daging yang empuk meresap sempurna.", content: "<p>Rendang adalah salah satu masakan paling ikonik dari Sumatera Barat yang sudah mendunia.</p><p>Masak dengan api kecil selama 3-4 jam sambil sesekali diaduk.</p>", cover_image: "/images/rendang.jpg", category: "Resep", published: 1 },
    { title: "Soto Ayam Lamongan, Segar dan Gurih di Setiap Suapan", slug: "soto-ayam-lamongan-segar-dan-gurih", excerpt: "Kuah bening berpadu dengan koya udang yang gurih, cocok disantap kapan saja.", content: "<p>Soto Ayam Lamongan punya ciri khas kuah bening dengan taburan koya.</p><p>Sajikan bersama nasi hangat, telur rebus, dan sambal.</p>", cover_image: "/images/soto-ayam.jpg", category: "Resep", published: 1 },
    { title: "Review Warung Nasi Padang Sederhana yang Rasanya Juara", slug: "review-warung-nasi-padang-sederhana-rasanya-juara", excerpt: "Meski tampilannya sederhana, cita rasa masakan Padang di warung ini tak perlu diragukan.", content: "<p>Kami mengunjungi sebuah warung nasi Padang kecil di pinggir kota.</p>", cover_image: "/images/nasi-padang.jpg", category: "Review", published: 1 },
    { title: "5 Tips Menyimpan Bumbu Dapur Agar Awet dan Tetap Segar", slug: "5-tips-menyimpan-bumbu-dapur-agar-awet", excerpt: "Simpan bawang, cabai, hingga rempah kering dengan cara yang tepat.", content: "<p>Berikut beberapa tips sederhana.</p><ol><li>Simpan bawang di tempat kering</li><li>Gunakan wadah kedap udara</li><li>Bekukan cabai dalam porsi kecil</li></ol>", cover_image: "/images/bumbu-dapur.jpg", category: "Tips", published: 1 },
    { title: "Nasi Goreng Kampung, Simpel Tapi Bikin Nagih", slug: "nasi-goreng-kampung-simpel-tapi-bikin-nagih", excerpt: "Resep nasi goreng rumahan dengan bahan sederhana yang selalu ada di dapur.", content: "<p>Nasi goreng kampung mengandalkan bumbu dasar merah dan sedikit terasi.</p>", cover_image: "/images/nasi-goreng.jpg", category: "Resep", published: 1 },
    { title: "Review Kedai Kopi dan Gorengan Legendaris di Jakarta", slug: "review-kedai-kopi-dan-gorengan-legendaris-jakarta", excerpt: "Sudah berdiri puluhan tahun, kedai ini masih setia dengan resep aslinya.", content: "<p>Kedai kopi tubruk ini sudah beroperasi sejak tahun 80-an.</p>", cover_image: "/images/kedai-kopi.jpg", category: "Review", published: 1 },
    { title: "Tips Memilih Ikan Segar di Pasar Tradisional", slug: "tips-memilih-ikan-segar-di-pasar-tradisional", excerpt: "Perhatikan mata, insang, hingga tekstur daging ikan sebelum membeli.", content: "<p>Berikut ciri-ciri ikan segar yang wajib diperhatikan.</p><ul><li>Mata ikan jernih</li><li>Insang berwarna merah segar</li><li>Daging kenyal saat ditekan</li></ul>", cover_image: "/images/ikan-segar.jpg", category: "Tips", published: 1 },
  ];
  for (const post of dummyPosts) insert.run(post);
  console.log(`${dummyPosts.length} dummy artikel kuliner berhasil ditambahkan.`);
}

module.exports = db;
