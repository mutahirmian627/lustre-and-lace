const buckets = new Map<string, number[]>();

/**
 * Best-effort sliding-window limiter held in memory. On serverless each
 * instance keeps its own counts, so this slows down casual scraping rather
 * than being a hard guarantee — fine for read-only, minimal-data lookups.
 * Returns true if the call is allowed.
 */
export function allowRequest(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  const recent = (buckets.get(key) ?? []).filter((time) => now - time < windowMs);
  if (recent.length >= limit) {
    buckets.set(key, recent);
    return false;
  }
  recent.push(now);
  buckets.set(key, recent);

  // Keep the map from growing forever on a long-lived instance.
  if (buckets.size > 5000) {
    for (const [bucketKey, times] of buckets) {
      if (times.every((time) => now - time >= windowMs)) buckets.delete(bucketKey);
    }
  }
  return true;
}
