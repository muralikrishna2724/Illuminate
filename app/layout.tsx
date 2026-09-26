import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import "./globals.css";

// Display: an expressive, human grotesque (normal width — not condensed) with optical sizing.
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-bricolage",
  display: "swap",
});

// Text: highly legible at small sizes (forms, admin tables).
const sans = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ILLUMINATE — 2-Day Innovation & Entrepreneurship Event · October 8–9",
    template: "%s · ILLUMINATE",
  },
  description:
    "ILLUMINATE is a 2-day college innovation, technology, entrepreneurship and creative event. Day 1: Deja Vu Hackathon, Under the Hood of AI, IPL Auction. Day 2: Illuminate — Entrepreneurship Workshop.",
  openGraph: {
    title: "ILLUMINATE — October 8–9",
    description: "A 2-day innovation & entrepreneurship event, led by the Illuminate Entrepreneurship Workshop on Day 2.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#050404",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-dvh bg-void font-sans text-sand antialiased">{children}</body>
    </html>
  );
}
