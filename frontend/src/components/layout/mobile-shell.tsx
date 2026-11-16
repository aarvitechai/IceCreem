"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useLogoutMutation } from "@/features/auth/api";
import { useAppSelector } from "@/store/store";
import { brand } from "@/lib/brand";

/** Simple, thumb friendly frame for hawker and delivery screens. */
export function MobileShell({ title, children }: { title: string; children: React.ReactNode }) {
  const user = useAppSelector((s) => s.auth.user);
  const router = useRouter();
  const [logout] = useLogoutMutation();
  return (
    <div className="mx-auto min-h-screen max-w-lg">
      <header className="sticky top-0 z-20 flex items-center justify-between bg-berry px-4 py-3 text-white">
        <div>
          <Link href="/" className="text-xs text-white/80">{brand.name}</Link>
          <div className="font-display text-lg font-bold">{title}</div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span>{user?.fullName.split(" ")[0]}</span>
          <button onClick={async () => { await logout(); router.push("/login"); }} className="rounded-full bg-white/20 p-2" aria-label="Log out"><LogOut className="size-4" /></button>
        </div>
      </header>
      <main className="space-y-4 p-4">{children}</main>
    </div>
  );
}
