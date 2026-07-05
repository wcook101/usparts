import type { Metadata } from "next";
import Link from "next/link";
import { BlogPostCard } from "@/components/BlogPostContent";
import {
  blogCategoryOrder,
  getAllBlogPosts,
  getBlogPostsByCategory,
  getLatestBlogPosts,
  type BlogCategory,
} from "@/lib/blog/posts";
import { pageMetadata, seoDescription, seoTitle } from "@/lib/seo/page-metadata";

const categoryDescriptions: Record<BlogCategory, string> = {
  "Product Guides":
    "How to use BOM search, MPN lookup, and marketplace tools — workflows inspired by leading component search platforms.",
  Procurement:
    "Pricing, quotes, proto-BOMs, and supplier comparison for electronic component buyers.",
  Selling:
    "List surplus inventory, reach buyers, and turn excess stock into revenue.",
  Industry:
    "Shortages, allocation risk, counterfeit awareness, and supply chain trends.",
  Marketplace:
    "How free electronics marketplaces compare to brokers and traditional channels.",
};

type BlogPageProps = {
  searchParams: Promise<{ category?: string }>;
};

export async function generateMetadata({
  searchParams,
}: BlogPageProps): Promise<Metadata> {
  const { category: categoryFilter } = await searchParams;

  if (
    categoryFilter &&
    blogCategoryOrder.includes(categoryFilter as BlogCategory)
  ) {
    const category = categoryFilter as BlogCategory;
    return {
      title: seoTitle(`${category} - Electronics Parts Resources`),
      description: seoDescription(categoryDescriptions[category]),
    };
  }

  return pageMetadata.blog;
}

function CategorySection({ category }: { category: BlogCategory }) {
  const posts = getBlogPostsByCategory(category).slice(0, 3);

  if (posts.length === 0) {
    return null;
  }

  return (
    <section className="mt-14">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{category}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
            {categoryDescriptions[category]}
          </p>
        </div>
        {posts.length >= 3 ? (
          <Link
            href={`/blog?category=${encodeURIComponent(category)}`}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            View all in {category}
          </Link>
        ) : null}
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <BlogPostCard key={post.slug} post={post} />
        ))}
      </div>
    </section>
  );
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { category: categoryFilter } = await searchParams;
  const allPosts = getAllBlogPosts();
  const filteredPosts =
    categoryFilter &&
    blogCategoryOrder.includes(categoryFilter as BlogCategory)
      ? getBlogPostsByCategory(categoryFilter as BlogCategory)
      : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
        Resources
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
        Electronics parts resources
      </h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
        Product guides, procurement tips, and industry insights for teams selling
        surplus inventory and sourcing semiconductors through free BOM search.
      </p>

      <nav
        className="mt-8 flex flex-wrap gap-2"
        aria-label="Article categories"
      >
        <Link
          href="/blog"
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
            !categoryFilter
              ? "bg-blue-600 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          All
        </Link>
        {blogCategoryOrder.map((category) => (
          <Link
            key={category}
            href={`/blog?category=${encodeURIComponent(category)}`}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              categoryFilter === category
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {category}
          </Link>
        ))}
      </nav>

      {filteredPosts ? (
        <section className="mt-10">
          <h2 className="text-xl font-semibold text-slate-900">
            {categoryFilter}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
            {categoryDescriptions[categoryFilter as BlogCategory]}
          </p>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {filteredPosts.map((post) => (
              <BlogPostCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      ) : (
        <>
          <section className="mt-10">
            <h2 className="text-xl font-semibold text-slate-900">Latest</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              New guides for BOM search, pricing, and marketplace workflows.
            </p>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {getLatestBlogPosts(6).map((post) => (
                <BlogPostCard key={post.slug} post={post} />
              ))}
            </div>
          </section>

          {blogCategoryOrder.map((category) => (
            <CategorySection key={category} category={category} />
          ))}
        </>
      )}

      <section className="mt-14 rounded-2xl border border-slate-200 bg-slate-50 p-6">
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
