import { useState, useEffect, useCallback } from 'react';
import { fetchProducts, fetchCompatibleProductIds, fetchCompatibleProductIdsForYear } from '../lib/medusa';
import type { Product } from './useProducts';

export function useVehicleProducts(params?: {
  variantId?: string;
  yearId?: string;
  limit?: number;
}) {
  const [compatible, setCompatible] = useState<Product[]>([]);
  const [other, setOther] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!params?.variantId && !params?.yearId) {
      setCompatible([]);
      setOther([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let compatibleIds: string[] = [];
      if (params.variantId) {
        compatibleIds = await fetchCompatibleProductIds(params.variantId);
      } else if (params.yearId) {
        compatibleIds = await fetchCompatibleProductIdsForYear(params.yearId);
      }

      const { products, count } = await fetchProducts({
        limit: params.limit ?? 100,
      });

      const compatibleSet = new Set(compatibleIds);
      const matched: Product[] = [];
      const remaining: Product[] = [];

      for (const p of products as Product[]) {
        if (compatibleSet.has(p.id)) {
          matched.push(p);
        } else {
          remaining.push(p);
        }
      }

      setCompatible(matched);
      setOther(remaining);
      setTotalCount(count);
    } catch {
      setCompatible([]);
      setOther([]);
    } finally {
      setLoading(false);
    }
  }, [params?.variantId, params?.yearId, params?.limit]);

  useEffect(() => { load(); }, [load]);

  return { compatible, other, totalCount, loading, refetch: load };
}
