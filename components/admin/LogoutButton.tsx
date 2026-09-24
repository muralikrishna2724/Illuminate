"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminApi } from "@/lib/api/admin";
import { Spinner } from "@/components/ui/Button";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  return (
    <button
      type="button"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        await adminApi.logout();
        router.replace("/admin/login");
        router.refresh();
      }}
      className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-mist hover:bg-white/5 hover:text-flare disabled:opacity-50"
    >
      {loading && <Spinner className="h-3.5 w-3.5" />}
      Sign out
    </button>
  );
}
