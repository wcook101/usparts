import Link from "next/link";
import { getLatestBlogPosts } from "@/lib/blog/posts";

export function GuidesPromoSection() {
  const posts = getLatestBlogPosts(4);

  return (
    <section className="border-b border-slate-200 bg-blue-50/60">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
              Blog & guides
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">
              Free guides for BOM search, pricing, and selling parts
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
              Step-by-step articles on MPN lookup, bulk BOM upload, supplier
              quotes, surplus inventory, and electronic component sourcing.
            </p>
          </div>
          <Link
            href="/blog"
            className="inline-flex w-fit rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            View all guides
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex h-full flex-col rounded-2xl border border-blue-100 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                {post.category}
              </p>
              <h3 className="mt-3 flex-1 text-base font-semibold leading-6 text-slate-900 group-hover:text-blue-700">
                {post.title}
              </h3>
              <p className="mt-3 text-sm text-blue-600">Read guide →</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
