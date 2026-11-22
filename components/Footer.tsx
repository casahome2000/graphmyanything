import Link from "next/link";

const COPYRIGHT_YEAR = 2026;

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 sm:flex-row sm:items-center sm:px-6">
        <div>
          <p className="text-sm font-semibold">
            GraphMy<span className="gradient-text">Anything</span>
          </p>
          <p className="mt-1 text-xs text-[#8b8b9e]">
            Metric memory for AI agents
          </p>
        </div>
        <nav
          className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-[#8b8b9e]"
          aria-label="Footer"
        >
          <Link href="/#waitlist" className="hover:text-[#f4f4f7]">
            Waitlist
          </Link>
          <Link href="/#tools" className="hover:text-[#f4f4f7]">
            MCP tools
          </Link>
          <Link href="/#pricing" className="hover:text-[#f4f4f7]">
            Pricing
          </Link>
          <Link href="/support" className="hover:text-[#f4f4f7]">
            Support
          </Link>
          <Link href="/privacy" className="hover:text-[#f4f4f7]">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-[#f4f4f7]">
            Terms
          </Link>
          <Link href="/docs" className="hover:text-[#f4f4f7]">
            Docs
          </Link>
        </nav>
        <p className="text-xs text-[#8b8b9e]">
          © {COPYRIGHT_YEAR} GraphMyAnything
        </p>
      </div>
    </footer>
  );
}