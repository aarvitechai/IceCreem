import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { AppImage } from "@/components/ui";
import { postDate, readMinutes, type BlogPost } from "@/lib/blog";

/** Card for one post in lists. Pass featured for the big first card. */
export function PostCard({ post, featured = false }: { post: BlogPost; featured?: boolean }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={`group flex h-full overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-choco/5 transition hover:-translate-y-1 hover:shadow-xl ${featured ? "flex-col md:flex-row" : "flex-col"}`}
    >
      <div className={`relative shrink-0 overflow-hidden bg-pink-light ${featured ? "aspect-[4/3] md:aspect-auto md:w-1/2" : "aspect-[16/10]"}`}>
        <AppImage src={post.cover} alt="" sizes={featured ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 100vw, 33vw"} className="object-cover transition duration-700 group-hover:scale-110" />
        <span className="absolute left-4 top-4 rounded-full bg-sun px-3 py-1 text-xs font-bold uppercase tracking-wider text-choco">{post.category}</span>
      </div>
      <div className={`flex flex-1 flex-col gap-3 ${featured ? "p-6 sm:p-10 md:justify-center" : "p-6"}`}>
        <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-choco-light">
          <time dateTime={post.date}>{postDate(post.date)}</time>
          <span className="flex items-center gap-1"><Clock className="size-3.5" /> {readMinutes(post)} min read</span>
        </div>
        <h3 className={`font-display font-bold uppercase leading-tight tracking-wide group-hover:text-berry ${featured ? "text-3xl sm:text-4xl" : "text-xl"}`}>{post.title}</h3>
        <p className={`text-choco-light ${featured ? "text-base" : "line-clamp-3 text-sm"}`}>{post.excerpt}</p>
        <span className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-semibold uppercase tracking-wider text-berry">
          Read more <ArrowRight className="size-4 transition group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
