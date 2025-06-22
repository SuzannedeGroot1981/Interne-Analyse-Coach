const hits: Record<string, number[]> = {};   // key→ array van timestamps (ms)

export function allow(key: string, limit = 10, windowMs = 60_000) {
  const now = Date.now();
  hits[key] = (hits[key] || []).filter(t => now - t < windowMs);
  if (hits[key].length >= limit) return false;
  hits[key].push(now); 
  return true;
}