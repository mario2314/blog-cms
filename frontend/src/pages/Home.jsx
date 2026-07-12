import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta.js";
import { getPosts, getSettings } from "../api.js";

const categoryStyle = {
  Resep: "bg-green-dark text-white",
  Review: "bg-yellow-light text-primary",
  Tips: "bg-blue-dark text-white",
};

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPosts().then((data) => {
      setPosts(data);
      setLoading(false);
    });
    getSettings().then(setSettings).catch(() => {});
  }, []);

  const siteName = settings?.site_name || "Blog";
  const storyParagraphs = (settings?.story || "").split("\n\n").filter(Boolean);

  usePageMeta({
    title: `${siteName} - Blog Kuliner Indonesia`,
    description: settings?.hero_subtitle || "Kumpulan artikel kuliner terbaru.",
    canonical: "http://localhost:4173/",
  });

  return (
    <>

      <section className="bg-blue-light/30">
        <div className="container mx-auto grid min-h-[420px] grid-cols-1 items-center gap-10 px-4 py-16 lg:grid-cols-2 lg:py-20">
          <div>
            <p className="font-body text-sm font-semibold uppercase tracking-wide text-green-dark">
              {settings?.hero_eyebrow || "\u00A0"}
            </p>
            <h1 className="max-w-xl pt-3 font-body text-4xl font-bold text-primary md:text-5xl">
              {settings?.hero_title || "Selamat datang"}
            </h1>
            <p className="max-w-md pt-4 font-body text-lg font-light text-primary">
              {settings?.hero_subtitle || "\u00A0"}
            </p>
          </div>
          <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-grey-lighter">
            {settings?.hero_image && (
              <img
                src={settings.hero_image}
                alt={settings.hero_title || siteName}
                width="600"
                height="450"
                loading="eager"
                fetchpriority="high"
                decoding="sync"
                className="h-full w-full object-cover"
              />
            )}
          </div>
        </div>
      </section>

      <section className="container mx-auto min-h-[120px] px-4 py-14">
        {storyParagraphs.length > 0 && (
          <>
            <h2 className="pb-5 font-body text-2xl font-semibold text-primary">My Story</h2>
            <div className="max-w-2xl space-y-4">
              {storyParagraphs.map((p, i) => (
                <p key={i} className="font-body font-light text-primary">{p}</p>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="container mx-auto px-4 py-14">
        <h2 className="pb-8 font-body text-2xl font-semibold text-primary">Artikel Terbaru</h2>

        {loading && (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-grey-lighter">
                <div className="aspect-[16/9] bg-grey-lighter" />
                <div className="space-y-2 p-5">
                  <div className="h-4 w-16 rounded bg-grey-lighter" />
                  <div className="h-5 w-3/4 rounded bg-grey-lighter" />
                  <div className="h-4 w-full rounded bg-grey-lighter" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && posts.length === 0 && (
          <p className="font-body text-primary">Belum ada artikel. Yuk mulai tulis cerita kuliner pertama.</p>
        )}

        {!loading && posts.length > 0 && (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <article
                key={post.id}
                className="group overflow-hidden rounded-xl border border-grey-lighter bg-white shadow-sm transition-shadow hover:shadow-lg"
              >
                {post.cover_image && (
                  <div className="aspect-[16/9] overflow-hidden bg-grey-lighter">
                    <img
                      src={post.cover_image}
                      alt={post.title}
                      width="400"
                      height="220"
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="p-5">
                  {post.category && (
                    <span className={`inline-block rounded-full px-3 py-1 font-body text-xs font-semibold ${categoryStyle[post.category] || "bg-green-dark text-white"}`}>
                      {post.category}
                    </span>
                  )}
                  <h3 className="pt-3 font-body text-lg font-semibold text-primary">
                    <Link to={`/post/${post.slug}`} className="transition-colors hover:text-secondary">
                      {post.title}
                    </Link>
                  </h3>
                  {post.excerpt && (
                    <p className="pt-2 font-body text-sm font-light text-primary">{post.excerpt}</p>
                  )}
                  <time dateTime={post.created_at} className="mt-4 block font-body text-xs text-gray-500">
                    {new Date(post.created_at).toLocaleDateString("id-ID")}
                  </time>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}


