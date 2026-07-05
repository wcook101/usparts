import Link from "next/link";
import type { BlogPost, BlogSection } from "@/lib/blog/posts";
import { formatBlogDate } from "@/lib/blog/posts";

function BlogSectionBlock({ section }: { section: BlogSection }) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-slate-900">{section.heading}</h2>
      {section.paragraphs.map((paragraph) => (
        <p key={paragraph} className="mt-3 leading-7 text-slate-700">
          {paragraph}
        </p>
      ))}
      {section.bullets ? (
        <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-700">
          {section.bullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export function BlogPostBody({ post }: { post: BlogPost }) {
  return (
    <article>
      <div className="mb-8 flex flex-wrap items-center gap-3 text-sm text-slate-500">
        <span className="rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700">
          {post.category}
        </span>
        <span>{formatBlogDate(post.publishedAt)}</span>
        <span>{post.readTime}</span>
      </div>

      <p className="text-base leading-8 text-slate-700">{post.intro}</p>

      <div className="mt-10 space-y-10">
        {post.sections.map((section) => (
          <BlogSectionBlock key={section.heading} section={section} />
        ))}
      </div>

      <section className="mt-12 rounded-2xl border border-blue-200 bg-blue-50 p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Ready to search or list parts?
        </h2>
        <p className="mt-2 text-sm leading-7 text-slate-700">
          Use free BOM search to source components, or list your surplus inventory
          so buyers can find your MPNs on USParts.us.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/search"
            className="inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Search parts
          </Link>
          <Link
            href="/company"
            className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            List inventory
          </Link>
        </div>
      </section>
    </article>
  );
}

export function BlogPostCard({ post }: { post: BlogPost }) {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-sm transition hover:border-blue-200">
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
          {post.category}
        </span>
        <span>{post.readTime}</span>
      </div>
      <h2 className="mt-4 text-xl font-semibold text-slate-900">
        <Link href={`/blog/${post.slug}`} className="hover:text-blue-700">
          {post.title}
        </Link>
      </h2>
      <p className="mt-3 text-sm leading-7 text-slate-600">{post.description}</p>
      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">{formatBlogDate(post.publishedAt)}</p>
        <Link
          href={`/blog/${post.slug}`}
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Read article
        </Link>
      </div>
    </article>
  );
}
