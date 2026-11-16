// Signed in screens depend on the session, so they render after login instead of from a static shell.
export const instant = false;

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
