import type {
  Universeplanet,
  UniversePlaza,
  UniverseDecoration,
  UniverseRiver,
  UniverseBridge,
  constellationZone,
} from "@/lib/github";

interface UniverseCache {
  planets: Universeplanet[];
  plazas: UniversePlaza[];
  decorations: UniverseDecoration[];
  river: UniverseRiver | null;
  bridges: UniverseBridge[];
  constellationZones: constellationZone[];
  stats: { total_companies: number; total_contributions: number };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rawcompanies: any[];
  timestamp: number;
}

// Module-level singleton — survives Next.js client-side navigation
let cache: UniverseCache | null = null;

const MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

export function getUniverseCache(): UniverseCache | null {
  if (!cache) return null;
  if (Date.now() - cache.timestamp > MAX_AGE_MS) {
    cache = null;
    return null;
  }
  return cache;
}

export function setUniverseCache(data: Omit<UniverseCache, "timestamp">) {
  cache = { ...data, timestamp: Date.now() };
}

export function clearUniverseCache() {
  cache = null;
}
