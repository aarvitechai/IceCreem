"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { PageLoader } from "@/components/ui";
import type { UserRole } from "@/lib/types";
import { useAppSelector } from "@/store/store";

/**
 * Client side guard for a better experience. The API enforces the real rules on every call.
 * Shows a loader while the session is restored, sends guests to login, and blocks wrong roles.
 */
export function RequireAuth({ roles, children }: { roles?: UserRole[]; children: React.ReactNode }) {
  const { user, status } = useAppSelector((s) => s.auth);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "ready" && !user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [status, user, router, pathname]);

  if (status === "checking" || !user) return <PageLoader />;

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="text-2xl font-bold">No access</h1>
        <p className="mt-2 text-choco-light">Your account does not have permission to open this page.</p>
        <Link href="/" className="btn-primary mt-6">Go home</Link>
      </div>
    );
  }

  return <>{children}</>;
}
