// Lightweight fetch cache with TTL
// Caches GET requests by URL, 5-minute expiry

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(url: string): string {
  return url;
}

function isValid(entry: CacheEntry): boolean {
  return Date.now() - entry.timestamp < CACHE_TTL;
}

/**
 * Fetch with in-memory cache. Only caches GET requests.
 * Returns cached data if available and not expired.
 * Set `skipCache: true` to bypass cache (for mutations).
 */
export async function cachedFetch<T = unknown>(
  url: string,
  options?: { skipCache?: boolean },
): Promise<T> {
  const key = getCacheKey(url);

  // Check cache
  if (!options?.skipCache) {
    const entry = cache.get(key);
    if (entry && isValid(entry)) {
      return entry.data as T;
    }
  }

  const res = await fetch(url);
  const data = await res.json();

  // Store in cache
  cache.set(key, { data, timestamp: Date.now() });

  return data as T;
}

/**
 * Invalidate all cache entries matching a prefix.
 * Useful after mutations (POST, PUT, DELETE).
 */
export function invalidateCache(urlPrefix?: string) {
  if (!urlPrefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(urlPrefix)) {
      cache.delete(key);
    }
  }
}

/**
 * Invalidate a single cache entry.
 */
export function invalidateCacheEntry(url: string) {
  cache.delete(getCacheKey(url));
}
