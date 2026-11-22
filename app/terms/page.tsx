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
  title: "Terms of Service",
  description:
    "Terms for using GraphMyAnything before launch, including founding preorder refunds.",
  alternates: { canonical: "https://graphmyanything.com/terms" },
};

export default function TermsPage() {
  const { operator, operatorLocation, dba, contactEmail, effectiveDate } =
    LEGAL_META;

  return (
    <LegalPageLayout title="Terms of Service" eyebrow={dba}>
      <p className="text-sm leading-relaxed text-[#8b8b9e]">
        Effective {effectiveDate}. These terms are a plain-English agreement between
        you and {operator} ({operatorLocation}), doing business as {dba}
        (&quot;GraphMyAnything,&quot; &quot;we,&quot; or &quot;us&quot;), for our
        pre-launch website, waitlist, and founding preorder. By using the site or
        placing a preorder, you agree to these terms.
      </p>

      <section className={legalSectionClass}>
        <h2 className={legalHeadingClass}>Pre-launch product</h2>
        <div className={legalBodyClass}>
          <p>
            GraphMyAnything is in pre-launch. Features described on the site may
            change, and access is not guaranteed on any specific date. The waitlist
            does not obligate you to purchase; it helps us notify you about launch.
          </p>
        </div>
      </section>

      <section className={legalSectionClass}>
        <h2 className={legalHeadingClass}>Founding preorder ($49)</h2>
        <div className={legalBodyClass}>
          <p>
            The founding preorder is a one-time $49 payment processed through Stripe
            checkout. It reserves early-access benefits described at purchase time.
            It is not a subscription.
          </p>
        </div>
      </section>

      <section className={legalSectionClass}>
        <h2 className={legalHeadingClass}>Refund policy</h2>
        <div className={legalBodyClass}>
          <p>
            <strong className="font-medium text-[#f4f4f7]">Full refund before launch.</strong>{" "}
            You may request a full refund at any time before public launch by
            emailing{" "}
            <a href={`mailto:${contactEmail}`} className={legalLinkClass}>
              {contactEmail}
            </a>{" "}
            from the email used at checkout (or with enough detail for us to locate
            your order). We will process eligible refunds through Stripe.
          </p>
          <p>
            <strong className="font-medium text-[#f4f4f7]">If we do not launch.</strong>{" "}
            If GraphMyAnything does not launch as a generally available product, we
            will refund founding preorders automatically or upon your request—your
            choice of a full refund in either case.
          </p>
          <p>
            After public launch, preorder refund terms may change; we will honor the
            refund promise that applied when you paid until launch occurs.
          </p>
        </div>
      </section>

      <section className={legalSectionClass}>
        <h2 className={legalHeadingClass}>Acceptable use</h2>
        <div className={legalBodyClass}>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              Do not break the law, harass others, or attempt unauthorized access
              to our systems.
            </li>
            <li>
              Do not scrape, overload, or interfere with the site or waitlist in
              ways that harm other users.
            </li>
            <li>
              Do not misrepresent your affiliation with GraphMyAnything or use our
              marks without permission.
            </li>
            <li>
              Provide accurate contact information on the waitlist and at checkout.
            </li>
          </ul>
          <p>
            We may suspend or remove access if you violate these rules or if we must
            do so to protect the service or comply with law.
          </p>
        </div>
      </section>

      <section className={legalSectionClass}>
        <h2 className={legalHeadingClass}>Disclaimers</h2>
        <div className={legalBodyClass}>
          <p>
            THE SITE AND PRE-LAUNCH MATERIALS ARE PROVIDED &quot;AS IS&quot; AND
            &quot;AS AVAILABLE.&quot; TO THE FULLEST EXTENT PERMITTED BY LAW, WE
            DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY,
            FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. We do not
            warrant uninterrupted or error-free operation, or that the product will
            meet every expectation.
          </p>
        </div>
      </section>

      <section className={legalSectionClass}>
        <h2 className={legalHeadingClass}>Limitation of liability</h2>
        <div className={legalBodyClass}>
          <p>
            TO THE FULLEST EXTENT PERMITTED BY LAW, GRAPHMYANYTHING AND{" "}
            {operator.toUpperCase()} WILL NOT BE LIABLE FOR ANY INDIRECT,
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF
            PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF THE SITE OR
            PREORDER. OUR TOTAL LIABILITY FOR ANY CLAIM RELATING TO THESE TERMS OR
            THE PRE-LAUNCH SERVICE WILL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU
            PAID US FOR A FOUNDING PREORDER IN THE TWELVE MONTHS BEFORE THE CLAIM OR
            (B) USD $50.
          </p>
          <p>
            Some jurisdictions do not allow certain limitations; in those cases our
            liability is limited to the maximum permitted by law.
          </p>
        </div>
      </section>

      <section className={legalSectionClass}>
        <h2 className={legalHeadingClass}>Governing law</h2>
        <div className={legalBodyClass}>
          <p>
            These terms are governed by the laws of the State of Texas, USA, without
            regard to conflict-of-law rules. Disputes will be brought in the state or
            federal courts located in Texas, and you consent to that venue, except
            where prohibited.
          </p>
        </div>
      </section>

      <section className={legalSectionClass}>
        <h2 className={legalHeadingClass}>Changes</h2>
        <div className={legalBodyClass}>
          <p>
            We may update these terms as we approach launch. The effective date at
            the top will change when we do. Continued use of the site after updates
            means you accept the revised terms. For material changes affecting
            preorders, we will use reasonable efforts to notify you.
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
            <Link href="/privacy" className={legalLinkClass}>
              Privacy Policy
            </Link>
            {" · "}
            <Link href="/support" className={legalLinkClass}>
              Support
            </Link>
          </p>
        </div>
      </section>
    </LegalPageLayout>
  );
}