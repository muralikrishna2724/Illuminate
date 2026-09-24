import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { BlackHole } from "@/components/visual/BlackHole";
import { getCurrentAdmin } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Admin login" };
export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await getCurrentAdmin()) redirect("/admin/dashboard");

  return (
    <main id="main" className="relative isolate flex min-h-dvh items-center justify-center overflow-hidden px-5 py-16">
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 -z-10 w-[120vw] max-w-[760px] -translate-x-1/2 -translate-y-1/2">
        <BlackHole intensity="faint" />
      </div>
      <div className="w-full max-w-sm">
        <Link href="/" className="font-display text-3xl text-flare">
          Illuminate
        </Link>
        <h1 className="mt-8 text-2xl font-medium text-flare">Admin sign in</h1>
        <p className="mt-2 text-sm text-mist">For event organisers only.</p>
        <div className="mt-8 rounded-2xl border border-[var(--line-strong)] bg-void/80 p-6 backdrop-blur">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
