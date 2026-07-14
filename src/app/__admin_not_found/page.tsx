import { notFound } from "next/navigation";

/**
 * Catch-all rewrite target used by middleware when an unauthenticated visitor
 * hits /admin. Renders the normal site 404 so the admin surface stays undiscoverable.
 */
export default function AdminNotFoundRewritePage() {
  notFound();
}
