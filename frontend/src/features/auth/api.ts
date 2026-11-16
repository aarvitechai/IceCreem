import { api } from "@/store/api";
import { signedIn, signedOut } from "@/store/authSlice";
import type { ApiResponse, AuthResult } from "@/lib/types";

export interface LoginInput {
  login: string;
  password: string;
}

export interface RegisterInput {
  fullName: string;
  email: string;
  mobile: string;
  password: string;
}

const authApi = api.injectEndpoints({
  endpoints: (b) => ({
    login: b.mutation<AuthResult, LoginInput>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      transformResponse: (r: ApiResponse<AuthResult>) => r.data,
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(signedIn(data));
      },
    }),
    register: b.mutation<AuthResult, RegisterInput>({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
      transformResponse: (r: ApiResponse<AuthResult>) => r.data,
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled;
        dispatch(signedIn(data));
      },
    }),
    logout: b.mutation<void, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        await queryFulfilled.catch(() => undefined);
        dispatch(signedOut());
        dispatch(api.util.resetApiState());
      },
    }),
  }),
});

export const { useLoginMutation, useRegisterMutation, useLogoutMutation } = authApi;

/** Restores the session on page load using the refresh cookie. */
export async function restoreSession(dispatch: (action: unknown) => unknown) {
  try {
    const res = await fetch("/api/v1/auth/refresh", { method: "POST", credentials: "include" });
    if (!res.ok) throw new Error("no session");
    const body = (await res.json()) as ApiResponse<AuthResult>;
    dispatch(signedIn(body.data));
  } catch {
    dispatch(signedOut());
  }
}
