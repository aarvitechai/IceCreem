"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { RequireAuth } from "@/components/auth/require-auth";
import { PageLoader } from "@/components/ui";

const tabs = [
  { href: "/account/orders", label: "My orders" },
  { href: "/account/bookings", label: "My event bookings" },
];

export function AccountShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <RequireAuth>
        <div className="container-page py-8">
          <Tabs />
          {children}
        </div>
      </RequireAuth>
    </Suspense>
  );
}

function Tabs() {
  const pathname = usePathname();
  return (
    <nav className="mb-6 flex gap-2">
      {tabs.map((t) => (
        <Link key={t.href} href={t.href} className={`rounded-full px-4 py-2 text-sm font-semibold ${pathname.startsWith(t.href) ? "bg-berry text-white" : "bg-white text-choco-light hover:text-berry"}`}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
