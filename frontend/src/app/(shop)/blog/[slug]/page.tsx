import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock, Lightbulb } from "lucide-react";
import { PostCard } from "@/components/blog/post-card";
import { ShareButtons } from "@/components/share/share-buttons";
import { AppImage } from "@/components/ui";
import { brand, whatsappLink } from "@/lib/brand";
import { postBySlug, postDate, posts, readMinutes, type Block } from "@/lib/blog";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = postBySlug((await params).slug);
  if (!post) return { title: "Post not found" };
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { type: "article", title: post.title, description: post.excerpt, publishedTime: post.date },
  };
}

export default async function PostPage({ params }: Props) {
  const post = postBySlug((await params).slug);
  if (!post) notFound();

  const related = [...posts.filter((p) => p.slug !== post.slug && p.category === post.category), ...posts.filter((p) => p.slug !== post.slug && p.category !== post.category)].slice(0, 3);

  // Lets search engines show the post as an article.
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    image: `${brand.siteUrl}${post.cover}`,
    author: { "@type": "Organization", name: brand.name },
    publisher: { "@type": "Organization", name: brand.name },
    mainEntityOfPage: `${brand.siteUrl}/blog/${post.slug}`,
  };

  return (
    <article className="pb-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />

      <header className="relative overflow-hidden bg-gradient-to-br from-berry to-pink text-white">
        <span aria-hidden className="absolute -left-16 -top-16 size-64 rounded-full bg-white/10" />
        <span aria-hidden className="absolute -bottom-24 right-10 size-72 rounded-full bg-sun/25" />
        <div className="container-page relative max-w-4xl py-10 text-center sm:py-14">
          <Link href="/blog" className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-white/85 hover:text-white">
            <ArrowLeft className="size-4" /> All posts
          </Link>
          <div className="mt-4"><span className="rounded-full bg-sun px-3 py-1 text-xs font-bold uppercase tracking-wider text-choco">{post.category}</span></div>
          <h1 className="mt-4 font-display text-4xl font-bold uppercase leading-[1.05] tracking-wide sm:text-6xl">{post.title}</h1>
          <div className="mt-4 flex items-center justify-center gap-4 text-sm text-white/90">
            <time dateTime={post.date}>{postDate(post.date)}</time>
            <span className="flex items-center gap-1"><Clock className="size-4" /> {readMinutes(post)} min read</span>
          </div>
        </div>
      </header>

      <div className="container-page max-w-3xl">
        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-[2rem] bg-pink-light shadow-xl ring-8 ring-white">
          <AppImage src={post.cover} alt="" priority sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />
        </div>

        <p className="mt-8 text-xl font-medium leading-relaxed text-choco">{post.excerpt}</p>
        <span className="wave mt-4 block" aria-hidden />

        <div className="mt-6 space-y-5 text-[17px] leading-relaxed text-choco/90">
          {post.body.map((b, i) => <BlockView key={i} block={b} />)}
        </div>

        <div className="mt-10 flex flex-col items-center gap-4 rounded-[2rem] bg-choco p-6 text-center text-cream sm:flex-row sm:justify-between sm:p-8 sm:text-left">
          <div>
            <p className="font-display text-2xl font-bold uppercase tracking-wide">Feeling hungry?</p>
            <p className="text-sm text-cream/75">Questions? WhatsApp {brand.owner} on {brand.phoneDisplay}.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href={post.cta.href} className="btn-primary">{post.cta.label} <ArrowRight className="size-4" /></Link>
            <a href={whatsappLink()} target="_blank" rel="noreferrer" className="btn bg-[#25d366] text-white hover:brightness-95">WhatsApp</a>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <ShareButtons path={`/blog/${post.slug}`} title={post.title} text={post.excerpt} />
        </div>
      </div>

      {related.length > 0 && (
        <section className="container-page mt-16">
          <div className="mb-8 flex flex-col items-center gap-2 text-center">
            <h2 className="section-title">Keep reading</h2>
            <span className="wave" aria-hidden />
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => <PostCard key={p.slug} post={p} />)}
          </div>
        </section>
      )}
    </article>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "h":
      return <h2 className="pt-4 font-display text-2xl font-bold uppercase tracking-wide text-choco">{block.text}</h2>;
    case "list":
      return (
        <ul className="space-y-2">
          {block.items.map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-2.5 size-2 shrink-0 rounded-full bg-berry" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    case "tip":
      return (
        <aside className="flex gap-4 rounded-3xl bg-sun/30 p-5 ring-1 ring-sun">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-sun text-choco"><Lightbulb className="size-5" /></span>
          <div>
            <p className="font-display text-lg font-semibold uppercase tracking-wide text-choco">{block.title}</p>
            <p className="text-base">{block.text}</p>
          </div>
        </aside>
      );
    default:
      return <p>{block.text}</p>;
  }
}
