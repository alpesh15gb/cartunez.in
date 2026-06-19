import { useState, useEffect } from 'react';
import { fetchReviews, createReview } from '../lib/api';
import type { Review } from '../lib/api';

export function useReviews(productId: string | null) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) { setLoading(false); return; }
    let cancelled = false;
    fetchReviews(productId)
      .then(data => { if (!cancelled) setReviews(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [productId]);

  const submit = async (data: {
    customer_name: string;
    rating: number;
    title: string;
    body: string;
  }) => {
    if (!productId) return;
    const review = await createReview({ ...data, product_id: productId });
    setReviews(prev => [review, ...prev]);
  };

  return { reviews, loading, submit };
}
