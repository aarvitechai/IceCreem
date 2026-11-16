"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import {
  BarChart3, Boxes, CalendarHeart, ClipboardList, ExternalLink, Factory, FileClock, IceCreamCone, LayoutDashboard, LogOut, Menu, Tags, Ticket, Truck, Users, X,
} from "lucide-react";
import { toast } from "sonner";
import { RequireAuth } from "@/components/auth/require-auth";
import { PageLoader } from "@/components/ui";
import { useLogoutMutation } from "@/features/auth/api";
import { useOrderHub } from "@/hooks/use-order-hub";
import { money } from "@/lib/format";
import { STAFF_ROLES } from "@/lib/roles";
import type { UserRole } from "@/lib/types";
import { api } from "@/store/api";
import { useAppDispatch, useAppSelector } from "@/store/store";
import { BrandLogo } from "@/components/layout/brand-logo";

const ALL: UserRole[] = ["SuperAdmin", "Admin", "Staff"];
const ADMINS: UserRole[] = ["SuperAdmin", "Admin"];

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, roles: ALL },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3, roles: ADMINS },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList, roles: ALL },
  { href: "/admin/bookings", label: "Event bookings", icon: CalendarHeart, roles: ADMINS },
  { href: "/admin/products", label: "Products", icon: IceCreamCone, roles: ADMINS },
  { href: "/admin/categories", label: "Categories", icon: Tags, roles: ADMINS },
  { href: "/admin/coupons", label: "Coupons", icon: Ticket, roles: ADMINS },
  { href: "/admin/inventory", label: "Inventory", icon: Boxes, roles: ALL },
  { href: "/admin/production", label: "Production", icon: Factory, roles: ALL },
  { href: "/admin/hawkers", label: "Hawkers", icon: Truck, roles: ALL },
  { href: "/admin/users", label: "Users", icon: Users, roles: ["SuperAdmin"] as UserRole[] },
  { href: "/admin/audit", label: "Audit log", icon: FileClock, roles: ["SuperAdmin"] as UserRole[] },
];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <RequireAuth roles={STAFF_ROLES}>
        <Shell>{children}</Shell>
      </RequireAuth>
    </Suspense>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user)!;
  const [open, setOpen] = useState(false);
  const [logout] = useLogoutMutation();

  // New orders pop up on every admin screen and refresh the lists.
  useOrderHub("admins", {
    onCreated: (e) => {
      toast.info(`New order ${e.orderNumber} for ${money(e.total)}`);
      dispatch(api.util.invalidateTags(["Orders", "Dashboard"]));
    },
    onStatus: () => dispatch(api.util.invalidateTags(["Orders", "Dashboard"])),
  });

  const links = nav.filter((n) => n.roles.includes(user.role));
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <div className="min-h-screen bg-cream lg:flex">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 transform flex-col bg-choco text-cream transition lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-16 items-center justify-between px-5">
          <Link href="/"><BrandLogo light /></Link>
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X className="size-5" /></button>
        </div>
        <div className="px-5 pb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-sun">Admin panel</div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-full px-4 py-2.5 font-display text-[15px] font-medium uppercase tracking-wider transition ${isActive(href) ? "bg-berry text-white shadow-lg shadow-berry/30" : "text-cream/70 hover:bg-white/10 hover:text-white"}`}
            >
              <Icon className="size-4" /> {label}
            </Link>
          ))}
        </nav>
        <Link href="/" className="m-3 flex items-center justify-center gap-2 rounded-full border border-cream/20 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-cream/80 hover:bg-white/10 hover:text-white">
          <ExternalLink className="size-3.5" /> View shop
        </Link>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="flex-1">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-choco/10 bg-white/95 px-4 backdrop-blur sm:px-6">
          <button className="btn-ghost btn-sm lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="size-5" /></button>
          <div className="hidden font-display text-lg font-semibold uppercase tracking-wide sm:block">
            {greeting()}, <span className="text-berry">{user.fullName.split(" ")[0]}</span>
          </div>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-full bg-sun font-display text-base font-bold text-choco">{user.fullName.charAt(0)}</span>
              <span className="hidden text-xs font-semibold uppercase tracking-wider text-choco-light md:block">{user.role}</span>
            </span>
            <button
              onClick={async () => { await logout(); router.push("/login"); }}
              className="btn-outline btn-sm"
            >
              <LogOut className="size-4" /> Logout
            </button>
          </div>
        </header>
        {/* Page titles across admin screens share one look. */}
        <main className="p-4 sm:p-6 [&_h1]:font-display [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:uppercase [&_h1]:tracking-wide">{children}</main>
      </div>
    </div>
  );
}
