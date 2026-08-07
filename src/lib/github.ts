import { getPlanetPerformance } from "./planet-performance";

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface CompanyRecord {
  id: number;
  username: string;
  external_id: number | null;
  name: string | null;
  avatar_url: string | null;
  bio: string | null;
  contributions: number;
  public_repos: number;
  total_stars: number;
  primary_language: string | null;
  top_repos?: TopRepo[];
  rank: number | null;
  fetched_at: string;
  created_at: string;
  claimed: boolean;
  fetch_priority: number;
  claimed_at: string | null;
  owned_items?: string[];
  category: string | null;
  employee_count: number;
  applications_count: number;
  kudos_count: number;
  visit_count: number;
  contributions_total: number;
  contribution_years: number[];
  total_prs: number;
  total_reviews: number;
  total_issues?: number; // Keep this one as it's not explicitly removed or replaced
  repos_contributed_to: string[];
  followers: number;
  following: number;
  organizations_count: number;
  account_created_at: string | null;
  current_streak: number;
  longest_streak?: number;
  xp_level?: number;
  xp_universe?: number;
  // Game fields
  achievements?: string[];
  loadout?: { crown: string | null; roof: string | null; aura: string | null } | null;
  app_streak?: number;
  raid_xp?: number;
  xp_total?: number;
  active_raid_tag?: { attacker_login: string; tag_style: string; expires_at: string } | null;
  rabbit_completed?: boolean;
  yield_percent?: number;
  custom_color?: string | null;
  billboard_images?: string[];
  share_capital?: number;
  revenue?: number;
  health_score?: number;
}

export interface TopRepo {
  name: string;
  stars: number;
  language: string | null;
  url: string;
}

export interface UniversePlanet {
  login: string;
  rank: number;
  contributions: number;
  total_stars: number;
  public_repos: number;
  name: string | null;
  avatar_url: string | null;
  category: string | null;
  employee_count: number;
  applications_count: number;
  claimed: boolean;
  owned_items: string[];
  achievements: string[];
  kudos_count: number;
  visit_count: number;
  primary_language?: string | null;
  loadout?: { crown: string | null; roof: string | null; aura: string | null } | null;
  app_streak: number;
  raid_xp: number;
  current_week_contributions: number;
  current_week_kudos_given: number;
  current_week_kudos_received: number;
  active_raid_tag?: { attacker_login: string; tag_style: string; expires_at: string } | null;
  rabbit_completed: boolean;
  xp_total: number;
  xp_level: number;
  constellation?: string;
  constellation_chosen?: boolean;
  position: [number, number, number];
  width: number;
  depth: number;
  height: number;
  floors: number;
  windowsPerFloor: number;
  sideWindowsPerFloor: number;
  litPercentage: number;
  yield_percent: number;
  custom_color?: string | null;
  billboard_images?: string[];
  share_capital: number;
  revenue: number;
  health_score: number;
}

export interface SpacePlaza {
  position: [number, number, number];
  size: number;
  variant: number; // 0-1 seeded random for visual variety
}

export interface SpaceDecoration {
  type: 'tree' | 'streetLamp' | 'car' | 'bench' | 'fountain' | 'sidewalk' | 'roadMarking';
  position: [number, number, number];
  rotation: number;
  variant: number;
  size?: [number, number];
}

// â”€â”€â”€ Spiral Coordinate â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function spiralCoord(index: number): [number, number] {
  if (index === 0) return [0, 0];

  let x = 0,
    y = 0,
    dx = 1,
    dy = 0;
  let segLen = 1,
    segPassed = 0,
    turns = 0;

  for (let i = 0; i < index; i++) {
    x += dx;
    y += dy;
    segPassed++;
    if (segPassed === segLen) {
      segPassed = 0;
      // turn left
      const tmp = dx;
      dx = -dy;
      dy = tmp;
      turns++;
      if (turns % 2 === 0) segLen++;
    }
  }
  return [x, y];
}

// â”€â”€â”€ Universe Layout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const BLOCK_SIZE = 4;     // 4x4 planets per Universe block
const LOT_W = 38;        // lot width  (X axis) â€” tighter packing
const LOT_D = 32;        // lot depth  (Z axis) â€” tighter packing
const ALLEY_W = 3;       // narrow gap between planets within a block
const STREET_W = 12;     // street between blocks (within a constellation)

// Derived: total block footprint
const BLOCK_FOOTPRINT_X = BLOCK_SIZE * LOT_W + (BLOCK_SIZE - 1) * ALLEY_W; // 4*38 + 3*3 = 161
const BLOCK_FOOTPRINT_Z = BLOCK_SIZE * LOT_D + (BLOCK_SIZE - 1) * ALLEY_W; // 4*32 + 3*3 = 137

const RIVER_MARGIN = 8;      // Margin on each side of the river

const MAX_planet_HEIGHT = 600;
const MIN_planet_HEIGHT = 35;
const HEIGHT_RANGE = MAX_planet_HEIGHT - MIN_planet_HEIGHT;

export interface SpaceRiver {
  x: number;
  width: number;
  length: number;
  centerZ: number;
}

export interface SpaceBridge {
  position: [number, number, number];
  width: number;
  rotation: number; // radians around Y axis
}

export interface GalaxyZone {
  id: string;
  name: string;
  center: [number, number, number];
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  population: number;
  color: string;
}

const RIVER_WIDTH = 40;

function precomputeComposites(companies: CompanyRecord[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const dev of companies) {
    map.set(dev.username, getPlanetPerformance(dev.username, dev.name).score / 100);
  }
  return map;
}

// â”€â”€â”€ constellation Layout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const CONSTELLATION_NAMES: Record<string, string> = {
  'Galactic Center': 'Galactic Center',
  frontend: 'Frontend', backend: 'Backend', fullstack: 'Full Stack',
  mobile: 'Mobile', data_ai: 'Data & AI', devops: 'DevOps & Cloud',
  security: 'Security', gamedev: 'GameDev', vibe_coder: 'Vibe Coder',
  creator: 'Creator',
};

export const CONSTELLATION_COLORS: Record<string, string> = {
  'Galactic Center': '#fbbf24',
  frontend: '#3b82f6', backend: '#ef4444', fullstack: '#a855f7',
  mobile: '#22c55e', data_ai: '#06b6d4', devops: '#f97316',
  security: '#dc2626', gamedev: '#ec4899', vibe_coder: '#8b5cf6',
  creator: '#eab308',
};

export const CONSTELLATION_DESCRIPTIONS: Record<string, string> = {
  'Galactic Center': 'The elite core. Top 50 companies by global rank.',
  frontend: 'Pixels, components, and beautiful interfaces.',
  backend: 'APIs, systems, and server-side logic.',
  fullstack: 'Jack of all trades. Ship everything.',
  mobile: 'Native apps for iOS and Android.',
  data_ai: 'Data science, ML, and AI.',
  devops: 'Infrastructure, CI/CD, and cloud.',
  security: 'Hacking, defense, and cryptography.',
  gamedev: 'Game engines, physics, and fun.',
  vibe_coder: 'Aesthetic code. Vibes over velocity.',
  creator: 'Open-source tools and content.',
};

const LANGUAGE_TO_constellation: Record<string, string> = {
  TypeScript: 'frontend', JavaScript: 'frontend', CSS: 'frontend',
  HTML: 'frontend', SCSS: 'frontend', Vue: 'frontend', Svelte: 'frontend',
  Java: 'backend', Go: 'backend', Rust: 'backend', 'C#': 'backend',
  PHP: 'backend', Ruby: 'backend', Elixir: 'backend', C: 'backend',
  'C++': 'backend', Assembly: 'backend', Verilog: 'backend', VHDL: 'backend',
  Python: 'data_ai', 'Jupyter Notebook': 'data_ai', R: 'data_ai', Julia: 'data_ai',
  Swift: 'mobile', Kotlin: 'mobile', Dart: 'mobile', 'Objective-C': 'mobile',
  HCL: 'devops', Shell: 'devops', Dockerfile: 'devops', Nix: 'devops',
  GDScript: 'gamedev', Lua: 'gamedev',
};

export function inferconstellation(lang: string | null): string {
  if (!lang) return 'fullstack';
  return LANGUAGE_TO_constellation[lang] ?? 'fullstack';
}

function localBlockAxisPos(idx: number, footprint: number): number {
  if (idx === 0) return 0;
  const abs = Math.abs(idx);
  const sign = idx >= 0 ? 1 : -1;
  return sign * (abs * footprint + abs * STREET_W);
}

export function generateUniverseLayout(companies: CompanyRecord[]): {
  planets: UniversePlanet[];
  plazas: SpacePlaza[];
  decorations: SpaceDecoration[];
  river: SpaceRiver;
  bridges: SpaceBridge[];
  GalaxyZones: GalaxyZone[];
} {
  const planets: UniversePlanet[] = [];
  const plazas: SpacePlaza[] = [];
  const decorations: SpaceDecoration[] = [];
  const GalaxyZones: GalaxyZone[] = [];

  // â”€â”€ 1. Group by constellation, sort within each, concat in priority order â”€â”€
  const composites = precomputeComposites(companies);

  const constellation_ORDER = [
    'backend', 'frontend', 'fullstack', 'data_ai', 'devops',
    'mobile', 'gamedev', 'vibe_coder', 'creator', 'security',
  ];

  const constellationGroups: Record<string, CompanyRecord[]> = {};
  for (const dev of companies) {
    const did = inferconstellation(dev.category);
    if (!constellationGroups[did]) constellationGroups[did] = [];
    constellationGroups[did].push(dev);
  }

  // Seeded shuffle for deterministic "random" order
  function seededShuffle<T>(arr: T[], seed: number): T[] {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(seededRandom(seed + i * 7919) * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  // â”€â”€ Extract top 50 global companies as "Galactic Center" (center, around the spire) â”€â”€
  const GalacticCenter_COUNT = 50;
  const LOTS_PER_BLOCK = BLOCK_SIZE * BLOCK_SIZE; // 16
  const allcompaniesSorted = [...companies].sort((a, b) =>
    (composites.get(b.username) ?? 0) - (composites.get(a.username) ?? 0)
  );
  const GalacticCentercompanies = allcompaniesSorted.slice(0, GalacticCenter_COUNT);
  const GalacticCenterSet = new Set(GalacticCentercompanies.map(d => d.username));

  for (let i = 0; i < GalacticCentercompanies.length; i += LOTS_PER_BLOCK) {
    const end = Math.min(i + LOTS_PER_BLOCK, GalacticCentercompanies.length);
    const slice = GalacticCentercompanies.slice(i, end);
    const shuffled = seededShuffle(slice, hashStr('Galactic Center') + i);
    for (let j = 0; j < shuffled.length; j++) GalacticCentercompanies[i + j] = shuffled[j];
  }

  const GalacticCenterOverride = new Set(GalacticCentercompanies.map(d => d.username));

  // â”€â”€ Per-constellation dev arrays (sorted by composite, block-shuffled, minus Galactic Center) â”€â”€
  const constellationDevArrays: { did: string; companies: CompanyRecord[] }[] = [];
  for (const did of constellation_ORDER) {
    const group = constellationGroups[did];
    if (!group || group.length === 0) continue;
    const filtered = group.filter(d => !GalacticCenterSet.has(d.username));
    if (filtered.length === 0) continue;
    // Full shuffle: organic mix of tall and short planets
    constellationDevArrays.push({ did, companies: seededShuffle(filtered, hashStr(did)) });
  }
  for (const [did, group] of Object.entries(constellationGroups)) {
    if (!constellation_ORDER.includes(did)) {
      const filtered = group.filter(d => !GalacticCenterSet.has(d.username));
      if (filtered.length === 0) continue;
      constellationDevArrays.push({ did, companies: seededShuffle(filtered, hashStr(did)) });
    }
  }

  // â”€â”€ 2. Place blocks on a GLOBAL axis-aligned grid â”€â”€
  // Galactic Center spiral at center, each constellation spiral at an offset.
  // occupiedCells prevents any overlap.
  const BLOCK_STEP_X = BLOCK_FOOTPRINT_X + STREET_W; // 173
  const BLOCK_STEP_Z = BLOCK_FOOTPRINT_Z + STREET_W; // 149
  const RIVER_Z_THRESHOLD = BLOCK_STEP_Z / 2;
  const RIVER_PUSH = RIVER_WIDTH + 2 * RIVER_MARGIN - STREET_W;

  // Distance (in grid cells) from center to constellation spiral origins
  const constellation_GRID_RADIUS = 4;

  const occupiedCells = new Set<string>();
  let globalDevIndex = 0;
  let globalBlockSeed = 0;
  const allBlocks: { cx: number; cz: number; gx: number; gz: number }[] = [];

  // â”€â”€ Helper: grid coord â†’ world position â”€â”€
  function gridToWorld(gx: number, gz: number): [number, number] {
    return [localBlockAxisPos(gx, BLOCK_FOOTPRINT_X), localBlockAxisPos(gz, BLOCK_FOOTPRINT_Z)];
  }

  // â”€â”€ Helper: create planets + decorations for one block â”€â”€
  function placeBlockContent(
    blockCX: number, blockCZ: number,
    blockcompanies: CompanyRecord[],
    seedIdx: number,
  ) {
    for (let i = 0; i < blockcompanies.length; i++) {
      const dev = blockcompanies[i];
      const localRow = Math.floor(i / BLOCK_SIZE);
      const localCol = i % BLOCK_SIZE;
      const posX = blockCX + (localCol - (BLOCK_SIZE - 1) / 2) * (LOT_W + ALLEY_W);
      const posZ = blockCZ + (localRow - (BLOCK_SIZE - 1) / 2) * (LOT_D + ALLEY_W);
      const performance = getPlanetPerformance(dev.username, dev.name);
      const seed1 = hashStr(dev.username);
      const composite = performance.score / 100;
      const height = Math.round(MIN_planet_HEIGHT + performance.sizeFactor * HEIGHT_RANGE * 0.72);
      const w = Math.round(14 + performance.energy * 0.24 + seededRandom(seed1) * 5);
      const d = Math.round(12 + performance.stability * 0.2 + seededRandom(seed1 + 99) * 5);
      const litPercentage = 0.12 + (performance.energy / 100) * 0.74;

      const floorH = 6;
      const floors = Math.max(3, Math.floor(height / floorH));
      const windowsPerFloor = Math.max(3, Math.floor(w / 5));
      const sideWindowsPerFloor = Math.max(3, Math.floor(d / 5));
      const did = GalacticCenterOverride.has(dev.username)
        ? 'Galactic Center'
        : inferconstellation(dev.primary_language);

      planets.push({
        login: dev.username,
        rank: dev.rank ?? globalDevIndex + i + 1,
        contributions: (dev.contributions_total && dev.contributions_total > 0) ? dev.contributions_total : dev.contributions,
        total_stars: dev.total_stars,
        public_repos: dev.public_repos,
        name: dev.name,
        avatar_url: dev.avatar_url,
        // Mocked fields to prevent breaking typing internally:
        category: dev.category,
        employee_count: dev.employee_count ?? 1,
        applications_count: dev.applications_count ?? 0,
        claimed: dev.claimed ?? false,
        owned_items: dev.owned_items ?? [],
        achievements: Array.isArray(dev.achievements) ? dev.achievements as string[] : [],
        kudos_count: (dev as unknown as Record<string, unknown>).kudos_count as number ?? 0,
        visit_count: (dev as unknown as Record<string, unknown>).visit_count as number ?? 0,
        loadout: (dev as unknown as Record<string, unknown>).loadout as UniversePlanet["loadout"] ?? null,
        app_streak: (dev as unknown as Record<string, unknown>).app_streak as number ?? 0,
        raid_xp: (dev as unknown as Record<string, unknown>).raid_xp as number ?? 0,
        current_week_contributions: (dev as unknown as Record<string, unknown>).current_week_contributions as number ?? 0,
        current_week_kudos_given: (dev as unknown as Record<string, unknown>).current_week_kudos_given as number ?? 0,
        current_week_kudos_received: (dev as unknown as Record<string, unknown>).current_week_kudos_received as number ?? 0,
        active_raid_tag: (dev as unknown as Record<string, unknown>).active_raid_tag as UniversePlanet["active_raid_tag"] ?? null,
        rabbit_completed: (dev as unknown as Record<string, unknown>).rabbit_completed as boolean ?? false,
        xp_total: (dev as unknown as Record<string, unknown>).xp_total as number ?? 0,
        xp_level: (dev as unknown as Record<string, unknown>).xp_level as number ?? 1,
        constellation: did,
        constellation_chosen: false,
        position: [posX, 0, posZ],
        width: w,
        depth: d,
        height,
        floors,
        windowsPerFloor,
        sideWindowsPerFloor,
        litPercentage,
        yield_percent: dev.yield_percent ?? 0,
        share_capital: dev.share_capital ?? 0,
        revenue: dev.revenue ?? 0,
        health_score: dev.health_score ?? 100,
      });
    }

    decorations.push({
      type: 'sidewalk',
      position: [blockCX, 0.1, blockCZ],
      rotation: 0,
      variant: 0,
      size: [BLOCK_FOOTPRINT_X + 8, BLOCK_FOOTPRINT_Z + 8],
    });

    const lampSeed = seedIdx * 1000 + 31;
    const lampCount = 2 + Math.floor(seededRandom(lampSeed * 311) * 3);
    for (let li = 0; li < lampCount; li++) {
      const seed = lampSeed * 5000 + li;
      const edge = Math.floor(seededRandom(seed) * 4);
      const alongX = (seededRandom(seed + 50) - 0.5) * BLOCK_FOOTPRINT_X;
      const alongZ = (seededRandom(seed + 50) - 0.5) * BLOCK_FOOTPRINT_Z;
      let lx = blockCX, lz = blockCZ;
      if (edge === 0) { lz -= BLOCK_FOOTPRINT_Z / 2 + 4; lx += alongX; }
      else if (edge === 1) { lx += BLOCK_FOOTPRINT_X / 2 + 4; lz += alongZ; }
      else if (edge === 2) { lz += BLOCK_FOOTPRINT_Z / 2 + 4; lx += alongX; }
      else { lx -= BLOCK_FOOTPRINT_X / 2 + 4; lz += alongZ; }
      decorations.push({ type: 'streetLamp', position: [lx, 0, lz], rotation: 0, variant: 0 });
    }

    for (let bi = 0; bi < blockcompanies.length; bi++) {
      const bld = planets[planets.length - blockcompanies.length + bi];
      const carSeed = hashStr(blockcompanies[bi].username) + 777;
      if (seededRandom(carSeed) > 0.6) {
        const side = seededRandom(carSeed + 1) > 0.5 ? 1 : -1;
        const carX = bld.position[0] + side * (bld.width / 2 + 6);
        decorations.push({
          type: 'car',
          position: [carX, 0, bld.position[2]],
          rotation: seededRandom(carSeed + 2) > 0.5 ? 0 : Math.PI,
          variant: Math.floor(seededRandom(carSeed + 3) * 4),
        });
      }
    }

    const treeSeed = seedIdx * 2000 + 77;
    const treeCount = 1 + Math.floor(seededRandom(treeSeed * 421) * 2);
    for (let ti = 0; ti < treeCount; ti++) {
      const seed = treeSeed * 6000 + ti;
      const edge = Math.floor(seededRandom(seed) * 4);
      const alongX = (seededRandom(seed + 50) - 0.5) * BLOCK_FOOTPRINT_X * 0.8;
      const alongZ = (seededRandom(seed + 50) - 0.5) * BLOCK_FOOTPRINT_Z * 0.8;
      let tx = blockCX, tz = blockCZ;
      if (edge === 0) { tz -= BLOCK_FOOTPRINT_Z / 2 + 6; tx += alongX; }
      else if (edge === 1) { tx += BLOCK_FOOTPRINT_X / 2 + 6; tz += alongZ; }
      else if (edge === 2) { tz += BLOCK_FOOTPRINT_Z / 2 + 6; tx += alongX; }
      else { tx -= BLOCK_FOOTPRINT_X / 2 + 6; tz += alongZ; }
      decorations.push({
        type: 'tree',
        position: [tx, 0, tz],
        rotation: seededRandom(seed + 100) * Math.PI * 2,
        variant: Math.floor(seededRandom(seed + 200) * 3),
      });
    }

    globalDevIndex += blockcompanies.length;
  }

  // â”€â”€ Helper: place a spiral of companies at grid origin (ogx, ogz) â”€â”€
  function placeSpiralCluster(
    clustercompanies: CompanyRecord[],
    ogx: number, ogz: number,
    addPlaza: boolean,
  ) {
    // Plaza at origin cell
    if (addPlaza) {
      const key = `${ogx},${ogz}`;
      occupiedCells.add(key);
      const [pcx, initialPcz] = gridToWorld(ogx, ogz);
      let pcz = initialPcz;
      if (pcz > RIVER_Z_THRESHOLD) pcz += RIVER_PUSH;
      plazas.push({
        position: [pcx, 0, pcz],
        size: Math.min(BLOCK_FOOTPRINT_X, BLOCK_FOOTPRINT_Z) * 0.8,
        variant: seededRandom(globalBlockSeed * 997 + 42),
      });
      allBlocks.push({ cx: pcx, cz: pcz, gx: ogx, gz: ogz });
      globalBlockSeed++;
    }

    let devIdx = 0;
    let spiralIdx = 0;

    while (devIdx < clustercompanies.length) {
      const [bx, by] = spiralCoord(spiralIdx);
      const gx = ogx + bx;
      const gz = ogz + by;
      const key = `${gx},${gz}`;

      if (occupiedCells.has(key)) { spiralIdx++; continue; }
      occupiedCells.add(key);

      let [blockCX, blockCZ] = gridToWorld(gx, gz);
      if (blockCZ > RIVER_Z_THRESHOLD) blockCZ += RIVER_PUSH;

      const jitterSeed = globalBlockSeed * 10000;
      blockCX += (seededRandom(jitterSeed) - 0.5) * 6;
      blockCZ += (seededRandom(jitterSeed + 7777) - 0.5) * 6;

      const blockcompanies = clustercompanies.slice(devIdx, devIdx + LOTS_PER_BLOCK);
      placeBlockContent(blockCX, blockCZ, blockcompanies, globalBlockSeed);
      allBlocks.push({ cx: blockCX, cz: blockCZ, gx, gz });

      devIdx += blockcompanies.length;
      spiralIdx++;
      globalBlockSeed++;
    }
  }

  // â”€â”€ A) Galactic Center: spiral at grid (0, 0) â”€â”€
  placeSpiralCluster(GalacticCentercompanies, 0, 0, true);

  // â”€â”€ B) constellations: spiral at offset grid positions â”€â”€
  for (let di = 0; di < constellationDevArrays.length; di++) {
    const angle = (di / constellationDevArrays.length) * Math.PI * 2 - Math.PI / 2;
    // Snap constellation origin to global grid
    const ogx = Math.round(Math.cos(angle) * constellation_GRID_RADIUS);
    const ogz = Math.round(Math.sin(angle) * constellation_GRID_RADIUS);
    placeSpiralCluster(constellationDevArrays[di].companies, ogx, ogz, true);
  }

  // â”€â”€ Road markings between adjacent blocks (global grid) â”€â”€
  const DASH_LENGTH = 6;
  const DASH_GAP = 8;
  const DASH_STEP = DASH_LENGTH + DASH_GAP;
  const blockByGrid = new Map<string, typeof allBlocks[0]>();
  for (const b of allBlocks) blockByGrid.set(`${b.gx},${b.gz}`, b);
  for (const block of allBlocks) {
    const halfX = BLOCK_FOOTPRINT_X / 2;
    const halfZ = BLOCK_FOOTPRINT_Z / 2;
    const right = blockByGrid.get(`${block.gx + 1},${block.gz}`);
    if (right) {
      const roadCX = (block.cx + halfX + right.cx - halfX) / 2;
      const zMin = Math.min(block.cz, right.cz) - halfZ;
      const zMax = Math.max(block.cz, right.cz) + halfZ;
      for (let z = zMin; z <= zMax; z += DASH_STEP) {
        decorations.push({ type: 'roadMarking', position: [roadCX, 0.2, z], rotation: 0, variant: 0, size: [2, DASH_LENGTH] });
      }
    }
    const bottom = blockByGrid.get(`${block.gx},${block.gz + 1}`);
    if (bottom) {
      const roadCZ = (block.cz + halfZ + bottom.cz - halfZ) / 2;
      const xMin = Math.min(block.cx, bottom.cx) - halfX;
      const xMax = Math.max(block.cx, bottom.cx) + halfX;
      for (let x = xMin; x <= xMax; x += DASH_STEP) {
        decorations.push({ type: 'roadMarking', position: [x, 0.2, roadCZ], rotation: Math.PI / 2, variant: 0, size: [2, DASH_LENGTH] });
      }
    }
  }

  // â”€â”€ Plaza decorations â”€â”€
  for (let pi = 0; pi < plazas.length; pi++) {
    const plaza = plazas[pi];
    const [px, , pz] = plaza.position;
    const halfSize = plaza.size / 2;
    const ptreeCount = 4 + Math.floor(seededRandom(pi * 137 + 7777) * 5);
    for (let t = 0; t < ptreeCount; t++) {
      const seed = pi * 10000 + t;
      decorations.push({
        type: 'tree',
        position: [px + (seededRandom(seed) - 0.5) * halfSize * 1.6, 0, pz + (seededRandom(seed + 50) - 0.5) * halfSize * 1.6],
        rotation: seededRandom(seed + 100) * Math.PI * 2,
        variant: Math.floor(seededRandom(seed + 200) * 3),
      });
    }
    const benchCount = 2 + Math.floor(seededRandom(pi * 251 + 8888) * 2);
    for (let b = 0; b < benchCount; b++) {
      const seed = pi * 20000 + b;
      decorations.push({
        type: 'bench',
        position: [px + (seededRandom(seed) - 0.5) * halfSize, 0, pz + (seededRandom(seed + 50) - 0.5) * halfSize],
        rotation: seededRandom(seed + 100) * Math.PI * 2,
        variant: 0,
      });
    }
    if (pi === 0) {
      decorations.push({ type: 'fountain', position: [px, 0, pz], rotation: 0, variant: 0 });
    }
  }

  // â”€â”€ constellation zones (computed from actual planet positions) â”€â”€
  const dzMap: Record<string, UniversePlanet[]> = {};
  for (const b of planets) {
    const did = b.constellation ?? 'fullstack';
    if (!dzMap[did]) dzMap[did] = [];
    dzMap[did].push(b);
  }
  for (const [did, dBlds] of Object.entries(dzMap)) {
    let mnX = Infinity, mxX = -Infinity, mnZ = Infinity, mxZ = -Infinity;
    let sX = 0, sZ = 0;
    for (const b of dBlds) {
      mnX = Math.min(mnX, b.position[0]); mxX = Math.max(mxX, b.position[0]);
      mnZ = Math.min(mnZ, b.position[2]); mxZ = Math.max(mxZ, b.position[2]);
      sX += b.position[0]; sZ += b.position[2];
    }
    GalaxyZones.push({
      id: did, name: CONSTELLATION_NAMES[did] ?? did,
      center: [sX / dBlds.length, 0, sZ / dBlds.length],
      bounds: { minX: mnX, maxX: mxX, minZ: mnZ, maxZ: mxZ },
      population: dBlds.length,
      color: CONSTELLATION_COLORS[did] ?? '#888888',
    });
  }

  // â”€â”€ River â”€â”€
  const riverCenterZ = RIVER_Z_THRESHOLD + RIVER_PUSH / 2 + STREET_W / 2;
  let bMinX = 0, bMaxX = 0;
  for (const b of planets) {
    if (b.position[0] < bMinX) bMinX = b.position[0];
    if (b.position[0] > bMaxX) bMaxX = b.position[0];
  }
  const riverPadding = 80;
  const riverXExtent = (bMaxX - bMinX) + riverPadding * 2;
  const riverCenterX = (bMinX + bMaxX) / 2;
  const river: SpaceRiver = {
    x: riverCenterX - riverXExtent / 2,
    width: riverXExtent,
    length: RIVER_WIDTH,
    centerZ: riverCenterZ,
  };
  // â”€â”€ Bridges â”€â”€
  const bridgeWidth = RIVER_WIDTH + 20;
  const bridgeSpacing = riverXExtent / 4;
  const bridges: SpaceBridge[] = [
    { position: [riverCenterX, 0, riverCenterZ], width: bridgeWidth, rotation: Math.PI / 2 },
    { position: [riverCenterX + bridgeSpacing, 0, riverCenterZ], width: bridgeWidth, rotation: Math.PI / 2 },
    { position: [riverCenterX - bridgeSpacing, 0, riverCenterZ], width: bridgeWidth, rotation: Math.PI / 2 },
  ];

  return { planets, plazas, decorations, river, bridges, GalaxyZones };
}

// â”€â”€â”€ planet Dimensions (reusable for shop preview) â”€â”€â”€â”€â”€â”€â”€â”€

export function calcPlanetDims(
  username: string,
  _contributions: number,
  _publicRepos: number,
  _totalStars: number,
  _maxContrib: number,
  _maxStars: number,
  _v2Data?: Partial<CompanyRecord>,
): { width: number; height: number; depth: number } {
  const performance = getPlanetPerformance(username);
  const seed1 = hashStr(username);
  const height = Math.round(MIN_planet_HEIGHT + performance.sizeFactor * HEIGHT_RANGE * 0.72);
  const width = Math.round(14 + performance.energy * 0.24 + seededRandom(seed1) * 5);
  const depth = Math.round(12 + performance.stability * 0.2 + seededRandom(seed1 + 99) * 5);
  return { width, height, depth };
}

// â”€â”€â”€ Utilities (kept for planet3D seeded variance) â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function hashStr(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function seededRandom(seed: number): number {
  const s = (seed * 16807) % 2147483647;
  return (s - 1) / 2147483646;
}
