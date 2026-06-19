import { useState, useEffect, useCallback } from 'react';
import { fetchProducts as apiFetchProducts, fetchProduct as apiFetchProduct, fetchCategories as apiFetchCategories } from '../lib/medusa';

export interface Product {
  id: string;
  title: string;
  handle: string;
  thumbnail: string | null;
  description: string | null;
  options: Array<{ id: string; title: string; values: Array<{ id: string; title: string }> }>;
  variants: Array<{ id: string; title: string; prices: Array<{ amount: number }>; options?: Array<{ option_id: string; value: string }> }>;
}

export interface Category {
  id: string;
  name: string;
  handle: string;
}

export function useProducts(params?: {
  q?: string;
  categoryId?: string[];
  limit?: number;
  offset?: number;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiFetchProducts({
        q: params?.q,
        category_id: params?.categoryId,
        limit: params?.limit,
        offset: params?.offset,
      });
      setProducts(result.products as unknown as Product[]);
      setCount(result.count);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to load products';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [params?.q, params?.categoryId?.join(','), params?.limit, params?.offset]);

  useEffect(() => { load(); }, [load]);

  return { products, count, loading, error, refetch: load };
}

export function useProduct(handle: string | null) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!handle) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    apiFetchProduct(handle)
      .then(p => { if (!cancelled) setProduct(p as unknown as Product); })
      .catch(e => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [handle]);

  return { product, loading, error };
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetchCategories()
      .then(cats => setCategories(cats as unknown as Category[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { categories, loading };
}
