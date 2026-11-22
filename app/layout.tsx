import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { AttributionCapture } from "@/components/AttributionCapture";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = "https://graphmyanything.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "GraphMyAnything — Metric memory for AI agents",
    template: "%s · GraphMyAnything",
  },
  description:
    "The place agents keep their numbers. One MCP call replaces throwaway Python—token-efficient summaries, long-term history, and live chart URLs.",
  keywords: [
    "AI agents",
    "MCP",
    "metrics",
    "time series",
    "agent memory",
    "charts",
  ],
  authors: [{ name: "GraphMyAnything" }],
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "GraphMyAnything",
    title: "GraphMyAnything — The place agents keep their numbers",
    description:
      "Metric memory for AI agents. Track, query, insight, and chart—complementary to text memory tools like Mem0 and Zep.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "GraphMyAnything — Metric memory for AI agents",
    description:
      "One call instead of throwaway Python. Your agent data gets smarter over time.",
  },
  robots: { index: true, follow: true },
  alternates: { canonical: siteUrl },
};

export const viewport: Viewport = {
  themeColor: "#06060a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased`}
      >
        <AttributionCapture />
        {children}
        <Analytics />
      </body>
    </html>
  );
}