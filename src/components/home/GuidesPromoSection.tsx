import Link from "next/link";
import { getLatestBlogPosts } from "@/lib/blog/posts";

export function GuidesPromoSection() {
  const posts = getLatestBlogPosts(3);

  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#0a1628] sm:text-2xl">
              Blog & guides
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              BOM search, pricing, and selling surplus inventory.
            </p>
          </div>
          <Link
            href="/blog"
            className="text-sm font-semibold text-[#c41230] hover:underline"
          >
            View all guides →
          </Link>
        </div>

        <ul className="mt-6 divide-y divide-slate-200 border border-slate-200">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="flex flex-col gap-1 px-4 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
              >
                <span className="min-w-0">
                  <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {post.category}
                  </span>
                  <span className="mt-1 block font-semibold text-[#0a1628]">
                    {post.title}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-medium text-[#c41230]">
                  Read →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
