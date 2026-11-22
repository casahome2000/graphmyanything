import type { ReactNode } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";

type LegalPageLayoutProps = {
  title: string;
  eyebrow?: string;
  children: ReactNode;
};

export function LegalPageLayout({
  title,
  eyebrow,
  children,
}: LegalPageLayoutProps) {
  return (
    <>
      <Nav />
      <main className="mesh-bg relative min-h-[calc(100vh-12rem)] overflow-hidden pt-14">
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-[320px] w-[560px] -translate-x-1/2 rounded-full bg-violet-600/15 blur-[100px]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-20">
          <header className="mb-12">
            {eyebrow ? (
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#8b8b9e]">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#f4f4f7] sm:text-4xl">
              {title}
            </h1>
            <div
              className="mt-6 h-px w-full max-w-xs bg-gradient-to-r from-violet-500/80 via-cyan-400/60 to-emerald-400/40"
              aria-hidden
            />
          </header>
          <article className="gradient-border rounded-2xl bg-[#0c0c12]/80 p-6 sm:p-10">
            {children}
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}