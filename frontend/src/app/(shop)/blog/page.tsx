import type { Metadata } from "next";
import { BlogList } from "@/components/blog/blog-list";
import { PageBanner } from "@/components/layout/page-banner";
import { brand } from "@/lib/brand";
import { posts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog",
  description: `Tips, event ideas and stories from the ${brand.name} kitchen.`,
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  return (
    <>
      <PageBanner title="The scoop" text="Tips, event ideas and stories from our kitchen." />
      <div className="container-page py-10">
        <BlogList posts={posts} />
      </div>
    </>
  );
}
