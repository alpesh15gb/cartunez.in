import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import {
  createCart as apiCreateCart,
  getCart as apiGetCart,
  addToCart as apiAddToCart,
  updateCartItem as apiUpdateCartItem,
  removeFromCart as apiRemoveFromCart,
  setCartEmail as apiSetCartEmail,
  completeCart as apiCompleteCart,
} from '../lib/medusa';

const CART_KEY = 'cartunez_cart_id';

interface CartLineItem {
  id: string;
  title: string;
  thumbnail?: string;
  quantity: number;
  total: number;
  variant?: { id: string; title: string };
}

interface CartData {
  id: string;
  items: CartLineItem[];
  total: number;
  email?: string;
}

interface CartContextValue {
  cart: CartData | null;
  loading: boolean;
  adding: boolean;
  itemCount: number;
  total: number;
  addItem: (variantId: string, qty?: number) => Promise<void>;
  updateItem: (lineId: string, qty: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
  setEmail: (email: string) => Promise<void>;
  checkout: () => Promise<unknown>;
  refresh: () => Promise<void>;
}

const CartCtx = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const refresh = useCallback(async () => {
    const cartId = localStorage.getItem(CART_KEY);
    if (cartId) {
      try {
        const c = await apiGetCart(cartId);
        setCart(c as unknown as CartData);
        return;
      } catch {
        localStorage.removeItem(CART_KEY);
      }
    }
    const c = await apiCreateCart();
    localStorage.setItem(CART_KEY, c.id);
    setCart(c as unknown as CartData);
  }, []);

  useEffect(() => {
    refresh().catch(() => {}).finally(() => setLoading(false));
  }, [refresh]);

  const addItem = useCallback(async (variantId: string, qty = 1) => {
    if (!cart) return;
    setAdding(true);
    try {
      const updated = await apiAddToCart(cart.id, variantId, qty);
      setCart(updated as unknown as CartData);
    } finally {
      setAdding(false);
    }
  }, [cart]);

  const updateItem = useCallback(async (lineId: string, qty: number) => {
    if (!cart) return;
    try {
      const updated = await apiUpdateCartItem(cart.id, lineId, qty);
      setCart(updated as unknown as CartData);
    } catch (e) {
      console.error('Failed to update cart item:', e);
      throw e;
    }
  }, [cart]);

  const removeItem = useCallback(async (lineId: string) => {
    if (!cart) return;
    try {
      const updated = await apiRemoveFromCart(cart.id, lineId);
      setCart(updated as unknown as CartData);
    } catch (e) {
      console.error('Failed to remove cart item:', e);
      throw e;
    }
  }, [cart]);

  const setEmail = useCallback(async (email: string) => {
    if (!cart) return;
    try {
      const updated = await apiSetCartEmail(cart.id, email);
      setCart(updated as unknown as CartData);
    } catch (e) {
      console.error('Failed to set cart email:', e);
      throw e;
    }
  }, [cart]);

  const checkout = useCallback(async () => {
    if (!cart) throw new Error('No cart');
    return apiCompleteCart(cart.id);
  }, [cart]);

  const itemCount = cart?.items?.reduce((sum: number, item: CartLineItem) => sum + item.quantity, 0) ?? 0;
  const total = cart?.total ?? 0;

  return (
    <CartCtx.Provider value={{ cart, loading, adding, itemCount, total, addItem, updateItem, removeItem, setEmail, checkout, refresh }}>
      {children}
    </CartCtx.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
