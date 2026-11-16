"use client";

import { useState } from "react";
import { blogCategories, type BlogCategory, type BlogPost } from "@/lib/blog";
import { PostCard } from "./post-card";

/** Featured post on top, then a filterable grid of the rest. */
export function BlogList({ posts }: { posts: BlogPost[] }) {
  const [cat, setCat] = useState<BlogCategory | "All">("All");
  const shown = cat === "All" ? posts : posts.filter((p) => p.category === cat);
  const [first, ...rest] = shown;

  return (
    <div className="space-y-8">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0" role="group" aria-label="Filter posts">
        {(["All", ...blogCategories] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCat(c)}
            aria-pressed={cat === c}
            className={`shrink-0 whitespace-nowrap rounded-full border-2 px-5 py-2 font-display text-sm font-semibold uppercase tracking-wider transition ${cat === c ? "border-berry bg-berry text-white shadow-md" : "border-choco/10 bg-white text-choco hover:border-berry hover:text-berry"}`}
          >
            {c}
          </button>
        ))}
      </div>

      {first && <PostCard post={first} featured />}
      {rest.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((p) => <PostCard key={p.slug} post={p} />)}
        </div>
      )}
    </div>
  );
}
