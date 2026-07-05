import Link from "next/link";
import {
  getLegalEntityDescription,
  LEGAL_ENTITY_NAME,
  SUPPORT_EMAIL,
  SUPPORT_MAILTO,
  TRADE_NAME,
} from "@/lib/site";
import { pageMetadata } from "@/lib/seo/page-metadata";

export const metadata = pageMetadata.privacy;

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
        Legal
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
        Privacy Policy
      </h1>
      <p className="mt-3 text-sm text-slate-500">Last updated: June 15, 2026</p>

      <div className="prose prose-slate mt-8 max-w-none space-y-6 text-sm leading-7 text-slate-700">
        <p>
          This Privacy Policy describes how {getLegalEntityDescription()} (&quot;
          {TRADE_NAME},&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) collects, uses, and shares
          information when you access or use the {TRADE_NAME} website and related
          services (collectively, the &quot;Service&quot;) at{" "}
          <a
            href="https://www.usparts.us"
            className="font-medium text-blue-600 hover:text-blue-700"
          >
            www.usparts.us
          </a>
          . It applies to buyers, suppliers, and visitors who interact with the
          Service.
        </p>
        <p>
          By creating an account, placing an order, requesting a quote, listing
          inventory, or otherwise using the Service, you acknowledge this Privacy
          Policy. If you do not agree, please do not use the Service.
        </p>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            1. Information we collect
          </h2>
          <p className="mt-2">
            We collect information you provide directly, information generated
            through your use of the Service, and limited technical information
            from your device.
          </p>
          <p className="mt-2 font-medium text-slate-800">Account information</p>
          <p className="mt-1">
            When you register, we collect your name (if provided), email address,
            and password (stored in hashed form). If you register a supplier
            company, we also collect company name, description, website, phone,
            business address details, and warehouse or storage location
            information you provide.
          </p>
          <p className="mt-2 font-medium text-slate-800">
            Orders, quotes, and marketplace activity
          </p>
          <p className="mt-1">
            When you place an order or request a quote, we collect the contact
            and company information you submit (such as name, email, company
            name, quantity, and notes), along with details about the listing you
            selected (part number, manufacturer, price where shown, and related
            listing data).
          </p>
          <p className="mt-2 font-medium text-slate-800">Supplier listings and imports</p>
          <p className="mt-1">
            If you list inventory, we collect part data you upload or enter
            manually, including manufacturer part numbers, descriptions,
            quantities, pricing, condition, warehouse locations, and any files
            you import (for example, CSV or spreadsheet uploads used for bulk
            inventory).
          </p>
          <p className="mt-2 font-medium text-slate-800">Team and invitations</p>
          <p className="mt-1">
            Supplier account owners may invite colleagues by email. We collect
            invitee email addresses and role assignments to manage team access.
          </p>
          <p className="mt-2 font-medium text-slate-800">Search and usage data</p>
          <p className="mt-1">
            We collect search queries, filters, and pages you view to operate
            search results, improve the Service, and maintain security. We may
            also collect log data such as IP address, browser type, referring
            pages, and timestamps.
          </p>
          <p className="mt-2 font-medium text-slate-800">Communications</p>
          <p className="mt-1">
            If you contact us at{" "}
            <a href={SUPPORT_MAILTO} className="font-medium text-blue-600 hover:text-blue-700">
              {SUPPORT_EMAIL}
            </a>
            , we collect the information you include in your message and our
            correspondence with you.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            2. How we use information
          </h2>
          <p className="mt-2">We use the information we collect to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>create and manage accounts and company profiles;</li>
            <li>
              operate the marketplace, including search, listings, orders, and
              quotes;
            </li>
            <li>
              connect buyers and suppliers by sharing relevant transaction
              details with the other party;
            </li>
            <li>
              send transactional emails, such as order confirmations, quote
              notifications, password resets, and team invitations;
            </li>
            <li>
              enforce our{" "}
              <Link href="/terms" className="font-medium text-blue-600 hover:text-blue-700">
                Terms of Service
              </Link>
              , prevent fraud and abuse, and protect the security of the Service;
            </li>
            <li>comply with legal obligations and respond to lawful requests;</li>
            <li>
              analyze and improve the Service, including troubleshooting and
              performance monitoring.
            </li>
          </ul>
          <p className="mt-2">
            We do not use your personal information to sell advertising profiles
            about you, and we do not sell personal information to third parties.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            3. How we share information
          </h2>
          <p className="mt-2">
            <span className="font-medium text-slate-800">With other users.</span>{" "}
            USParts is a marketplace. When you place an order or request a quote,
            we share your contact and request details with the relevant supplier
            so they can respond and fulfill your request. When you list parts,
            listing information (including warehouse location) is visible to
            buyers searching the Service. Supplier company contact information
            may be shown on listings and order or quote records as needed to
            complete a transaction.
          </p>
          <p className="mt-2">
            <span className="font-medium text-slate-800">Service providers.</span>{" "}
            We use trusted vendors to host the Service, operate databases, send
            email, and provide infrastructure. These providers process information
            on our behalf under contractual obligations appropriate to their role.
          </p>
          <p className="mt-2">
            <span className="font-medium text-slate-800">Legal and safety.</span>{" "}
            We may disclose information if we believe it is reasonably necessary
            to comply with law, regulation, legal process, or governmental
            request; to protect the rights, property, or safety of USParts, our
            users, or others; or to investigate fraud, security issues, or
            violations of our Terms.
          </p>
          <p className="mt-2">
            <span className="font-medium text-slate-800">Business transfers.</span>{" "}
            If USParts is involved in a merger, acquisition, financing,
            reorganization, or sale of assets, information may be transferred
            as part of that transaction, subject to standard confidentiality
            arrangements.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            4. Cookies and similar technologies
          </h2>
          <p className="mt-2">
            We use cookies and similar technologies to keep you signed in,
            remember session preferences, and secure the Service. Session
            cookies are essential for account authentication. You can control
            cookies through your browser settings, but disabling essential
            cookies may prevent you from logging in or using certain features.
          </p>
          <p className="mt-2">
            We use Microsoft Clarity to understand how visitors use the Service
            (for example, pages viewed and general interaction patterns). Clarity
            may set its own cookies and collect usage data as described in
            Microsoft&apos;s privacy documentation. We use this information to
            improve the Service, not to sell advertising profiles.
          </p>
          <p className="mt-2">
            We do not use third-party advertising cookies on the Service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">5. Data retention</h2>
          <p className="mt-2">
            We retain information for as long as needed to operate the Service,
            maintain your account, comply with legal obligations, resolve
            disputes, and enforce our agreements. Order, quote, and listing records
            may be retained to provide transaction history to buyers and
            suppliers and for legitimate business and legal purposes.
          </p>
          <p className="mt-2">
            When information is no longer needed, we take reasonable steps to
            delete or de-identify it, subject to backup systems and legal
            retention requirements.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">6. Security</h2>
          <p className="mt-2">
            We use administrative, technical, and organizational measures
            designed to protect information, including encrypted connections
            (HTTPS), hashed passwords, and access controls. No method of
            transmission or storage is completely secure, and we cannot guarantee
            absolute security.
          </p>
          <p className="mt-2">
            You are responsible for safeguarding your account credentials and
            private order or quote access links. Notify us promptly at{" "}
            <a href={SUPPORT_MAILTO} className="font-medium text-blue-600 hover:text-blue-700">
              {SUPPORT_EMAIL}
            </a>{" "}
            if you believe your account has been compromised.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            7. Your choices and rights
          </h2>
          <p className="mt-2">
            Depending on where you live, you may have rights to access, correct,
            delete, or obtain a copy of personal information we hold about you,
            or to object to or restrict certain processing. You can update some
            account and company profile information through the Service. For
            other requests, contact us at{" "}
            <a href={SUPPORT_MAILTO} className="font-medium text-blue-600 hover:text-blue-700">
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
          <p className="mt-2">
            If you are a California resident, you may have additional rights under
            the California Consumer Privacy Act (CCPA), including the right to
            know what personal information we collect, request deletion (subject
            to exceptions), and opt out of the sale of personal information. We do
            not sell personal information as defined by the CCPA.
          </p>
          <p className="mt-2">
            We may need to verify your identity before responding to a privacy
            request. We will not discriminate against you for exercising
            applicable privacy rights.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            8. Children&apos;s privacy
          </h2>
          <p className="mt-2">
            The Service is intended for business users and is not directed to
            children under 18. We do not knowingly collect personal information
            from children. If you believe a child has provided us personal
            information, contact us and we will take appropriate steps to delete
            it.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            9. International users
          </h2>
          <p className="mt-2">
            {TRADE_NAME} is operated from the United States by {LEGAL_ENTITY_NAME}.
            If you access the Service from outside the United States, you understand
            that your information may be processed and stored in the United States
            and other countries where our service providers operate, which may have
            different data protection laws than your jurisdiction.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            10. Third-party links and services
          </h2>
          <p className="mt-2">
            The Service may contain links to supplier websites, datasheets, or
            other third-party resources. We are not responsible for the privacy
            practices of those third parties. Payment, shipping, and fulfillment
            arrangements between buyers and suppliers generally occur outside
            USParts and are governed by those parties&apos; policies.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            11. Changes to this Privacy Policy
          </h2>
          <p className="mt-2">
            We may update this Privacy Policy from time to time. When we do, we
            will revise the &quot;Last updated&quot; date above. Material changes may
            also be communicated through the Service or by email where
            appropriate. Continued use after changes become effective constitutes
            acceptance of the revised Privacy Policy.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">
            12. Governing law
          </h2>
          <p className="mt-2">
            This Privacy Policy is governed by the laws of the United States and
            the Commonwealth of Pennsylvania, without regard to conflict-of-law
            principles, except where mandatory privacy laws in your jurisdiction
            provide otherwise.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">13. Contact</h2>
          <p className="mt-2">
            Questions about this Privacy Policy or how we handle your information?
            Contact {getLegalEntityDescription()} at{" "}
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
