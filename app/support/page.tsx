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
  title: "Support",
  description:
    "Contact GraphMyAnything support, preorder refunds, and quick links to product FAQs.",
  alternates: { canonical: "https://graphmyanything.com/support" },
};

const faqLinks = [
  {
    href: "/#faq",
    label: "Product FAQ on the homepage",
    detail: "Memory vs text tools, chart URLs, and launch timing.",
  },
  {
    href: "/#pricing",
    label: "Founding preorder & pricing",
    detail: "One-time $49, fully refundable until launch.",
  },
  {
    href: "/#tools",
    label: "MCP tools overview",
    detail: "Track, query, and chart capabilities for agents.",
  },
  {
    href: "/terms",
    label: "Refund policy (Terms of Service)",
    detail: "Full legal wording for pre-launch refunds.",
  },
  {
    href: "/privacy",
    label: "Privacy Policy",
    detail: "What we collect on the waitlist and at checkout.",
  },
];

export default function SupportPage() {
  const { contactEmail, dba } = LEGAL_META;

  return (
    <LegalPageLayout title="Support" eyebrow={dba}>
      <p className="text-sm leading-relaxed text-[#8b8b9e]">
        We are a small pre-launch team. The fastest way to reach us is email—we
        typically respond within two business days.
      </p>

      <section className={legalSectionClass}>
        <h2 className={legalHeadingClass}>Contact</h2>
        <div className={legalBodyClass}>
          <p>
            Email{" "}
            <a href={`mailto:${contactEmail}`} className={legalLinkClass}>
              {contactEmail}
            </a>
            . Include your waitlist email or Stripe receipt email if your question
            is about signup, preorder status, or a refund.
          </p>
        </div>
      </section>

      <section className={legalSectionClass}>
        <h2 className={legalHeadingClass}>Founding preorder refund</h2>
        <div className={legalBodyClass}>
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              Send a message to{" "}
              <a href={`mailto:${contactEmail}`} className={legalLinkClass}>
                {contactEmail}
              </a>{" "}
              with the subject line &quot;Preorder refund&quot;.
            </li>
            <li>
              Include the email you used at Stripe checkout (or your receipt
              reference).
            </li>
            <li>
              We confirm and process a full refund before launch. No forms or
              portals required.
            </li>
          </ol>
          <p>
            If we cancel or fail to launch the product, preorders are refunded as
            described in our{" "}
            <Link href="/terms" className={legalLinkClass}>
              Terms of Service
            </Link>
            .
          </p>
        </div>
      </section>

      <section className={legalSectionClass}>
        <h2 className={legalHeadingClass}>Quick links</h2>
        <ul className="mt-4 space-y-4">
          {faqLinks.map((item) => (
            <li
              key={item.href}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
            >
              <Link href={item.href} className={`${legalLinkClass} font-medium`}>
                {item.label}
              </Link>
              <p className="mt-1 text-xs leading-relaxed text-[#8b8b9e]">
                {item.detail}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </LegalPageLayout>
  );
}