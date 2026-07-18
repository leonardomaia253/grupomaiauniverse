"use client";

import createGlobe from "cobe";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type CompanyRecord } from "@/lib/github";

type BrandRule = {
  login: string;
  name: string;
  match: string[];
  color: string;
  scale?: number;
  forceFeatured?: boolean;
};

type PlanetNode = {
  login: string;
  name: string | null;
  color: string;
  size: number;
  x: number;
  y: number;
  mass: number;
  damage: number;
  company: CompanyRecord;
};

type FieldDot = {
  key: string;
  x: number;
  y: number;
  size: number;
  alpha: number;
  color: string;
};

type ViewMode = "mobile" | "desktop";

const TAU = Math.PI * 2;

const BRAND_RULES: BrandRule[] = [
  { login: "bilheking", name: "Bilheking", match: ["bilheking"], color: "#7c3aed", scale: 1.38, forceFeatured: true },
  { login: "volup-ai", name: "Volup AI", match: ["volupai", "volup ai", "volup-ai"], color: "#10b981", scale: 1.38, forceFeatured: true },
  { login: "spur", name: "Spur", match: ["spur"], color: "#ef233c", scale: 1.08, forceFeatured: true },
  { login: "tosi", name: "Tosi", match: ["tosi"], color: "#2563eb", scale: 1.05, forceFeatured: true },
  { login: "jack-it-fit", name: "Jack it fit", match: ["jackitfit", "jack it fit", "jack-it-fit"], color: "#111111", scale: 1.02, forceFeatured: true },
  { login: "seu-jornaleiro", name: "Seu Jornaleiro", match: ["seujornaleiro", "seu jornaleiro", "seu-jornaleiro"], color: "#f97316", forceFeatured: true },
  { login: "cattlecontrol", name: "CattleControl", match: ["cattlecontrol", "cattle control", "cattle-control"], color: "#16a34a", forceFeatured: true },
  { login: "iris", name: "Iris", match: ["iris"], color: "#facc15", forceFeatured: true },
  { login: "kinkora", name: "Kinkora", match: ["kinkora"], color: "#ec4899", forceFeatured: true },
  { login: "avantyp", name: "Avantyp", match: ["avantyp"], color: "#7f1d1d", forceFeatured: true },
  { login: "boase", name: "Boase", match: ["boase"], color: "#38bdf8", forceFeatured: true },
];

const FEATURED_LAYOUT = [
  { x: 0.5, y: 0.47 },
  { x: 0.2, y: 0.38 },
  { x: 0.8, y: 0.38 },
  { x: 0.16, y: 0.69 },
  { x: 0.84, y: 0.69 },
  { x: 0.36, y: 0.2 },
  { x: 0.64, y: 0.2 },
  { x: 0.34, y: 0.78 },
  { x: 0.66, y: 0.78 },
  { x: 0.09, y: 0.25 },
  { x: 0.91, y: 0.25 },
  { x: 0.5, y: 0.86 },
];

const MOBILE_LAYOUT = [
  { x: 0.5, y: 0.12 },
  { x: 0.28, y: 0.25 },
  { x: 0.72, y: 0.25 },
  { x: 0.32, y: 0.39 },
  { x: 0.7, y: 0.42 },
  { x: 0.26, y: 0.56 },
  { x: 0.74, y: 0.58 },
  { x: 0.34, y: 0.72 },
  { x: 0.68, y: 0.75 },
  { x: 0.28, y: 0.88 },
  { x: 0.72, y: 0.9 },
  { x: 0.5, y: 1.04 },
];

function hashString(value: string): number {
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

function normalize(value: string | null | undefined): string {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function brandForCompany(company: CompanyRecord): BrandRule | undefined {
  const candidates = [
    normalize(company.username),
    normalize(company.name),
    normalize(`${company.username} ${company.name || ""}`).replace(/\s+/g, ""),
  ];

  return BRAND_RULES.find((brand) =>
    brand.match.some((match) => {
      const normalizedMatch = normalize(match);
      const compactMatch = normalizedMatch.replace(/\s+/g, "");
      return candidates.some((candidate) => candidate === normalizedMatch || candidate.includes(normalizedMatch) || candidate.includes(compactMatch));
    }),
  );
}

function colorForCompany(company: CompanyRecord): string {
  const brand = brandForCompany(company);
  if (brand) return brand.color;
  if (company.custom_color) return company.custom_color;
  const seed = hashString(`${company.username}:${company.primary_language || company.category || ""}`);
  return `hsl(${seed % 360} ${58 + Math.round(seededUnit(seed + 3) * 24)}% ${50 + Math.round(seededUnit(seed + 7) * 18)}%)`;
}

function massForCompany(company: CompanyRecord): number {
  return (company.contributions_total || company.contributions || 0) + (company.total_stars || 0) * 2 + (company.revenue || 0) / 30000;
}

function damageForCompany(company: CompanyRecord): number {
  if (typeof company.health_score !== "number") return 0.12;
  return Math.max(0, Math.min(0.8, (100 - company.health_score) / 100));
}

function formatMetric(value: number | null | undefined, empty = "Nao informado"): string {
  if (!value || value <= 0) return empty;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${Math.round(value)}`;
}

function formatMoney(value: number | null | undefined): string {
  if (!value || value <= 0) return "Nao informado";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value);
}

function hexToRgb01(color: string): [number, number, number] {
  if (!color.startsWith("#")) return [0.08, 0.08, 0.08];
  const hex = color.length === 4 ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}` : color;
  const value = Number.parseInt(hex.slice(1), 16);
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}

function makeBrandShell(brand: BrandRule, index: number): CompanyRecord {
  return {
    id: -1000 - index,
    username: brand.login,
    external_id: null,
    name: brand.name,
    avatar_url: null,
    bio: "Dados operacionais aguardando sincronizacao. O planeta permanece fixo no mapa para preservar a arquitetura visual do Grupo Maia.",
    contributions: 0,
    public_repos: 0,
    total_stars: 0,
    primary_language: null,
    rank: null,
    fetched_at: "",
    created_at: "",
    claimed: false,
    fetch_priority: 0,
    claimed_at: null,
    owned_items: [],
    category: null,
    employee_count: 0,
    applications_count: 0,
    kudos_count: 0,
    visit_count: 0,
    contributions_total: 0,
    contribution_years: [],
    total_prs: 0,
    total_reviews: 0,
    repos_contributed_to: [],
    followers: 0,
    following: 0,
    organizations_count: 0,
    account_created_at: null,
    current_streak: 0,
    custom_color: brand.color,
    share_capital: 0,
    revenue: 0,
    health_score: 100,
  };
}

function mergeRequiredBrands(companies: CompanyRecord[]): CompanyRecord[] {
  const merged = [...companies];
  for (const [index, brand] of BRAND_RULES.entries()) {
    const exists = merged.some((company) => brandForCompany(company) === brand);
    if (!exists) merged.push(makeBrandShell(brand, index));
  }
  return merged;
}

function buildUniverse(companies: CompanyRecord[], mode: ViewMode) {
  const isMobile = mode === "mobile";
  const completeCompanies = mergeRequiredBrands(companies);
  const ranked = completeCompanies.slice().sort((a, b) => massForCompany(b) - massForCompany(a));
  const maxMass = Math.max(1, ...ranked.map(massForCompany));
  const forced = ranked.filter((company) => brandForCompany(company)?.forceFeatured);
  const top = ranked.filter((company) => !brandForCompany(company)?.forceFeatured).slice(0, Math.max(0, 12 - forced.length));
  const featuredCompanies = [...forced, ...top].slice(0, 12);

  const featured = featuredCompanies.map((company, index): PlanetNode => {
    const brand = brandForCompany(company);
    const mass = massForCompany(company);
    const layout = (isMobile ? MOBILE_LAYOUT : FEATURED_LAYOUT)[index] || { x: 0.5, y: 0.5 };
    const scale = (brand?.scale || 1) * (isMobile ? 0.72 : 1);
    const base = isMobile ? 96 : 136;
    const range = isMobile ? 58 : 96;
    return {
      login: company.username,
      name: company.name,
      color: colorForCompany(company),
      size: (base + Math.sqrt(mass / maxMass) * range) * scale,
      x: layout.x,
      y: layout.y,
      mass,
      damage: damageForCompany(company),
      company,
    };
  });

  const featuredLogins = new Set(featured.map((planet) => planet.login.toLowerCase()));
  const fieldDots = ranked
    .filter((company) => !featuredLogins.has(company.username.toLowerCase()))
    .map((company): FieldDot => {
      const seed = hashString(company.username);
      const ring = 0.25 + Math.sqrt(seededUnit(seed + 4)) * 0.75;
      const angle = seededUnit(seed + 8) * TAU;
      const massRatio = Math.sqrt(massForCompany(company) / maxMass);
      return {
        key: company.username,
        x: 0.5 + Math.cos(angle) * ring * (isMobile ? 0.43 : 0.49),
        y: 0.53 + Math.sin(angle) * ring * (isMobile ? 0.52 : 0.42),
        size: (isMobile ? 1.1 : 1.4) + massRatio * (isMobile ? 4.4 : 5.4),
        alpha: 0.2 + seededUnit(seed + 12) * 0.44,
        color: colorForCompany(company),
      };
    });

  return { featured, fieldDots, totalCompanies: completeCompanies.length };
}

function useViewMode(): ViewMode {
  const [mode, setMode] = useState<ViewMode>("desktop");

  useEffect(() => {
    const update = () => setMode(window.innerWidth < 720 ? "mobile" : "desktop");
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return mode;
}

function StarField({ dots }: { dots: FieldDot[] }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const gradient = ctx.createRadialGradient(width * 0.5, height * 0.48, 0, width * 0.5, height * 0.5, Math.max(width, height) * 0.78);
      gradient.addColorStop(0, "#151d23");
      gradient.addColorStop(0.55, "#05080b");
      gradient.addColorStop(1, "#010203");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      for (const dot of dots) {
        const x = dot.x * width;
        const y = dot.y * height;
        const r = dot.size;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, TAU);
        ctx.fillStyle = dot.color;
        ctx.globalAlpha = dot.alpha;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, r * 3.4, 0, TAU);
        ctx.globalAlpha = dot.alpha * 0.14;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [dots]);

  return <canvas ref={canvasRef} className="absolute inset-0" />;
}

function CobePlanet({
  planet,
  active,
  mode,
  onHover,
  onSelect,
}: {
  planet: PlanetNode;
  active: boolean;
  mode: ViewMode;
  onHover: (planet: PlanetNode | null) => void;
  onSelect: (planet: PlanetNode) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const phiRef = useRef(0);
  const color = hexToRgb01(planet.color);
  const markerCount = active ? 10 : 7;
  const markers = useMemo(() => {
    return Array.from({ length: markerCount }, (_, index) => {
      const seed = hashString(`${planet.login}:marker:${index}`);
      return {
        location: [-58 + seededUnit(seed + 1) * 116, -170 + seededUnit(seed + 2) * 340] as [number, number],
        size: 0.024 + seededUnit(seed + 3) * 0.04,
      };
    });
  }, [markerCount, planet.login]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let globe: ReturnType<typeof createGlobe> | null = null;
    let frame = 0;

    const resize = () => {
      const width = Math.max(1, canvas.offsetWidth);
      if (globe) globe.destroy();
      globe = createGlobe(canvas, {
        devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        width,
        height: width,
        phi: phiRef.current,
        theta: 0.18,
        dark: 0,
        diffuse: 1.6,
        mapSamples: active ? 20000 : 11000,
        mapBrightness: 10,
        baseColor: [1, 1, 1],
        markerColor: [0, 0, 0],
        glowColor: [Math.max(0.66, color[0]), Math.max(0.66, color[1]), Math.max(0.66, color[2])],
        markerElevation: 0.025,
        markers,
        opacity: 0.9,
      });
    };

    const animate = () => {
      phiRef.current += active ? 0.0048 : 0.0023;
      globe?.update({ phi: phiRef.current, theta: active ? 0.25 : 0.18 });
      frame = requestAnimationFrame(animate);
    };

    resize();
    animate();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frame);
      globe?.destroy();
    };
  }, [active, color, markers]);

  const isMobile = mode === "mobile";
  const size = planet.size * (active ? (isMobile ? 1.08 : 1.14) : 1);
  const damageLabel = planet.damage > 0.55 ? "critico" : planet.damage > 0.28 ? "instavel" : "integro";
  const damageMask = planet.damage > 0.28
    ? `radial-gradient(circle at ${28 + planet.damage * 42}% ${22 + planet.damage * 36}%, transparent 0 19%, rgba(0,0,0,${0.25 + planet.damage * 0.55}) 20% 29%, transparent 30%),
       linear-gradient(${115 + planet.damage * 80}deg, transparent 0 43%, rgba(255,255,255,${0.08 + planet.damage * 0.12}) 44% 45%, rgba(0,0,0,${0.25 + planet.damage * 0.38}) 46% 48%, transparent 49%)`
    : "none";

  if (isMobile) {
    return (
      <button
        type="button"
        className="relative isolate block text-left outline-none transition-transform duration-500 active:scale-[0.98] focus-visible:z-20"
        style={{
          width: size,
          height: size + 46,
          transform: `scale(${active ? 1.03 : 1})`,
        }}
        onClick={() => onSelect(planet)}
        aria-label={`Abrir ${planet.name || planet.login}`}
      >
        <span className="absolute inset-x-0 top-0 aspect-square rounded-full blur-2xl" style={{ backgroundColor: planet.color, opacity: active ? 0.34 : 0.16 }} />
        <span className="absolute inset-x-[7%] top-[7%] aspect-square rounded-full border border-white/10" style={{ boxShadow: `inset 0 0 34px rgba(0,0,0,0.38), 0 0 30px ${planet.color}55` }} />
        <span className="pointer-events-none absolute inset-x-[7%] top-[7%] z-10 aspect-square rounded-full mix-blend-multiply" style={{ background: damageMask, opacity: planet.damage > 0.28 ? 1 : 0 }} />
        <canvas ref={canvasRef} className="relative aspect-square w-full rounded-full opacity-95 saturate-[1.08] transition-opacity duration-700" />
        <span className="pointer-events-none absolute left-1/2 top-[76%] flex max-w-[142px] -translate-x-1/2 flex-col items-center gap-1 whitespace-nowrap">
          <span className="max-w-full truncate bg-white px-2 py-1 font-mono text-[9px] leading-none text-black shadow-[0_2px_10px_rgba(0,0,0,0.25)]">
            {planet.name || planet.login}
          </span>
          <span className="max-w-full truncate bg-black px-2 py-1 font-mono text-[8px] leading-none text-white/85">
            @{planet.login} - {damageLabel}
          </span>
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className="absolute isolate -translate-x-1/2 -translate-y-1/2 text-left outline-none transition-transform duration-500 hover:z-20 focus-visible:z-20"
      style={{
        left: `${planet.x * 100}%`,
        top: `${planet.y * 100}%`,
        width: size,
        transform: `translate(-50%, -50%) scale(${active ? 1.06 : 1})`,
      }}
      onPointerEnter={() => onHover(planet)}
      onPointerLeave={() => onHover(null)}
      onClick={() => onSelect(planet)}
      aria-label={`Abrir ${planet.name || planet.login}`}
    >
      <span className="absolute inset-0 rounded-full blur-2xl" style={{ backgroundColor: planet.color, opacity: active ? 0.33 : 0.13 }} />
      <span className="absolute inset-[7%] rounded-full border border-white/10" style={{ boxShadow: `inset 0 0 36px rgba(0,0,0,0.38), 0 0 34px ${planet.color}55` }} />
      <span className="pointer-events-none absolute inset-[7%] z-10 rounded-full mix-blend-multiply" style={{ background: damageMask, opacity: planet.damage > 0.28 ? 1 : 0 }} />
      <canvas ref={canvasRef} className="relative aspect-square w-full rounded-full opacity-95 saturate-[1.08] transition-opacity duration-700" />
      <span className="pointer-events-none absolute left-1/2 top-[82%] flex max-w-[132px] -translate-x-1/2 flex-col items-center gap-1 whitespace-nowrap sm:max-w-none">
        <span className="max-w-full truncate bg-white px-2 py-1 font-mono text-[9px] leading-none text-black shadow-[0_2px_10px_rgba(0,0,0,0.25)] sm:text-[10px]">
          {planet.name || planet.login}
        </span>
        <span className="max-w-full truncate bg-black px-2 py-1 font-mono text-[8px] leading-none text-white/85 sm:text-[9px]">
          @{planet.login} - {damageLabel}
        </span>
      </span>
    </button>
  );
}

function CompanyHud({ planet, mode, onClose }: { planet: PlanetNode; mode: ViewMode; onClose: () => void }) {
  const company = planet.company;
  const isMobile = mode === "mobile";
  const health = typeof company.health_score === "number" ? company.health_score : 100;
  const details = [
    ["Tracao", formatMetric(planet.mass)],
    ["Estrelas", formatMetric(company.total_stars)],
    ["Repositorios", formatMetric(company.public_repos)],
    ["Receita", formatMoney(company.revenue)],
    ["Capital", formatMoney(company.share_capital)],
    ["Saude", `${health}%`],
  ];

  return (
    <aside className={`pointer-events-auto ${isMobile ? "fixed bottom-3 left-3 right-3 max-h-[52svh]" : "absolute bottom-6 right-6 w-[430px]"} z-40 overflow-y-auto border border-white/12 bg-[#070808]/92 font-space shadow-2xl shadow-black/50 backdrop-blur-2xl`}>
      <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${planet.color}, rgba(255,255,255,0.18))` }} />
      <div className="p-4">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="h-11 w-11 shrink-0 rounded-full border border-white/20 shadow-lg sm:h-14 sm:w-14" style={{ background: `radial-gradient(circle at 30% 25%, white, ${planet.color} 52%, #020202 100%)`, boxShadow: `0 0 34px ${planet.color}66` }} />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.24em] text-white/42">Empresa orbital</p>
            <h3 className="mt-1 truncate text-lg font-semibold normal-case text-white sm:text-xl">{planet.name || planet.login}</h3>
            <p className="mt-1 text-xs normal-case text-white/50 sm:text-sm">@{planet.login} - dados em tempo real quando disponiveis</p>
          </div>
          <button className="grid h-8 w-8 place-items-center border border-white/12 bg-white/[0.03] text-white/55 transition hover:border-white/30 hover:text-white" onClick={onClose} aria-label="Fechar painel">
            x
          </button>
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-white/40">
            <span>Saude do negocio</span>
            <span>{health}%</span>
          </div>
          <div className="h-2 overflow-hidden bg-white/10">
            <div className="h-full" style={{ width: `${Math.max(0, Math.min(100, health))}%`, backgroundColor: planet.color }} />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden border border-white/10 bg-white/10 text-xs sm:grid-cols-3">
          {details.map(([label, value]) => (
            <div key={label} className="bg-[#080a0b] p-3">
              <p className="text-white/36">{label}</p>
              <p className="mt-2 break-words text-sm font-semibold normal-case text-white/86 sm:text-[15px]">{value}</p>
            </div>
          ))}
        </div>
        {company.bio && <p className="mt-4 border-t border-white/10 pt-3 text-xs leading-relaxed normal-case text-white/54">{company.bio}</p>}
      </div>
    </aside>
  );
}

export default function UniverseCanvas({ companies }: { companies: CompanyRecord[] }) {
  const mode = useViewMode();
  const isMobile = mode === "mobile";
  const { featured, fieldDots, totalCompanies } = useMemo(() => buildUniverse(companies, mode), [companies, mode]);
  const [hovered, setHovered] = useState<PlanetNode | null>(null);
  const [selected, setSelected] = useState<PlanetNode | null>(null);
  const active = selected || hovered;

  const handleHover = useCallback((planet: PlanetNode | null) => {
    setHovered(planet);
  }, []);

  const renderPlanets = () => {
    if (isMobile) {
      return (
        <div className="relative z-10 flex min-h-[1280px] flex-col gap-7 px-4 pb-[58svh] pt-36">
          {featured.map((planet, index) => {
            const alignment = index % 3 === 0 ? "self-center" : index % 3 === 1 ? "self-start ml-2" : "self-end mr-2";
            return (
              <div key={planet.login} className={`${alignment} max-w-[58vw]`}>
                <CobePlanet
                  planet={planet}
                  mode={mode}
                  active={active?.login === planet.login}
                  onHover={handleHover}
                  onSelect={setSelected}
                />
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <>
        {featured.map((planet) => (
          <CobePlanet
            key={planet.login}
            planet={planet}
            mode={mode}
            active={active?.login === planet.login}
            onHover={handleHover}
            onSelect={setSelected}
          />
        ))}
      </>
    );
  };

  return (
    <div className="relative h-[100svh] w-full overflow-hidden bg-[#020305]">
      <div className={`relative h-full w-full ${isMobile ? "overflow-y-auto overscroll-contain scroll-smooth" : "overflow-hidden"}`}>
        <div className={`relative w-full ${isMobile ? "min-h-[1500px]" : "h-full"}`}>
          <StarField dots={fieldDots} />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,transparent_57%,rgba(0,0,0,0.78)_100%)]" />
          <div className="pointer-events-none sticky top-0 z-20 h-44 bg-gradient-to-b from-black/80 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/80 to-transparent" />

          <div className="pointer-events-none fixed left-4 right-4 top-4 z-30 max-w-[calc(100vw-2rem)] font-space sm:absolute sm:left-8 sm:right-auto sm:top-7 sm:max-w-sm">
            <p className="text-[9px] uppercase tracking-[0.3em] text-white/38 sm:text-[10px] sm:tracking-[0.34em]">Grupo Maia Universe</p>
            <h2 className="mt-2 text-lg font-semibold normal-case text-white/90 sm:text-3xl">Mapa de empresas</h2>
            <p className="mt-2 max-w-[19rem] text-[11px] leading-relaxed normal-case text-white/48 sm:mt-3 sm:text-sm">
              {totalCompanies} empresas no campo orbital - {featured.length} globes em alta definicao.
            </p>
          </div>

          {isMobile && !selected && (
            <div className="pointer-events-none fixed bottom-3 left-1/2 z-30 -translate-x-1/2 border border-white/10 bg-black/45 px-3 py-2 font-space text-[10px] uppercase tracking-[0.18em] text-white/44 backdrop-blur-xl">
              toque para abrir
            </div>
          )}

          {renderPlanets()}
        </div>
      </div>

      {selected && <CompanyHud planet={selected} mode={mode} onClose={() => setSelected(null)} />}
    </div>
  );
}
