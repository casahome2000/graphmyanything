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
          className="flex flex-wrap gap-6 text-sm text-[#8b8b9e]"
          aria-label="Footer"
        >
          <a href="#waitlist" className="hover:text-[#f4f4f7]">
            Waitlist
          </a>
          <a href="#tools" className="hover:text-[#f4f4f7]">
            MCP tools
          </a>
          <a href="#pricing" className="hover:text-[#f4f4f7]">
            Pricing
          </a>
          <Link
            href="https://graphmyanything.com"
            className="hover:text-[#f4f4f7]"
          >
            graphmyanything.com
          </Link>
        </nav>
        <p className="text-xs text-[#8b8b9e]">
          © {COPYRIGHT_YEAR} GraphMyAnything
        </p>
      </div>
    </footer>
  );
}