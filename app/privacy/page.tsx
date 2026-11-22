import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageLayout } from "@/components/LegalPageLayout";
import {
  LEGAL_META,
  legalBodyClass,
  legalHeadingClass,
  legalLinkClass,
  legalSectionClass,
} from "@/lib/legal/content";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How GraphMyAnything collects, uses, and protects waitlist and preorder information before launch.",
  alternates: { canonical: "https://graphmyanything.com/privacy" },
};

export default function PrivacyPage() {
  const { operator, operatorLocation, dba, contactEmail, effectiveDate } =
    LEGAL_META;

  return (
    <LegalPageLayout title="Privacy Policy" eyebrow={dba}>
      <p className="text-sm leading-relaxed text-[#8b8b9e]">
        Effective {effectiveDate}. {operator}, a company organized in{" "}
        {operatorLocation} doing business as {dba} (&quot;we,&quot; &quot;us,&quot;
        or &quot;GraphMyAnything&quot;), describes how we handle personal
        information for our pre-launch website, waitlist, and founding preorder.
      </p>

      <section className={legalSectionClass}>
        <h2 className={legalHeadingClass}>What we collect</h2>
        <div className={legalBodyClass}>
          <p>
            <strong className="font-medium text-[#f4f4f7]">Waitlist.</strong>{" "}
            Email address and an optional source tag (for example, which page or
            campaign you came from) when you join the waitlist.
          </p>
          <p>
            <strong className="font-medium text-[#f4f4f7]">Founding preorder.</strong>{" "}
            When you pay the one-time $49 founding preorder, payment details are
            processed by Stripe at checkout. We receive confirmation and customer
            contact information needed to fulfill refunds and preorder status—we
            do not store full card numbers on our servers.
          </p>
          <p>
            <strong className="font-medium text-[#f4f4f7]">Site analytics.</strong>{" "}
            Privacy-friendly, cookieless, aggregate page analytics (such as page
            views and referrers). We do not use advertising cookies or sell this
            data.
          </p>
          <p>
            <strong className="font-medium text-[#f4f4f7]">Communications.</strong>{" "}
            If you email us, we keep the content of that correspondence to respond
            and support you.
          </p>
        </div>
      </section>

      <section className={legalSectionClass}>
        <h2 className={legalHeadingClass}>Why we use it</h2>
        <div className={legalBodyClass}>
          <ul className="list-disc space-y-2 pl-5">
            <li>Operate the waitlist and send related product updates you expect.</li>
            <li>Process and manage founding preorders, including refunds.</li>
            <li>Improve the site using aggregate, non-identifying analytics.</li>
            <li>Protect against abuse, fraud, and security incidents.</li>
            <li>Comply with law and enforce our terms.</li>
          </ul>
        </div>
      </section>

      <section className={legalSectionClass}>
        <h2 className={legalHeadingClass}>Retention</h2>
        <div className={legalBodyClass}>
          <p>
            Waitlist email addresses are kept until you unsubscribe, ask us to
            delete them, or we shut down the product or waitlist—whichever comes
            first. Preorder records are kept as long as needed to honor refunds,
            tax, and accounting obligations. Aggregate analytics are retained in
            summary form without identifying you personally.
          </p>
        </div>
      </section>

      <section className={legalSectionClass}>
        <h2 className={legalHeadingClass}>Sharing</h2>
        <div className={legalBodyClass}>
          <p>
            We share information only with infrastructure and email service
            providers that help us run the website, store waitlist signups, send
            transactional messages, and operate our database—under contracts that
            limit use to providing services to us. Payment processing is handled
            by Stripe when you check out. We do{" "}
            <strong className="font-medium text-[#f4f4f7]">not</strong> sell your
            personal information.
          </p>
        </div>
      </section>

      <section className={legalSectionClass}>
        <h2 className={legalHeadingClass}>Your rights</h2>
        <div className={legalBodyClass}>
          <p>
            Depending on where you live, you may have rights to access, correct,
            or delete personal information we hold about you. To make a request,
            email{" "}
            <a href={`mailto:${contactEmail}`} className={legalLinkClass}>
              {contactEmail}
            </a>
            . We will verify the request and respond within a reasonable time.
          </p>
        </div>
      </section>

      <section className={legalSectionClass}>
        <h2 className={legalHeadingClass}>Security</h2>
        <div className={legalBodyClass}>
          <p>
            We use technical and organizational measures appropriate to a
            pre-launch product: encrypted connections (HTTPS), access controls on
            production systems, and minimal collection of sensitive data. No
            method of transmission or storage is perfectly secure; we work to
            reduce risk and investigate incidents promptly.
          </p>
        </div>
      </section>

      <section className={legalSectionClass}>
        <h2 className={legalHeadingClass}>Children</h2>
        <div className={legalBodyClass}>
          <p>
            GraphMyAnything is not directed to children under 13 (or the minimum
            age in your jurisdiction). We do not knowingly collect personal
            information from children. Contact us if you believe we have done so
            inadvertently.
          </p>
        </div>
      </section>

      <section className={legalSectionClass}>
        <h2 className={legalHeadingClass}>
          When the product launches (API &amp; MCP metric data)
        </h2>
        <div className={legalBodyClass}>
          <p>
            This section describes our intent for future metric storage and agent
            tooling; it will be updated before general availability.
          </p>
          <p>
            <strong className="font-medium text-[#f4f4f7]">Your data is yours.</strong>{" "}
            Metrics and time-series you send through our API or MCP tools are
            customer data. We do not claim ownership of your business metrics and
            we will not resell your raw customer data.
          </p>
          <p>
            <strong className="font-medium text-[#f4f4f7]">Benchmarks.</strong>{" "}
            Any optional aggregate industry benchmarks will be opt-in, anonymized,
            and published only in forms that cannot reasonably identify you or
            your namespaces.
          </p>
        </div>
      </section>

      <section className={legalSectionClass}>
        <h2 className={legalHeadingClass}>Changes</h2>
        <div className={legalBodyClass}>
          <p>
            We may update this policy as we approach launch. We will post the
            revised version on this page and update the effective date. Material
            changes for waitlist members may also be communicated by email where
            appropriate.
          </p>
        </div>
      </section>

      <section className={legalSectionClass}>
        <h2 className={legalHeadingClass}>Contact</h2>
        <div className={legalBodyClass}>
          <p>
            {operator} (d/b/a {dba})
            <br />
            {operatorLocation}
            <br />
            <a href={`mailto:${contactEmail}`} className={legalLinkClass}>
              {contactEmail}
            </a>
          </p>
          <p>
            See also{" "}
            <Link href="/terms" className={legalLinkClass}>
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/support" className={legalLinkClass}>
              Support
            </Link>
            .
          </p>
        </div>
      </section>
    </LegalPageLayout>
  );
}