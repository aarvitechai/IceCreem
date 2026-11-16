"use client";

import { useEffect } from "react";
import { Provider } from "react-redux";
import { Toaster } from "sonner";
import { restoreSession } from "@/features/auth/api";
import { hydrate } from "@/store/cartSlice";
import { makeStore } from "@/store/store";

const CART_KEY = "icecream.cart.v1";

/**
 * One store per browser tab, created at module load (not during render, which Cache Components requires).
 * On the server this store is only read for the first HTML: every dispatch happens in effects or
 * event handlers, which never run on the server, so no user data can leak between requests.
 */
const store = makeStore();

/** Restores the login session and keeps the cart in localStorage. */
export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      if (saved) store.dispatch(hydrate(JSON.parse(saved)));
    } catch {
      localStorage.removeItem(CART_KEY);
    }

    void restoreSession(store.dispatch);

    let last = "";
    return store.subscribe(() => {
      const next = JSON.stringify(store.getState().cart);
      if (next !== last) {
        last = next;
        localStorage.setItem(CART_KEY, next);
      }
    });
  }, []);

  return (
    <Provider store={store}>
      {children}
      <Toaster position="top-center" richColors closeButton />
    </Provider>
  );
}
