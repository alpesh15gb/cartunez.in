import { useState, useCallback, useRef } from 'react';
import { MEDUSA_BACKEND_URL, PUBLISHABLE_KEY } from '../lib/config';

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
      const headers: Record<string, string> = {};
      if (PUBLISHABLE_KEY) headers['x-publishable-api-key'] = PUBLISHABLE_KEY;
      const res = await fetch(`${MEDUSA_BACKEND_URL}/store/products?q=${encodeURIComponent(query)}&limit=10`, { headers, signal: controller.signal });
      if (!res.ok) throw new Error('Search request failed');
      const data = await res.json();
      setState({
        results: (data.products || []).map((p: Record<string, unknown>) => ({
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
