import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · ILLUMINATE Admin" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-[#080707] text-sand">{children}</div>;
}
