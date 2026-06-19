import { useState, useCallback, useRef } from 'react';
import { MEILISEARCH_URL, MEILISEARCH_KEY } from '../lib/config';
import { fetchProducts } from '../lib/medusa';

interface SearchProduct {
  id: string;
  title: string;
  handle: string;
  thumbnail?: string;
  description?: string;
  price?: string;
}

interface SearchState {
  results: SearchProduct[];
  loading: boolean;
  error: string | null;
}

export function useSearch() {
  const [state, setState] = useState<SearchState>({ results: [], loading: false, error: null });
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setState({ results: [], loading: false, error: null });
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState(p => ({ ...p, loading: true, error: null }));

    try {
      // Try Meilisearch first
      if (MEILISEARCH_URL && MEILISEARCH_KEY) {
        const res = await fetch(`${MEILISEARCH_URL}/indexes/products/search`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${MEILISEARCH_KEY}`,
          },
          body: JSON.stringify({ q: query, limit: 8 }),
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setState({ results: data.hits ?? [], loading: false, error: null });
          return;
        }
      }

      // Fallback to Medusa product search
      const { products } = await fetchProducts({ q: query, limit: 8 });
      setState({
        results: products.map((p: Record<string, unknown>) => ({
          id: String(p.id ?? ''),
          title: String(p.title ?? ''),
          handle: String(p.handle ?? ''),
          thumbnail: p.thumbnail as string | undefined,
          description: p.description as string | undefined,
        })),
        loading: false,
        error: null,
      });
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError') return;
      setState(p => ({ ...p, loading: false, error: e instanceof Error ? e.message : 'Search failed' }));
    }
  }, []);

  const clear = useCallback(() => {
    abortRef.current?.abort();
    setState({ results: [], loading: false, error: null });
  }, []);

  return { ...state, search, clear };
}
