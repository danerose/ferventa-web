import type { Product } from '@/app/domain';

/**
 * Computes Levenshtein edit distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

export interface ClosestProductMatch {
  product: Product;
  distance: number;
  matchedBy: 'sku' | 'name' | 'id';
}

/**
 * Finds the closest matching product given an input query (barcode, SKU or name).
 * Prioritizes off-by-one errors in SKU/numbers.
 */
export function findClosestProduct(
  query: string,
  products: Product[],
  maxDistance = 3
): ClosestProductMatch | null {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return null;

  let bestMatch: Product | null = null;
  let lowestDist = Infinity;
  let matchedBy: 'sku' | 'name' | 'id' = 'sku';

  for (const p of products) {
    const sku = (p.sku || '').toLowerCase();
    const name = (p.name || '').toLowerCase();
    const id = (p.id || '').toLowerCase();

    // 1. Exact match checks
    if (sku === cleanQuery || id === cleanQuery || name === cleanQuery) {
      return { product: p, distance: 0, matchedBy: sku === cleanQuery ? 'sku' : name === cleanQuery ? 'name' : 'id' };
    }

    // 2. SKU distance check (off-by-one or off-by-two)
    if (sku) {
      const dist = levenshteinDistance(cleanQuery, sku);
      if (dist < lowestDist) {
        lowestDist = dist;
        bestMatch = p;
        matchedBy = 'sku';
      }
    }

    // 3. Name prefix / substring check
    if (cleanQuery.length >= 3 && name) {
      const namePart = name.slice(0, cleanQuery.length + 3);
      const nameDist = levenshteinDistance(cleanQuery, namePart);
      if (nameDist < lowestDist) {
        lowestDist = nameDist;
        bestMatch = p;
        matchedBy = 'name';
      }
    }
  }

  if (bestMatch && lowestDist <= maxDistance) {
    return { product: bestMatch, distance: lowestDist, matchedBy };
  }

  return null;
}
