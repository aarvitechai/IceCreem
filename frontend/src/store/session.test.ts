import { describe, expect, it, vi } from "vitest";
import { refreshSession } from "./session";

const ok = { ok: true, status: 200, json: async () => ({ data: { accessToken: "t", user: { id: 1 } } }) } as unknown as Response;
const conflict = { ok: false, status: 409, json: async () => ({}) } as unknown as Response;
const expired = { ok: false, status: 401, json: async () => ({}) } as unknown as Response;

describe("refreshSession", () => {
  it("sends one request when called many times at once", async () => {
    const fetchMock = vi.fn().mockResolvedValue(ok);
    const results = await Promise.all([refreshSession(fetchMock), refreshSession(fetchMock), refreshSession(fetchMock)]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(results.every((r) => r?.accessToken === "t")).toBe(true);
  });

  it("retries when another tab just renewed the cookie", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(conflict).mockResolvedValueOnce(ok);
    const result = await refreshSession(fetchMock);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result?.accessToken).toBe("t");
  });

  it("gives up quietly when the session has ended", async () => {
    const fetchMock = vi.fn().mockResolvedValue(expired);
    expect(await refreshSession(fetchMock)).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("treats a network error as signed out", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("offline"));
    expect(await refreshSession(fetchMock)).toBeNull();
  });
});
