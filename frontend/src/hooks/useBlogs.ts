import { useState, useEffect } from 'react';
import { fetchBlogPosts, fetchBlogPost } from '../lib/api';
import type { BlogPost } from '../lib/api';

export function useBlogPosts(limit = 6) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchBlogPosts({ limit })
      .then(data => { if (!cancelled) setPosts(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [limit]);

  return { posts, loading };
}

export function useBlogPost(slug: string | null) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    let cancelled = false;
    fetchBlogPost(slug)
      .then(p => { if (!cancelled) setPost(p); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug]);

  return { post, loading };
}
