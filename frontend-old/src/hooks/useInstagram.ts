import { useState, useEffect } from 'react';
import { fetchInstagramReels } from '../lib/api';
import type { InstagramReel } from '../lib/api';

export function useInstagramReels(limit = 8) {
  const [reels, setReels] = useState<InstagramReel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchInstagramReels()
      .then(data => {
        if (!cancelled) setReels(data.slice(0, limit));
      })
      .catch(e => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [limit]);

  return { reels, loading, error };
}
