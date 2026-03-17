import type { CompanyRecord } from "@/lib/github";

export interface UniversePlanet {
  login: string;
  name: string | null;
  avatar_url: string | null;
  score: number;
  orbitIndex: number;
  
  // 3D positioning (Solar System specific)
  distance: number;
  angle: number;
  speed: number;
  inclination: number;
  
  // Instance rendering fields (Compat with InstancedPlanets)
  position: [number, number, number];
  width: number;
  height: number;
  depth: number;
  floors: number;
  windowsPerFloor: number;
  sideWindowsPerFloor: number;
  litPercentage: number;

  // Physical traits
  radius: number;
  color: string;
  hasRings: boolean;
  atmosphereDensity: number;
  isHealthy: boolean;
  yield_percent: number;
  
  // Original record ref
  raw: CompanyRecord;
}

export interface SolarSystem {
  planets: UniversePlanet[];
  sunRadius: number;
}

// Deterministic random helpers (mirrored from github.ts)
function hashStr(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function seededRandom(seed: number): number {
  const s = (seed * 16807) % 2147483647;
  return (s - 1) / 2147483646;
}

const ORBIT_GAP = 50;
const INNER_ORBIT = 150;

export function generateSolarSystem(companies: CompanyRecord[]): SolarSystem {
  // Sort by some metric to determine orbital distance (inner = higher rank)
  const sorted = [...companies].sort((a, b) => b.contributions - a.contributions);
  
  const planets: UniversePlanet[] = sorted.map((dev, i) => {
    const seed = hashStr(dev.username);
    const rand = (s: number) => seededRandom(seed + s);
    
    // Orbital path
    const distance = INNER_ORBIT + i * ORBIT_GAP + rand(1) * (ORBIT_GAP * 0.4);
    const angle = rand(2) * Math.PI * 2;
    // Kepler's third law approximation: speed ~ 1/sqrt(r)
    const speed = (0.5 + rand(3) * 0.5) * (1 / Math.sqrt(distance)) * 5;
    const inclination = (rand(4) - 0.5) * 0.1; // Slight wobbles
    
    // Physical traits based on stats
    const sizeScore = Math.min(1, dev.contributions / 5000);
    const radius = 8 + sizeScore * 22 + rand(5) * 4;
    
    // Color based on primary language (legacy from Universe constellations)
    const colors = ["#3b82f6", "#ef4444", "#a855f7", "#22c55e", "#06b6d4", "#f97316"];
    const color = colors[seed % colors.length];

    // Position in 3D (will be updated every frame by the animation system, 
    // but we need an initial one for the InstancedPlanets setup)
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    const y = Math.sin(inclination) * distance;
    
    return {
      login: dev.username,
      name: dev.name,
      avatar_url: dev.avatar_url,
      score: dev.contributions,
      orbitIndex: i,
      distance,
      angle,
      speed,
      inclination,
      // Rendering fields
      position: [x, y, z],
      width: radius * 2,
      height: radius * 2,
      depth: radius * 2,
      floors: 1,
      windowsPerFloor: 0,
      sideWindowsPerFloor: 0,
      litPercentage: 0,
      // Physical traits
      radius,
      color,
      hasRings: dev.total_stars > 1000,
      atmosphereDensity: Math.min(1, dev.public_repos / 100),
      isHealthy: (dev.yield_percent ?? 0) >= 0,
      yield_percent: dev.yield_percent ?? 0,
      raw: dev
    };
  });

  return {
    planets,
    sunRadius: 60
  };
}

