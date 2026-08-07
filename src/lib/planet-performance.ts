export type PlanetTexture =
  | "aurora"
  | "ember"
  | "ocean"
  | "obsidian"
  | "solar"
  | "forest"
  | "rose"
  | "ice";

export interface PlanetPerformance {
  score: number;
  growth: number;
  stability: number;
  energy: number;
  sizeFactor: number;
  damage: number;
  color: string;
  texture: PlanetTexture;
  status: "ascensao" | "estavel" | "alerta";
}

type PerformanceOverride = Partial<
  Pick<PlanetPerformance, "score" | "growth" | "stability" | "energy" | "color" | "texture">
>;

const PERFORMANCE_OVERRIDES: Record<string, PerformanceOverride> = {
  bilheking: { score: 94, growth: 91, stability: 82, energy: 96, color: "#7c3aed", texture: "aurora" },
  "volup-ai": { score: 91, growth: 94, stability: 86, energy: 88, color: "#10b981", texture: "forest" },
  spur: { score: 86, growth: 89, stability: 74, energy: 92, color: "#ef233c", texture: "ember" },
  tosi: { score: 82, growth: 76, stability: 90, energy: 78, color: "#2563eb", texture: "ocean" },
  "jack-it-fit": { score: 78, growth: 72, stability: 88, energy: 70, color: "#111111", texture: "obsidian" },
  "seu-jornaleiro": { score: 75, growth: 79, stability: 80, energy: 83, color: "#f97316", texture: "solar" },
  cattlecontrol: { score: 73, growth: 70, stability: 86, energy: 74, color: "#16a34a", texture: "forest" },
  iris: { score: 71, growth: 76, stability: 78, energy: 86, color: "#facc15", texture: "solar" },
  kinkora: { score: 69, growth: 81, stability: 72, energy: 84, color: "#ec4899", texture: "rose" },
  avantyp: { score: 66, growth: 65, stability: 84, energy: 68, color: "#7f1d1d", texture: "ember" },
  boase: { score: 64, growth: 67, stability: 81, energy: 72, color: "#38bdf8", texture: "ice" },
};

const TEXTURES: PlanetTexture[] = ["aurora", "ember", "ocean", "obsidian", "solar", "forest", "rose", "ice"];

export function hashPlanetSeed(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededUnit(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function clampMetric(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getPlanetPerformance(id: string, label?: string | null): PlanetPerformance {
  const key = normalizeKey(id || label || "planet");
  const seed = hashPlanetSeed(`${key}:${label ?? ""}`);
  const override = PERFORMANCE_OVERRIDES[key] ?? {};

  const score = clampMetric(override.score ?? 42 + seededUnit(seed + 11) * 52);
  const growth = clampMetric(override.growth ?? 35 + seededUnit(seed + 23) * 60);
  const stability = clampMetric(override.stability ?? 45 + seededUnit(seed + 37) * 50);
  const energy = clampMetric(override.energy ?? 40 + seededUnit(seed + 53) * 55);
  const color =
    override.color ??
    `hsl(${seed % 360} ${58 + Math.round(seededUnit(seed + 3) * 24)}% ${50 + Math.round(seededUnit(seed + 7) * 18)}%)`;
  const texture = override.texture ?? TEXTURES[seed % TEXTURES.length];
  const blended = score * 0.46 + growth * 0.24 + stability * 0.18 + energy * 0.12;
  const sizeFactor = 0.64 + Math.pow(blended / 100, 0.72) * 0.86;
  const damage = Math.max(0.04, Math.min(0.78, (100 - stability) / 115 + (growth < 45 ? 0.12 : 0)));
  const status = stability < 58 ? "alerta" : growth > 78 || score > 84 ? "ascensao" : "estavel";

  return { score, growth, stability, energy, sizeFactor, damage, color, texture, status };
}
