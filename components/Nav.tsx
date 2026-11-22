"use client";

import Link from "next/link";

const links = [
  { href: "#demo", label: "Demo" },
  { href: "#tools", label: "Tools" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export function Nav() {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/[0.06] glass">
      <nav
        className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6"
        aria-label="Main"
      >
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-[#f4f4f7]"
        >
          GraphMy<span className="gradient-text">Anything</span>
        </Link>
        <ul className="hidden items-center gap-8 text-sm text-[#8b8b9e] md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="transition-colors hover:text-[#f4f4f7]"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <a
          href="#waitlist"
          className="rounded-full bg-white/[0.08] px-3.5 py-1.5 text-xs font-medium text-[#f4f4f7] ring-1 ring-white/[0.1] transition hover:bg-white/[0.12] sm:text-sm sm:px-4 sm:py-2"
        >
          Join waitlist
        </a>
      </nav>
    </header>
  );
}