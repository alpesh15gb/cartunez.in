import Medusa from '@medusajs/medusa-js';
import { MEDUSA_BACKEND_URL } from './config';

const medusa = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  maxRetries: 3,
});

export default medusa;

// ─── Product helpers ─────────────────────────────────────────────────────────

export async function fetchProducts(params?: {
  q?: string;
  category_id?: string[];
  limit?: number;
  offset?: number;
  sort?: string;
}) {
  const { products, count } = await medusa.products.list({
    q: params?.q,
    category_id: params?.category_id,
    limit: params?.limit ?? 20,
    offset: params?.offset ?? 0,
  });
  return { products, count };
}

export async function fetchProduct(handle: string) {
  const res = await fetch(`${MEDUSA_BACKEND_URL}/store/products?handle=${encodeURIComponent(handle)}&limit=1&expand=categories,variants.options,variants.prices,options`);
  if (!res.ok) throw new Error('Product not found');
  const data = await res.json();
  const product = data.products?.[0];
  if (!product) throw new Error('Product not found');
  return product;
}

export async function fetchCategories() {
  const { product_categories } = await medusa.productCategories.list();
  return product_categories;
}

// ─── Vehicle compatibility helpers ──────────────────────────────────────────

export async function fetchCompatibleProductIds(variantId: string): Promise<string[]> {
  const res = await fetch(`${MEDUSA_BACKEND_URL}/vehicle/products/${variantId}`);
  if (!res.ok) return [];
  const data = await res.json();
  return [...new Set<string>(data.products?.map((p: { product_id: string }) => p.product_id) || [])];
}

export async function fetchCompatibleProductIdsForYear(yearId: string): Promise<string[]> {
  const res = await fetch(`${MEDUSA_BACKEND_URL}/vehicle/products-by-year/${yearId}`);
  if (!res.ok) return [];
  const data = await res.json();
  return [...new Set<string>(data.products?.map((p: { product_id: string }) => p.product_id) || [])];
}

// ─── Cart helpers ────────────────────────────────────────────────────────────

export async function createCart() {
  const { cart } = await medusa.carts.create();
  return cart;
}

export async function getCart(cartId: string) {
  const { cart } = await medusa.carts.retrieve(cartId);
  return cart;
}

export async function addToCart(cartId: string, variantId: string, quantity: number) {
  const { cart } = await medusa.carts.lineItems.create(cartId, {
    variant_id: variantId,
    quantity,
  });
  return cart;
}

export async function updateCartItem(cartId: string, lineId: string, quantity: number) {
  const { cart } = await medusa.carts.lineItems.update(cartId, lineId, { quantity });
  return cart;
}

export async function removeFromCart(cartId: string, lineId: string) {
  const { cart } = await medusa.carts.update(cartId, {
    // @ts-expect-error medusa-js doesn't expose removeItem but API supports quantity=0
    items: [{ id: lineId, quantity: 0 }],
  });
  return cart;
}

export async function setCartEmail(cartId: string, email: string) {
  const { cart } = await medusa.carts.update(cartId, { email });
  return cart;
}

export async function completeCart(cartId: string) {
  return medusa.carts.complete(cartId);
}

// ─── Auth helpers ────────────────────────────────────────────────────────────

export async function authCreateSession(email: string, password: string) {
  const result = await medusa.auth.authenticate({ email, password });
  return result.customer;
}

export async function authCreateAccount(data: {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}) {
  // Use customer create endpoint directly
  const { customer } = await medusa.customers.create(data);
  return customer;
}

export async function authGetSession() {
  try {
    const { customer } = await medusa.auth.getSession();
    return customer;
  } catch {
    return null;
  }
}
