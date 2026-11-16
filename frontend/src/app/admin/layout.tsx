import { AdminShell } from "@/components/admin/admin-shell";

// Signed in screens depend on the session, so they render after login instead of from a static shell.
export const instant = false;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
