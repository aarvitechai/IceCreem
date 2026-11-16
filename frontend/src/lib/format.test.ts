import { describe, expect, it } from "vitest";
import { date, dateTime, discountPercent, label, money, toDate } from "./format";

// Tests run in New York time on purpose, so a browser outside India is simulated.
it("runs in a zone outside India, so the India time checks mean something", () => {
  expect(new Date("2026-11-16T10:59:00Z").getTimezoneOffset()).not.toBe(-330);
});

describe("toDate", () => {
  it("reads API times without a zone as UTC", () => {
    expect(toDate("2026-11-16T10:59:00").toISOString()).toBe("2026-11-16T10:59:00.000Z");
    expect(toDate("2026-11-16T10:59:00.1234567").toISOString()).toBe("2026-11-16T10:59:00.123Z");
  });

  it("keeps times that already have a zone", () => {
    expect(toDate("2026-11-16T10:59:00Z").toISOString()).toBe("2026-11-16T10:59:00.000Z");
    expect(toDate("2026-11-16T16:29:00+05:30").toISOString()).toBe("2026-11-16T10:59:00.000Z");
  });

  it("leaves date only values alone", () => {
    expect(toDate("2026-11-16").toISOString()).toBe("2026-11-16T00:00:00.000Z");
  });
});

describe("India time display", () => {
  it("shows API times in India time whatever the device zone", () => {
    expect(dateTime("2026-11-16T10:59:00")).toMatch(/16 Nov.*04:29\s?pm/i);
  });

  it("does not move a date only value to the previous day", () => {
    expect(date("2026-11-20")).toMatch(/20 Nov 2026/);
  });
});

describe("money and labels", () => {
  it("formats rupees without decimals for whole numbers", () => {
    expect(money(1560)).toMatch(/₹\s?1,560$/);
    expect(money(25.93)).toMatch(/₹\s?25\.93$/);
  });

  it("turns enum names into words", () => {
    expect(label("OutForDelivery")).toBe("Out for delivery");
    expect(label("KittyParty")).toBe("Kitty party");
  });

  it("computes the discount percent only when MRP is higher", () => {
    expect(discountPercent(180, 170)).toBe(6);
    expect(discountPercent(100, 100)).toBe(0);
    expect(discountPercent(100, 120)).toBe(0);
  });
});
