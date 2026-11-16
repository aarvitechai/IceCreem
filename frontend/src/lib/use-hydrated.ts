import { useSyncExternalStore } from "react";

const noop = () => () => {};

/**
 * False while React hydrates server HTML, true afterwards.
 * Use it before showing browser only data (like the saved cart) so the first render matches the server.
 */
export function useHydrated() {
  return useSyncExternalStore(noop, () => true, () => false);
}
