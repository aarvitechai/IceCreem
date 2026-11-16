import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthResult, User } from "@/lib/types";

/** Access token lives only in memory. The refresh token is an httpOnly cookie the browser sends for us. */
interface AuthState {
  user: User | null;
  accessToken: string | null;
  /** "checking" until the first silent refresh finishes, so guards do not redirect too early. */
  status: "checking" | "ready";
}

const initialState: AuthState = { user: null, accessToken: null, status: "checking" };

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    signedIn(state, action: PayloadAction<AuthResult>) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.status = "ready";
    },
    signedOut(state) {
      state.user = null;
      state.accessToken = null;
      state.status = "ready";
    },
  },
});

export const { signedIn, signedOut } = authSlice.actions;
export default authSlice.reducer;
