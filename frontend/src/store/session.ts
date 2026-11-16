import type { ApiResponse, AuthResult } from "@/lib/types";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

let inFlight: Promise<AuthResult | null> | null = null;

/**
 * Renews the session from the httpOnly refresh cookie. Only one call runs at a time in a tab, so a page load
 * and an expired API call share it. If another tab renewed the cookie a moment earlier, the API answers 409:
 * wait briefly and try again with the new cookie.
 */
export function refreshSession(fetchImpl: typeof fetch = fetch): Promise<AuthResult | null> {
  inFlight ??= (async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await fetchImpl("/api/v1/auth/refresh", { method: "POST", credentials: "include" });
      if (res.ok) return ((await res.json()) as ApiResponse<AuthResult>).data;
      if (res.status !== 409) return null;
      await wait(300 * (attempt + 1));
    }
    return null;
  })()
    .catch(() => null)
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}
