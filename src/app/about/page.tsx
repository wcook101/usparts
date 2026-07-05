import Link from "next/link";
import {
  getLegalEntityDescription,
  LEGAL_ENTITY_NAME,
  SUPPORT_EMAIL,
  TRADE_NAME,
} from "@/lib/site";
import { pageMetadata } from "@/lib/seo/page-metadata";

export const metadata = pageMetadata.about;

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
        About {TRADE_NAME}
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
        A free electronics parts marketplace
      </h1>
      <p className="mt-4 text-sm leading-7 text-slate-600">
        {TRADE_NAME} connects buyers and suppliers of electronic components across
        the United States. Search by manufacturer part number, upload a BOM, compare
        supplier inventory, request quotes, or list your own surplus stock — all for
        free.
      </p>

      <div className="mt-10 space-y-8 text-sm leading-7 text-slate-700">
        <section>
          <h2 className="text-lg font-semibold text-slate-900">What we do</h2>
          <p className="mt-2">
            Buyers use {TRADE_NAME} to find semiconductors, ICs, connectors, and
            other electronic parts from registered US suppliers. Suppliers publish
            inventory by MPN so procurement teams can discover available stock,
            pricing, and lead times without paying listing fees.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Who operates USParts</h2>
          <p className="mt-2">{getLegalEntityDescription()}.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Get started</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              <Link href="/search" className="font-medium text-blue-600 hover:text-blue-700">
                Search electronic components
              </Link>
            </li>
            <li>
              <Link href="/company" className="font-medium text-blue-600 hover:text-blue-700">
                Sell your electronics inventory
              </Link>
            </li>
            <li>
              <Link href="/help#contact" className="font-medium text-blue-600 hover:text-blue-700">
                Contact us
              </Link>{" "}
              at {SUPPORT_EMAIL}
            </li>
          </ul>
        </section>
      </div>

      <p className="mt-10 text-xs text-slate-500">
        © {new Date().getFullYear()} {LEGAL_ENTITY_NAME}. {TRADE_NAME} is a trade
        name of {LEGAL_ENTITY_NAME}.
      </p>
    </div>
  );
}
