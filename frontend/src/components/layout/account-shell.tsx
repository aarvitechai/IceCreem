"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { CalendarHeart, Package } from "lucide-react";
import { RequireAuth } from "@/components/auth/require-auth";
import { PageBanner } from "@/components/layout/page-banner";
import { PageLoader } from "@/components/ui";
import { useAppSelector } from "@/store/store";

const tabs = [
  { href: "/account/orders", label: "My orders", icon: Package },
  { href: "/account/bookings", label: "Event bookings", icon: CalendarHeart },
];

export function AccountShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <RequireAuth>
        <Greeting />
        <div className="container-page py-8">
          <Tabs />
          {children}
        </div>
      </RequireAuth>
    </Suspense>
  );
}

function Greeting() {
  const name = useAppSelector((s) => s.auth.user?.fullName.split(" ")[0]);
  return <PageBanner title={name ? `Hi, ${name}` : "My account"} text="Your orders, event bookings and live tracking in one place." />;
}

function Tabs() {
  const pathname = usePathname();
  return (
    <nav className="mb-8 flex justify-center gap-2">
      {tabs.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={`flex items-center gap-2 rounded-full border-2 px-5 py-2 font-display text-sm font-semibold uppercase tracking-wider transition ${pathname.startsWith(href) ? "border-berry bg-berry text-white shadow-md" : "border-choco/10 bg-white text-choco hover:border-berry hover:text-berry"}`}
        >
          <Icon className="size-4" /> {label}
        </Link>
      ))}
    </nav>
  );
}
