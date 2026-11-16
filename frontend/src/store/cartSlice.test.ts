import { describe, expect, it } from "vitest";
import reducer, { addItem, clearCart, removeItem, setCoupon, setQuantity, type CartItem } from "./cartSlice";

const item = (variantId: number, quantity = 1): CartItem => ({
  variantId, slug: "classic-vanilla", productName: "Classic vanilla", variantName: "500 ml tub", price: 150, imageUrl: null, quantity,
});

const empty = reducer(undefined, { type: "init" });

describe("cart", () => {
  it("adds a new item and merges the same pack", () => {
    let s = reducer(empty, addItem(item(1, 2)));
    s = reducer(s, addItem(item(1, 3)));
    expect(s.items).toHaveLength(1);
    expect(s.items[0].quantity).toBe(5);
  });

  it("never goes above 50 of one pack", () => {
    const s = reducer(reducer(empty, addItem(item(1, 40))), addItem(item(1, 40)));
    expect(s.items[0].quantity).toBe(50);
  });

  it("keeps quantity between 1 and 50", () => {
    let s = reducer(empty, addItem(item(1, 2)));
    s = reducer(s, setQuantity({ variantId: 1, quantity: 0 }));
    expect(s.items[0].quantity).toBe(1);
    s = reducer(s, setQuantity({ variantId: 1, quantity: 99 }));
    expect(s.items[0].quantity).toBe(50);
  });

  it("removes an item and clears everything", () => {
    let s = reducer(empty, addItem(item(1)));
    s = reducer(s, addItem(item(2)));
    s = reducer(s, setCoupon("WELCOME10"));
    s = reducer(s, removeItem(1));
    expect(s.items.map((i) => i.variantId)).toEqual([2]);
    s = reducer(s, clearCart());
    expect(s).toEqual(empty);
  });
});
