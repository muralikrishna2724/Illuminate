import { CinematicFooter } from "@/components/layout/CinematicFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getContactConfig } from "@/lib/site-config";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <CinematicFooter contact={getContactConfig()} />
    </>
  );
}
