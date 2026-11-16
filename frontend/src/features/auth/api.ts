import { api } from "@/store/api";
import { signedIn, signedOut } from "@/store/authSlice";
import { refreshSession } from "@/store/session";
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
  const session = await refreshSession();
  dispatch(session ? signedIn(session) : signedOut());
}
