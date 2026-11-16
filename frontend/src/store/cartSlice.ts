import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface CartItem {
  variantId: number;
  slug: string;
  productName: string;
  variantName: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  couponCode: string | null;
}

const MAX_QTY = 50;
const initialState: CartState = { items: [], couponCode: null };

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    hydrate(_, action: PayloadAction<CartState>) {
      return action.payload;
    },
    addItem(state, action: PayloadAction<CartItem>) {
      const existing = state.items.find((i) => i.variantId === action.payload.variantId);
      if (existing) existing.quantity = Math.min(MAX_QTY, existing.quantity + action.payload.quantity);
      else state.items.push({ ...action.payload, quantity: Math.min(MAX_QTY, action.payload.quantity) });
    },
    setQuantity(state, action: PayloadAction<{ variantId: number; quantity: number }>) {
      const item = state.items.find((i) => i.variantId === action.payload.variantId);
      if (item) item.quantity = Math.max(1, Math.min(MAX_QTY, action.payload.quantity));
    },
    removeItem(state, action: PayloadAction<number>) {
      state.items = state.items.filter((i) => i.variantId !== action.payload);
    },
    setCoupon(state, action: PayloadAction<string | null>) {
      state.couponCode = action.payload;
    },
    clearCart() {
      return initialState;
    },
  },
});

export const { hydrate, addItem, setQuantity, removeItem, setCoupon, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
