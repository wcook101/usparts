import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogPostBody, BlogPostCard } from "@/components/BlogPostContent";
import {
  getAllBlogPosts,
  getBlogPostBySlug,
  getBlogPostsByCategory,
} from "@/lib/blog/posts";
import { blogArticleMetadata } from "@/lib/seo/page-metadata";
import { getSiteUrl } from "@/lib/site";

type BlogArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAllBlogPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: BlogArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    return {
      title: { absolute: "Article Not Found - Electronics Resale Blog" },
    };
  }

  return blogArticleMetadata({
    title: post.title,
    description: post.description,
    publishedAt: post.publishedAt,
  });
}

export default async function BlogArticlePage({ params }: BlogArticlePageProps) {
  const { slug } = await params;
  const post = getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const siteUrl = getSiteUrl();
  const relatedPosts = getBlogPostsByCategory(post.category)
    .filter((related) => related.slug !== post.slug)
    .slice(0, 3);
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    author: {
      "@type": "Organization",
      name: "USParts",
    },
    publisher: {
      "@type": "Organization",
      name: "USParts",
    },
    mainEntityOfPage: `${siteUrl}/blog/${post.slug}`,
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />

      <Link
        href="/blog"
        className="text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        ← Back to resources
      </Link>

      <header className="mt-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
          {post.category}
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {post.title}
        </h1>
        <p className="mt-4 text-base leading-8 text-slate-600">{post.description}</p>
      </header>

      <div className="mt-10">
        <BlogPostBody post={post} />
      </div>

      {relatedPosts.length > 0 ? (
        <section className="mt-16 border-t border-slate-200 pt-10">
          <h2 className="text-lg font-semibold text-slate-900">
            More in {post.category}
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {relatedPosts.map((related) => (
              <BlogPostCard key={related.slug} post={related} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
