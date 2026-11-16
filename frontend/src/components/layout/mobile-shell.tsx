"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useLogoutMutation } from "@/features/auth/api";
import { useAppSelector } from "@/store/store";
import { BrandLogo } from "./brand-logo";

/** Thumb friendly frame for hawker and delivery screens: coral header with a greeting, content on cream. */
export function MobileShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  const user = useAppSelector((s) => s.auth.user);
  const router = useRouter();
  const [logout] = useLogoutMutation();
  const first = user?.fullName.split(" ")[0] ?? "";

  return (
    <div className="min-h-screen bg-cream">
      <header className="relative overflow-hidden rounded-b-[2rem] bg-gradient-to-br from-berry to-pink px-4 pb-8 pt-4 text-white shadow-md">
        <span aria-hidden className="absolute -right-10 -top-10 size-40 rounded-full bg-white/10" />
        <span aria-hidden className="absolute -bottom-16 -left-8 size-40 rounded-full bg-sun/25" />
        <div className="relative mx-auto max-w-lg">
          <div className="flex items-center justify-between">
            <Link href="/" aria-label="Shop home"><BrandLogo light /></Link>
            <button
              onClick={async () => { await logout(); router.push("/login"); }}
              className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider hover:bg-white/30"
            >
              <LogOut className="size-3.5" /> Log out
            </button>
          </div>
          <div className="mt-5 flex items-center gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-sun font-display text-xl font-bold text-choco shadow">{first.charAt(0)}</span>
            <div>
              <div className="text-sm text-white/85">Hi {first}</div>
              <h1 className="font-display text-3xl font-bold uppercase leading-none tracking-wide">{title}</h1>
            </div>
          </div>
          {subtitle && <p className="mt-2 text-sm text-white/85">{subtitle}</p>}
        </div>
      </header>
      <main className="relative mx-auto -mt-4 max-w-lg space-y-4 px-4 pb-10">{children}</main>
    </div>
  );
}
