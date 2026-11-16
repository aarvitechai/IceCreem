import { AccountShell } from "@/components/layout/account-shell";

// Signed in screens depend on the session, so they render after login instead of from a static shell.
export const instant = false;

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <AccountShell>{children}</AccountShell>;
}
