import Link from "next/link";
import {
  getLegalEntityDescription,
  LEGAL_ENTITY_NAME,
  SUPPORT_EMAIL,
  SUPPORT_MAILTO,
  TRADE_NAME,
} from "@/lib/site";

export const metadata = {
  title: "Terms of Service",
  description:
    "Terms of service for using USParts.us to search electronic components, list supplier inventory, request quotes, and access our free MPN and BOM search tools.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
        Legal
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
        Terms of Service
      </h1>
      <p className="mt-3 text-sm text-slate-500">Last updated: June 15, 2026</p>

      <div className="prose prose-slate mt-8 max-w-none space-y-6 text-sm leading-7 text-slate-700">
        <p>
          These Terms of Service (&quot;Terms&quot;) govern your access to and use of the
          {TRADE_NAME} website and related services (collectively, the
          &quot;Service&quot;) at{" "}
          <a href="https://www.usparts.us" className="font-medium text-blue-600 hover:text-blue-700">
            www.usparts.us
          </a>
          . The Service is operated by {getLegalEntityDescription()} (&quot;
          {TRADE_NAME},&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). By creating an account,
          placing an order, requesting a quote, listing inventory, or otherwise
          using the Service, you agree to these Terms. If you do not agree, do not
          use the Service.
        </p>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">1. About USParts</h2>
          <p className="mt-2">
            {TRADE_NAME} is the trade name used by {LEGAL_ENTITY_NAME} to operate an
            online marketplace that helps buyers discover electronic components and
            helps suppliers publish available inventory. We prioritize listings for
            parts located in the United States, but we do not guarantee the
            location, condition, authenticity, or availability of any part listed on
            the Service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            2. Marketplace role
          </h2>
          <p className="mt-2">
            USParts is a platform provider, not a buyer, seller, distributor, or
            broker of electronic components. Unless we state otherwise in writing,
            USParts is not a party to any transaction, negotiation, quote, or
            order between a buyer and a supplier. Suppliers and buyers contract
            directly with each other regarding price, payment, shipping, returns,
            warranties, export compliance, and fulfillment.
          </p>
          <p className="mt-2">
            The Service may facilitate discovery, communication, order requests,
            and quote requests. It does not process payments between buyers and
            suppliers unless we explicitly add that feature and disclose it to
            you.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">3. Eligibility</h2>
          <p className="mt-2">
            You must be at least 18 years old and able to form a binding contract
            to use the Service. If you use the Service on behalf of a company or
            other organization, you represent that you have authority to bind
            that organization to these Terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            4. Accounts and security
          </h2>
          <p className="mt-2">
            You are responsible for maintaining the confidentiality of your login
            credentials and for all activity that occurs under your account. You
            must provide accurate, current information when registering and keep
            your profile up to date.
          </p>
          <p className="mt-2">
            Supplier accounts must use legitimate company information. Company team
            invites may only be sent to email addresses on the supplier&apos;s
            approved company domain. You may not share accounts, impersonate
            another person or business, or create accounts for fraudulent or
            misleading purposes.
          </p>
          <p className="mt-2">
            Notify us promptly at{" "}
            <a href={SUPPORT_MAILTO} className="font-medium text-blue-600 hover:text-blue-700">
              {SUPPORT_EMAIL}
            </a>{" "}
            if you believe your account has been compromised.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            5. Supplier responsibilities
          </h2>
          <p className="mt-2">
            If you list inventory on USParts, you represent that you have the
            right to offer the listed parts and that your listings are accurate to
            the best of your knowledge, including manufacturer part numbers,
            descriptions, quantities, condition, pricing (where shown), lead
            times, and location information.
          </p>
          <p className="mt-2">
            You are solely responsible for responding to orders and quote requests,
            confirming availability, fulfilling transactions, complying with
            applicable laws (including export controls, anti-counterfeiting rules,
            and product safety requirements), and resolving disputes with buyers.
            You must not list counterfeit, stolen, restricted, or misrepresented
            parts.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            6. Buyer responsibilities
          </h2>
          <p className="mt-2">
            Buyers are responsible for verifying that any part is suitable for
            their application, including fit, form, function, lifecycle status,
            authenticity, and compliance requirements. A request, order, or quote
            submitted through USParts is an offer or inquiry to the supplier, not
            a confirmed purchase, unless and until the supplier accepts and
            confirms terms with you directly.
          </p>
          <p className="mt-2">
            You must provide accurate contact and company information so suppliers
            can respond to your requests.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            7. Orders, quotes, and communications
          </h2>
          <p className="mt-2">
            When you place an order or request a quote through the Service, we may
            send notifications to you and the relevant supplier. Those
            notifications are for convenience only and do not guarantee acceptance,
            pricing, stock, or delivery timelines.
          </p>
          <p className="mt-2">
            Access links for orders and quotes are intended for the parties to a
            transaction. Do not share private access links publicly. You are
            responsible for maintaining the confidentiality of links sent to you.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">8. Fees</h2>
          <p className="mt-2">
            USParts may introduce platform fees, subscription plans, or other
            charges in the future. If we do, we will provide notice before they
            apply to your account. Unless otherwise stated, use of the Service is
            currently provided without a separate platform fee to buyers.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            9. Acceptable use
          </h2>
          <p className="mt-2">You agree not to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>use the Service for unlawful, fraudulent, or abusive purposes;</li>
            <li>
              scrape, crawl, or harvest data from the Service except through
              interfaces we expressly permit;
            </li>
            <li>
              interfere with or disrupt the Service, including by introducing
              malware or attempting unauthorized access;
            </li>
            <li>
              upload false, misleading, or infringing listings or content;
            </li>
            <li>
              circumvent access controls, rate limits, or security measures.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            10. Intellectual property
          </h2>
          <p className="mt-2">
            The Service, including its design, software, branding, and content
            provided by {TRADE_NAME}, is owned by {LEGAL_ENTITY_NAME} or its
            licensors and is protected by applicable intellectual property laws. You
            may not copy, modify, distribute, or create derivative works from the
            Service except as allowed by these Terms or with our prior written
            consent.
          </p>
          <p className="mt-2">
            You retain ownership of content you submit, but you grant {LEGAL_ENTITY_NAME}{" "}
            a non-exclusive license to host, display, and use that content as needed
            to operate the marketplace.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">11. Privacy</h2>
          <p className="mt-2">
            Our collection and use of personal information is described in our{" "}
            <Link href="/privacy" className="font-medium text-blue-600 hover:text-blue-700">
              Privacy Policy
            </Link>
            . By using the Service, you acknowledge that information needed to
            complete orders and quotes will be shared with the relevant supplier
            or buyer.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">12. Disclaimers</h2>
          <p className="mt-2">
            THE SERVICE IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS.
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, USPARTS DISCLAIMS ALL
            WARRANTIES, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING
            WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
            TITLE, AND NON-INFRINGEMENT.
          </p>
          <p className="mt-2">
            USParts does not warrant that listings are accurate, that parts are
            genuine, that suppliers will fulfill orders, or that the Service will
            be uninterrupted or error-free. Any reliance on listings, pricing, or
            supplier communications is at your own risk.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            13. Limitation of liability
          </h2>
          <p className="mt-2">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, USPARTS AND ITS OWNERS,
            OPERATORS, AFFILIATES, AND SUPPLIERS WILL NOT BE LIABLE FOR ANY
            INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE
            DAMAGES, OR FOR ANY LOSS OF PROFITS, REVENUE, DATA, GOODWILL, OR
            BUSINESS OPPORTUNITY, ARISING OUT OF OR RELATED TO THE SERVICE OR ANY
            TRANSACTION BETWEEN USERS.
          </p>
          <p className="mt-2">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, USPARTS&apos; TOTAL LIABILITY
            FOR ANY CLAIM ARISING OUT OF OR RELATING TO THE SERVICE WILL NOT
            EXCEED THE GREATER OF (A) ONE HUNDRED U.S. DOLLARS (US $100) OR (B)
            THE AMOUNT YOU PAID TO USPARTS FOR USE OF THE SERVICE IN THE TWELVE
            (12) MONTHS BEFORE THE EVENT GIVING RISE TO THE CLAIM.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            14. Indemnification
          </h2>
          <p className="mt-2">
            You agree to defend, indemnify, and hold harmless USParts and its
            operators from and against claims, damages, losses, and expenses
            (including reasonable attorneys&apos; fees) arising out of your use of
            the Service, your listings, your transactions with other users, or
            your violation of these Terms or applicable law.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">15. Suspension and termination</h2>
          <p className="mt-2">
            We may suspend or terminate access to the Service at any time if we
            reasonably believe you have violated these Terms, pose a risk to other
            users, or if required by law. You may stop using the Service at any
            time. Sections that by their nature should survive termination will
            survive, including marketplace disclaimers, limitations of liability,
            and indemnification.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">16. Changes to these Terms</h2>
          <p className="mt-2">
            We may update these Terms from time to time. When we do, we will revise
            the &quot;Last updated&quot; date above. Material changes may also be
            communicated through the Service or by email where appropriate.
            Continued use after changes become effective constitutes acceptance of
            the revised Terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">17. Governing law</h2>
          <p className="mt-2">
            These Terms are governed by the laws of the United States and the
            Commonwealth of Pennsylvania, without regard to conflict-of-law
            principles, except where mandatory consumer protection laws in your
            jurisdiction provide otherwise.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">18. Contact</h2>
          <p className="mt-2">
            Questions about these Terms or help using the marketplace? Contact{" "}
            {getLegalEntityDescription()} at{" "}
            <a href={SUPPORT_MAILTO} className="font-medium text-blue-600 hover:text-blue-700">
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
        </section>
      </div>

      <Link
        href="/"
        className="mt-10 inline-flex text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        Back to home
      </Link>
    </div>
  );
}
