const db = require("./db");

function slugify(text) {
  return text.toLowerCase().trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const dummyPosts = [
  {
    title: "Memulai Perjalanan Ngeblog",
    excerpt: "Cerita awal kenapa saya mulai menulis di blog ini.",
    content: "<p>Ini adalah artikel pertama di blog ini. Saya menulis untuk mendokumentasikan proses belajar dan berbagi hal-hal yang saya temukan menarik.</p><p>Semoga tulisan-tulisan ke depan bisa bermanfaat.</p>",
    published: 1,
  },
  {
    title: "Tips Tetap Konsisten Menulis",
    excerpt: "Beberapa kebiasaan kecil yang membantu saya tetap produktif menulis.",
    content: "<p>Konsistensi menulis itu sulit, tapi ada beberapa trik yang bisa membantu.</p><ul><li>Tulis draft dulu, edit belakangan</li><li>Set target kecil, misal 15 menit per hari</li><li>Jangan takut tulisan pertama jelek</li></ul>",
    published: 1,
  },
  {
    title: "Belajar React dari Nol",
    excerpt: "Rangkuman pengalaman awal belajar React sebagai pemula.",
    content: "<p>React adalah library JavaScript untuk membangun antarmuka pengguna. Konsep utamanya adalah komponen dan state.</p><p>Butuh waktu untuk terbiasa dengan cara berpikir deklaratif, tapi setelah paham, sangat produktif.</p>",
    published: 1,
  },
  {
    title: "Draft Belum Publish (contoh)",
    excerpt: "Ini contoh artikel yang masih draft.",
    content: "<p>Artikel ini sengaja belum di-publish untuk contoh fitur draft di admin dashboard.</p>",
    published: 0,
  },
];

const existingCount = db.prepare("SELECT COUNT(*) as count FROM posts").get().count;

if (existingCount === 0) {
  const insert = db.prepare(
    "INSERT INTO posts (title, slug, excerpt, content, published) VALUES (?, ?, ?, ?, ?)"
  );
  dummyPosts.forEach((p) => {
    insert.run(p.title, slugify(p.title), p.excerpt, p.content, p.published);
  });
  console.log(dummyPosts.length + " dummy posts berhasil ditambahkan ke database.");
} else {
  console.log("Tabel posts sudah berisi data (" + existingCount + " post), seeding dilewati.");
}

console.log("Seeding selesai. Jalankan: node server.js");
