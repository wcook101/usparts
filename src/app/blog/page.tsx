import Link from "next/link";
import { BlogPostCard } from "@/components/BlogPostContent";
import { getAllBlogPosts } from "@/lib/blog/posts";
import { pageMetadata } from "@/lib/seo/page-metadata";

export const metadata = pageMetadata.blog;

export default function BlogPage() {
  const posts = getAllBlogPosts();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
        Resources
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        Electronics resale blog
      </h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
        Practical guides for selling surplus inventory, sourcing obsolete
        semiconductors, running BOM search, and growing traffic in the electronic
        components marketplace.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {posts.map((post) => (
          <BlogPostCard key={post.slug} post={post} />
        ))}
      </div>

      <section className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Put the guides to work
        </h2>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          Search MPNs and BOMs for free, or register as a supplier and publish your
          available stock on USParts.us.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/search?mode=bulk"
            className="inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Try BOM search
          </Link>
          <Link
            href="/company/upload"
            className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Upload inventory
          </Link>
        </div>
      </section>
    </div>
  );
}
