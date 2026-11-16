"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, LogOut, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useLogoutMutation } from "@/features/auth/api";
import { homeFor } from "@/lib/roles";
import { useHydrated } from "@/lib/use-hydrated";
import { useAppSelector } from "@/store/store";
import { BrandLogo } from "./brand-logo";
import { brand } from "@/lib/brand";

const links = [
  { href: "/products", label: "Shop" },
  { href: "/wedding", label: "Weddings" },
  { href: "/partner", label: "Franchise" },
  { href: "/track", label: "Track Order" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const user = useAppSelector((s) => s.auth.user);
  const hydrated = useHydrated();
  const saved = useAppSelector((s) => s.cart.items.reduce((n, i) => n + i.quantity, 0));
  const count = hydrated ? saved : 0;
  const [logout] = useLogoutMutation();

  const search = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q")?.toString().trim();
    setOpen(false);
    router.push(q ? `/products?search=${encodeURIComponent(q)}` : "/products");
  };

  const searchBox = (className: string) => (
    <form onSubmit={search} role="search" className={className}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-choco/40" />
      <input name="q" type="search" placeholder="Search flavours" aria-label="Search ice creams" className="input rounded-full py-2 pl-9" />
    </form>
  );

  const signOut = async () => {
    await logout();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-choco/10 bg-white/95 backdrop-blur">
      <div className="container-page flex h-16 items-center gap-2 sm:gap-4">
        <button className="btn-ghost btn-sm lg:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu">
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>

        <Link href="/" aria-label={`${brand.name} home`}>
          <BrandLogo />
        </Link>

        <nav className="ml-6 hidden gap-1 lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`whitespace-nowrap rounded-full px-3 py-2 font-display text-base font-medium uppercase tracking-wider transition hover:text-berry ${pathname.startsWith(l.href) ? "text-berry" : "text-choco"}`}
            >
              {l.label}
            </Link>
          ))}
          {user && (
            <button type="button" onClick={() => { setOpen(false); void signOut(); }} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left font-display text-lg uppercase tracking-wide text-berry hover:bg-cream-dark sm:hidden">
              <LogOut className="size-5" /> Log out
            </button>
          )}
        </nav>

        {searchBox("relative ml-auto hidden w-56 xl:block")}

        <div className="ml-auto flex items-center gap-2 xl:ml-2">
          {user ? (
            <>
              <Link href={homeFor(user.role)} className="btn-ghost btn-sm" title="My account">
                {user.role === "Customer" ? <User className="size-4" /> : <LayoutDashboard className="size-4" />}
                <span className="hidden sm:inline">{user.fullName.split(" ")[0]}</span>
              </Link>
              <button onClick={signOut} className="btn-ghost btn-sm hidden sm:inline-flex" aria-label="Log out" title="Log out">
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
        <nav className="container-page flex flex-col gap-1 pb-4 lg:hidden">
          {searchBox("relative mb-2")}
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-2.5 font-display text-lg uppercase tracking-wide hover:bg-cream-dark">
              {l.label}
            </Link>
          ))}
          {user && (
            <button type="button" onClick={() => { setOpen(false); void signOut(); }} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-left font-display text-lg uppercase tracking-wide text-berry hover:bg-cream-dark sm:hidden">
              <LogOut className="size-5" /> Log out
            </button>
          )}
        </nav>
      )}
    </header>
  );
}
