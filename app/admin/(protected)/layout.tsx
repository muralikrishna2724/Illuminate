import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { requireAdminPage } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

/** Server-side gate: every page below this layout requires a valid admin session. */
export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminPage();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[#080707]/90 backdrop-blur">
        <div className="mx-auto flex max-w-[90rem] flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-4">
            <Link href="/admin/dashboard" className="flex items-baseline gap-2">
              <span className="font-display text-2xl text-flare">Illuminate</span>
              <span className="text-xs text-smoke">Admin</span>
            </Link>
            <div className="flex items-center gap-2 lg:hidden">
              <span className="hidden text-sm text-mist sm:inline">{admin.name}</span>
              <LogoutButton />
            </div>
          </div>
          <AdminNav />
          <div className="hidden items-center gap-3 lg:flex">
            <span className="text-sm text-mist" title={admin.email}>
              {admin.name}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-[90rem] px-4 pb-24 pt-8 sm:px-6">
        {children}
      </main>
    </>
  );
}
