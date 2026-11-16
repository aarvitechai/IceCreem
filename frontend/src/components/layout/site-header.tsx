"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, LogOut, Menu, ShoppingBag, User, X } from "lucide-react";
import { useLogoutMutation } from "@/features/auth/api";
import { homeFor } from "@/lib/roles";
import { useAppSelector } from "@/store/store";

const links = [
  { href: "/products", label: "Ice Creams" },
  { href: "/wedding", label: "Weddings and Events" },
  { href: "/track", label: "Track Order" },
  { href: "/about", label: "About" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const user = useAppSelector((s) => s.auth.user);
  const count = useAppSelector((s) => s.cart.items.reduce((n, i) => n + i.quantity, 0));
  const [logout] = useLogoutMutation();

  const signOut = async () => {
    await logout();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-choco/10 bg-cream/90 backdrop-blur">
      <div className="container-page flex h-16 items-center gap-4">
        <button className="btn-ghost btn-sm md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu">
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>

        <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold text-berry">
          <span aria-hidden>🍨</span> Scoop Factory
        </Link>

        <nav className="ml-6 hidden gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-full px-3 py-2 text-sm font-medium transition hover:text-berry ${pathname.startsWith(l.href) ? "text-berry" : "text-choco-light"}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <Link href={homeFor(user.role)} className="btn-ghost btn-sm" title="My account">
                {user.role === "Customer" ? <User className="size-4" /> : <LayoutDashboard className="size-4" />}
                <span className="hidden sm:inline">{user.fullName.split(" ")[0]}</span>
              </Link>
              <button onClick={signOut} className="btn-ghost btn-sm" aria-label="Log out" title="Log out">
                <LogOut className="size-4" />
              </button>
            </>
          ) : (
            <Link href="/login" className="btn-ghost btn-sm">
              <User className="size-4" /> <span className="hidden sm:inline">Login</span>
            </Link>
          )}
          <Link href="/cart" className="btn-primary btn-sm relative" aria-label={`Cart with ${count} items`}>
            <ShoppingBag className="size-4" />
            <span>{count}</span>
          </Link>
        </div>
      </div>

      {open && (
        <nav className="container-page flex flex-col gap-1 pb-4 md:hidden">
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 font-medium hover:bg-cream-dark">
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
