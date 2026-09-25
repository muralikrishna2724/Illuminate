import { CinematicFooter } from "@/components/layout/CinematicFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getViewer } from "@/lib/auth/viewer";
import { getContactConfig } from "@/lib/site-config";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  // Per-request: the header shows a profile menu instead of "Login" for signed-in visitors.
  const viewer = await getViewer();
  return (
    <>
      <SiteHeader viewer={viewer} />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <CinematicFooter
        contact={getContactConfig()}
        account={
          viewer
            ? viewer.role === "admin"
              ? { href: "/admin/dashboard", label: "Admin dashboard" }
              : { href: "/dashboard", label: "My profile" }
            : null
        }
      />
    </>
  );
}
