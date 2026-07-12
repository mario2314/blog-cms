import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { usePageMeta } from "../hooks/usePageMeta.js";
import { getPost } from "../api.js";

export default function PostDetail() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    getPost(slug).then(setPost).catch(() => setNotFound(true));
  }, [slug]);

  usePageMeta({
    title: post ? `${post.title} - Rasa Nusantara` : "Rasa Nusantara",
    description: post?.excerpt || post?.title,
  });

  if (notFound) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="font-body text-primary">Artikel tidak ditemukan. <Link to="/" className="text-secondary hover:underline">Kembali ke beranda</Link></p>
      </div>
    );
  }
  if (!post) return <div className="container mx-auto px-4 py-16 font-body text-primary">Memuat…</div>;

  return (
    <>
      <article className="container mx-auto max-w-3xl px-4 py-14">
        {post.category && <span className="inline-block rounded-full bg-secondary px-3 py-1 font-body text-xs font-semibold text-white">{post.category}</span>}
        <h1 className="pt-4 font-body text-3xl font-bold text-primary md:text-4xl">{post.title}</h1>
        <time dateTime={post.created_at} className="mt-3 block font-body text-sm text-gray-500">
          {new Date(post.created_at).toLocaleDateString("id-ID")}
        </time>
        {post.cover_image && <img src={post.cover_image} alt={post.title} width="800" height="400" className="mt-6 w-full rounded-xl object-cover" />}
        <div className="prose prose-headings:font-body prose-p:font-body prose-p:font-light max-w-none pt-8" dangerouslySetInnerHTML={{ __html: post.content }} />
      </article>
      <div className="container mx-auto max-w-3xl px-4 pb-14">
        <Link to="/" className="font-body text-sm text-secondary hover:underline">&larr; Kembali ke beranda</Link>
      </div>
    </>
  );
}
