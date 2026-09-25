"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authApi } from "@/lib/api/auth";
import { Spinner } from "@/components/ui/Button";

export function LogoutButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  return (
    <button
      type="button"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await authApi.logout();
        router.replace("/login");
        router.refresh();
      }}
      className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-mist hover:bg-white/5 hover:text-flare disabled:opacity-50 ${className}`}
    >
      {loading && <Spinner className="h-3.5 w-3.5" />}
      Log out
    </button>
  );
}
