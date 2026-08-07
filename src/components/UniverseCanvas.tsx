"use client";

import createGlobe from "cobe";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type CompanyRecord } from "@/lib/github";

type BrandRule = {
  login: string;
  name: string;
  match: string[];
  color: string;
  sector: string;
  description: string;
  texture: "aurora" | "ember" | "ocean" | "obsidian" | "solar" | "forest" | "rose" | "ice";
  scale?: number;
  priority?: number;
  forceFeatured?: boolean;
};

type PlanetNode = {
  login: string;
  name: string | null;
  color: string;
  sector: string;
  description: string;
  texture: BrandRule["texture"];
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

type CosmicEvent = {
  id: string;
  label: string;
  detail: string;
  x: number;
  y: number;
  color: string;
};

const TAU = Math.PI * 2;

const BRAND_RULES: BrandRule[] = [
  { login: "bilheking", name: "Bilheking", match: ["bilheking"], color: "#7c3aed", sector: "Entretenimento e bilheteria", description: "Motor comercial do ecossistema, conectado a vendas, eventos e crescimento.", texture: "aurora", scale: 1.42, priority: 100, forceFeatured: true },
  { login: "volup-ai", name: "Volup AI", match: ["volupai", "volup ai", "volup-ai"], color: "#10b981", sector: "Inteligencia artificial", description: "Camada de IA aplicada a produtos, operacao e automacao do Grupo LMF.", texture: "forest", scale: 1.42, priority: 98, forceFeatured: true },
  { login: "spur", name: "Spur", match: ["spur"], color: "#ef233c", sector: "Performance e crescimento", description: "Planeta de energia vermelha, orientado a tracao e execucao.", texture: "ember", scale: 1.1, priority: 90, forceFeatured: true },
  { login: "tosi", name: "Tosi", match: ["tosi"], color: "#2563eb", sector: "Produto digital", description: "Operacao azul, focada em produto, tecnologia e confiabilidade.", texture: "ocean", scale: 1.06, priority: 88, forceFeatured: true },
  { login: "jack-it-fit", name: "Jack it fit", match: ["jackitfit", "jack it fit", "jack-it-fit"], color: "#111111", sector: "Saude e fitness", description: "Planeta obsidiana, denso e disciplinado, ligado a saude e recorrencia.", texture: "obsidian", scale: 1.03, priority: 86, forceFeatured: true },
  { login: "seu-jornaleiro", name: "Seu Jornaleiro", match: ["seujornaleiro", "seu jornaleiro", "seu-jornaleiro"], color: "#f97316", sector: "Midia e distribuicao", description: "Orbita laranja para conteudo, distribuicao e presenca local.", texture: "solar", priority: 84, forceFeatured: true },
  { login: "cattlecontrol", name: "CattleControl", match: ["cattlecontrol", "cattle control", "cattle-control"], color: "#16a34a", sector: "Agro e gestao", description: "Planeta verde de controle, campo, dados e operacao produtiva.", texture: "forest", priority: 82, forceFeatured: true },
  { login: "iris", name: "Iris", match: ["iris"], color: "#facc15", sector: "Visao e inteligencia", description: "Planeta amarelo, ligado a leitura, percepcao e clareza operacional.", texture: "solar", priority: 80, forceFeatured: true },
  { login: "kinkora", name: "Kinkora", match: ["kinkora"], color: "#ec4899", sector: "Experiencia e comunidade", description: "Planeta rosa de relacao, marca e experiencia.", texture: "rose", priority: 78, forceFeatured: true },
  { login: "avantyp", name: "Avantyp", match: ["avantyp"], color: "#7f1d1d", sector: "Estrategia e tecnologia", description: "Planeta vermelho escuro, compacto e estrategico.", texture: "ember", priority: 76, forceFeatured: true },
  { login: "boase", name: "Boase", match: ["boase"], color: "#38bdf8", sector: "Operacao e servicos", description: "Planeta azul claro, leve, orientado a servicos e conexoes.", texture: "ice", priority: 74, forceFeatured: true },
];

const PLANET_TEXTURES: Record<BrandRule["texture"], string> = {
  aurora: "radial-gradient(circle at 28% 22%, #ffffff 0 8%, transparent 18%), radial-gradient(circle at 70% 28%, rgba(167,139,250,0.95), transparent 28%), radial-gradient(circle at 34% 72%, rgba(34,211,238,0.42), transparent 30%)",
  ember: "radial-gradient(circle at 32% 20%, #fff2e8 0 7%, transparent 17%), linear-gradient(135deg, rgba(255,255,255,0.18), transparent 30%), radial-gradient(circle at 70% 68%, rgba(0,0,0,0.45), transparent 34%)",
  ocean: "radial-gradient(circle at 30% 24%, #eff6ff 0 8%, transparent 18%), radial-gradient(circle at 66% 65%, rgba(14,165,233,0.52), transparent 34%), linear-gradient(150deg, rgba(255,255,255,0.16), transparent 42%)",
  obsidian: "radial-gradient(circle at 34% 22%, rgba(255,255,255,0.9) 0 6%, transparent 16%), linear-gradient(135deg, rgba(255,255,255,0.14), transparent 26%), radial-gradient(circle at 72% 72%, rgba(0,0,0,0.8), transparent 36%)",
  solar: "radial-gradient(circle at 30% 24%, #fff7cc 0 8%, transparent 18%), radial-gradient(circle at 72% 60%, rgba(251,146,60,0.45), transparent 34%), linear-gradient(120deg, rgba(255,255,255,0.14), transparent 40%)",
  forest: "radial-gradient(circle at 28% 22%, #ecfdf5 0 8%, transparent 18%), radial-gradient(circle at 68% 70%, rgba(5,150,105,0.52), transparent 34%), linear-gradient(145deg, rgba(255,255,255,0.16), transparent 42%)",
  rose: "radial-gradient(circle at 30% 22%, #fdf2f8 0 8%, transparent 18%), radial-gradient(circle at 70% 68%, rgba(244,114,182,0.48), transparent 34%), linear-gradient(150deg, rgba(255,255,255,0.14), transparent 42%)",
  ice: "radial-gradient(circle at 30% 24%, #f0f9ff 0 8%, transparent 18%), radial-gradient(circle at 72% 66%, rgba(125,211,252,0.55), transparent 34%), linear-gradient(135deg, rgba(255,255,255,0.22), transparent 42%)",
};

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

function hasValue(value: number | null | undefined): boolean {
  return typeof value === "number" && value > 0;
}

function dataState(value: number | null | undefined): "synced" | "empty" {
  return hasValue(value) ? "synced" : "empty";
}

function planetSignal(planet: PlanetNode): { title: string; body: string; tone: string } {
  const health = typeof planet.company.health_score === "number" ? planet.company.health_score : 100;
  if (health < 55) {
    return {
      title: "Planeta em instabilidade",
      body: "A presença existe, mas a órbita pede manutenção: dados, ritmo operacional ou clareza de marca podem estar drenando energia.",
      tone: "atenção",
    };
  }
  if (planet.mass > 5000) {
    return {
      title: "Gigante em expansão",
      body: "A massa deste planeta indica tração acumulada. Bom candidato para destaque, anúncios orbitais e uma identidade visual mais autoral.",
      tone: "expansão",
    };
  }
  if (planet.company.total_stars && planet.company.total_stars > 100) {
    return {
      title: "Núcleo técnico brilhando",
      body: "O sinal de comunidade técnica está forte. A próxima melhoria é transformar reputação em narrativa visual e conversão.",
      tone: "reputação",
    };
  }
  return {
    title: "Núcleo em formação",
    body: "Este planeta já tem identidade no mapa. Personalização, histórico e campanhas podem aumentar brilho, confiança e memorabilidade.",
    tone: "origem",
  };
}

function useUniverseSfx(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);

  return useCallback((kind: "hover" | "select" | "mission") => {
    if (!enabled || typeof window === "undefined") return;
    const AudioContextCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    const ctx = ctxRef.current || new AudioContextCtor();
    ctxRef.current = ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    const frequency = kind === "select" ? 196 : kind === "mission" ? 392 : 261.63;
    osc.type = "sine";
    osc.frequency.setValueAtTime(frequency, now);
    osc.frequency.exponentialRampToValueAtTime(frequency * (kind === "select" ? 1.55 : 1.18), now + 0.16);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(kind === "hover" ? 0.018 : 0.035, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.24);
  }, [enabled]);
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
    bio: brand.description,
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
      sector: brand?.sector || company.category || "Ecossistema LMF",
      description: brand?.description || company.bio || "Empresa conectada ao campo orbital do Grupo LMF.",
      texture: brand?.texture || "ice",
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

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reduced;
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
  renderGlobe,
  dimmed,
  onHover,
  onSelect,
}: {
  planet: PlanetNode;
  active: boolean;
  mode: ViewMode;
  renderGlobe: boolean;
  dimmed: boolean;
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
    if (!canvas || !renderGlobe) return;
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
        mapSamples: mode === "mobile" ? (active ? 7000 : 4200) : active ? 18000 : 9000,
        mapBrightness: mode === "mobile" ? 8.4 : 10,
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
  }, [active, color, markers, mode, renderGlobe]);

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
        className={`relative isolate block text-left outline-none transition duration-500 active:scale-[0.98] focus-visible:z-20 ${dimmed ? "opacity-40 grayscale-[0.35]" : "opacity-100"}`}
        style={{
          width: size,
          height: size + 46,
          transform: `scale(${active ? 1.03 : 1})`,
        }}
        onClick={() => onSelect(planet)}
        aria-label={`Abrir ${planet.name || planet.login}`}
      >
        <span className="absolute inset-x-0 top-0 aspect-square rounded-full blur-2xl" style={{ backgroundColor: planet.color, opacity: active ? 0.34 : 0.16 }} />
        <span className="pointer-events-none absolute inset-x-[-6%] top-[-6%] aspect-square rounded-full border border-white/10 opacity-50" style={{ transform: "rotate(-18deg) scaleY(0.34)", boxShadow: `0 0 18px ${planet.color}33` }} />
        {active && <span className="pointer-events-none absolute right-[8%] top-[18%] h-3 w-3 rounded-full" style={{ backgroundColor: planet.color, boxShadow: `0 0 16px ${planet.color}` }} />}
        <span className="absolute inset-x-[4%] top-[4%] aspect-square rounded-full opacity-80 mix-blend-screen" style={{ background: PLANET_TEXTURES[planet.texture] }} />
        <span className="absolute inset-x-[7%] top-[7%] aspect-square rounded-full border border-white/10" style={{ boxShadow: `inset 0 0 34px rgba(0,0,0,0.38), 0 0 30px ${planet.color}55` }} />
        <span className="pointer-events-none absolute inset-x-[7%] top-[7%] z-10 aspect-square rounded-full mix-blend-multiply" style={{ background: damageMask, opacity: planet.damage > 0.28 ? 1 : 0 }} />
        {renderGlobe ? (
          <canvas ref={canvasRef} className="relative aspect-square w-full rounded-full opacity-95 saturate-[1.08] transition-opacity duration-700" />
        ) : (
          <span className="relative block aspect-square w-full rounded-full border border-white/10" style={{ background: `radial-gradient(circle at 31% 24%, rgba(255,255,255,0.92), transparent 14%), ${PLANET_TEXTURES[planet.texture]}, radial-gradient(circle at 50% 50%, ${planet.color}, #020303 72%)`, boxShadow: `inset -18px -22px 32px rgba(0,0,0,0.55), 0 0 32px ${planet.color}55` }} />
        )}
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
      className={`absolute isolate -translate-x-1/2 -translate-y-1/2 text-left outline-none transition duration-500 hover:z-20 focus-visible:z-20 ${dimmed ? "opacity-35 grayscale-[0.35]" : "opacity-100"}`}
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
      <span className="pointer-events-none absolute inset-[-7%] rounded-full border border-white/10 opacity-50" style={{ transform: "rotate(-18deg) scaleY(0.34)", boxShadow: `0 0 20px ${planet.color}33` }} />
      {active && <span className="pointer-events-none absolute right-[6%] top-[18%] h-3 w-3 rounded-full" style={{ backgroundColor: planet.color, boxShadow: `0 0 16px ${planet.color}` }} />}
      <span className="absolute inset-[4%] rounded-full opacity-80 mix-blend-screen" style={{ background: PLANET_TEXTURES[planet.texture] }} />
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
  const signal = planetSignal(planet);
  const details = [
    { label: "Tracao", value: formatMetric(planet.mass, "Em sincronizacao"), state: dataState(planet.mass) },
    { label: "Estrelas", value: formatMetric(company.total_stars, "Sem dados publicos"), state: dataState(company.total_stars) },
    { label: "Repositorios", value: formatMetric(company.public_repos, "Sem dados publicos"), state: dataState(company.public_repos) },
    { label: "Receita", value: formatMoney(company.revenue), state: dataState(company.revenue) },
    { label: "Capital", value: formatMoney(company.share_capital), state: dataState(company.share_capital) },
    { label: "Saude", value: `${health}%`, state: "synced" },
  ];
  const updatedAt = company.fetched_at ? new Date(company.fetched_at).toLocaleDateString("pt-BR") : "sincronizacao pendente";

  return (
    <aside className={`pointer-events-auto ${isMobile ? "fixed bottom-3 left-3 right-3 max-h-[68svh]" : "absolute bottom-6 right-6 w-[460px]"} z-40 overflow-y-auto border border-white/12 bg-[#070808]/92 font-space shadow-2xl shadow-black/50 backdrop-blur-2xl`}>
      <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${planet.color}, rgba(255,255,255,0.18))` }} />
      <div className="p-4">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="h-11 w-11 shrink-0 rounded-full border border-white/20 shadow-lg sm:h-14 sm:w-14" style={{ background: `radial-gradient(circle at 30% 25%, white, ${planet.color} 52%, #020202 100%)`, boxShadow: `0 0 34px ${planet.color}66` }} />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.24em] text-white/42">Planeta selecionado</p>
            <h3 className="mt-1 truncate text-lg font-semibold normal-case text-white sm:text-xl">{planet.name || planet.login}</h3>
            <p className="mt-1 text-xs normal-case text-white/50 sm:text-sm">@{planet.login} - métricas sincronizadas quando disponíveis</p>
          </div>
          <button className="grid h-10 w-10 place-items-center border border-white/12 bg-white/[0.03] text-lg text-white/65 transition hover:border-white/30 hover:text-white" onClick={onClose} aria-label="Fechar painel">
            x
          </button>
        </div>

        <div className="mt-4 border-y border-white/10 py-3">
          <p className="text-[10px] uppercase tracking-[0.22em] text-white/36">Setor</p>
          <p className="mt-1 text-sm text-white/78">{planet.sector}</p>
          <p className="mt-3 text-xs leading-relaxed text-white/54">{planet.description}</p>
          <p className="mt-3 text-[10px] uppercase tracking-[0.18em] text-white/34">Ultima atualizacao: {updatedAt}</p>
        </div>

        <div className="mt-4 border border-white/10 bg-white/[0.035] p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/38">Sinal do planeta</p>
            <span className="text-[10px] uppercase tracking-[0.18em]" style={{ color: planet.color }}>{signal.tone}</span>
          </div>
          <p className="mt-2 text-sm font-semibold normal-case text-white/82">{signal.title}</p>
          <p className="mt-2 text-xs leading-relaxed normal-case text-white/52">{signal.body}</p>
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

        <div className="mt-4 rounded-sm border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[10px] uppercase tracking-[0.22em] text-white/38">Como ler este planeta</p>
          <div className="mt-3 grid gap-2 text-[11px] leading-relaxed normal-case text-white/56 sm:grid-cols-2">
            <p><span style={{ color: planet.color }}>●</span> Tamanho combina tração, estrelas e receita.</p>
            <p><span style={{ color: planet.color }}>●</span> Brilho indica força visual da marca.</p>
            <p><span style={{ color: planet.color }}>●</span> Saúde baixa cria marcas de instabilidade.</p>
            <p><span style={{ color: planet.color }}>●</span> Setor define a órbita narrativa.</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden border border-white/10 bg-white/10 text-xs sm:grid-cols-3">
          {details.map(({ label, value, state }) => (
            <div key={label} className="bg-[#080a0b] p-3">
              <p className="text-white/36">{label}</p>
              <p className={`mt-2 break-words text-sm font-semibold normal-case sm:text-[15px] ${state === "empty" ? "text-white/46" : "text-white/86"}`}>{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-2 text-[10px] uppercase tracking-[0.16em] sm:grid-cols-2">
          <a className="border border-white/10 px-3 py-2 text-center text-white/72 transition hover:border-white/25 hover:text-white" href={`/dev/${planet.login}`}>Abrir perfil</a>
          <a className="border border-white/10 px-3 py-2 text-center text-white/52 transition hover:border-white/25 hover:text-white" href={`/shop/${planet.login}`}>Estúdio do planeta</a>
          <a className="border border-white/10 px-3 py-2 text-center text-white/52 transition hover:border-white/25 hover:text-white" href={`/advertise?planet=${planet.login}`}>Anunciar aqui</a>
          <a className="border border-white/10 px-3 py-2 text-center text-white/52 transition hover:border-white/25 hover:text-white" href={`https://github.com/${planet.login}`} target="_blank" rel="noreferrer">GitHub</a>
        </div>
      </div>
    </aside>
  );
}

function UniverseHero({
  totalCompanies,
  featuredCount,
  isMobile,
}: {
  totalCompanies: number;
  featuredCount: number;
  isMobile: boolean;
}) {
  return (
    <section className="pointer-events-auto fixed left-4 right-4 top-4 z-30 max-w-[calc(100vw-2rem)] font-space sm:absolute sm:left-8 sm:right-auto sm:top-7 sm:max-w-md">
      <div className="border border-white/10 bg-black/42 p-3 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:p-5">
        <p className="text-[9px] uppercase tracking-[0.3em] text-white/38 sm:text-[10px] sm:tracking-[0.34em]">Grupo LMF Universe</p>
        <h1 className="mt-2 text-xl font-semibold leading-tight normal-case text-white sm:text-4xl">
          Transforme empresas em planetas vivos.
        </h1>
        <p className="mt-2 max-w-[24rem] text-[11px] leading-relaxed normal-case text-white/58 sm:mt-3 sm:text-sm">
          Explore tração, presença, saúde e identidade em um universo 3D. Clique em um planeta para entender os dados e agir.
        </p>
        <div className="mt-3 grid grid-cols-3 gap-px overflow-hidden border border-white/10 bg-white/10 text-center sm:mt-4">
          <div className="bg-[#070808]/95 px-2 py-3">
            <p className="text-base font-semibold text-white">{totalCompanies}</p>
            <p className="mt-1 text-[9px] uppercase tracking-[0.16em] text-white/36">empresas</p>
          </div>
          <div className="bg-[#070808]/95 px-2 py-3">
            <p className="text-base font-semibold text-white">{featuredCount}</p>
            <p className="mt-1 text-[9px] uppercase tracking-[0.16em] text-white/36">destaques</p>
          </div>
          <div className="bg-[#070808]/95 px-2 py-3">
            <p className="text-base font-semibold text-white">3D</p>
            <p className="mt-1 text-[9px] uppercase tracking-[0.16em] text-white/36">mapa vivo</p>
          </div>
        </div>
        {!isMobile && (
          <div className="mt-4 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.16em]">
            <a className="border border-white/15 bg-white/[0.06] px-3 py-2 text-white/74 transition hover:border-white/30 hover:text-white" href="/shop">Meu planeta</a>
            <a className="border border-white/15 bg-white/[0.03] px-3 py-2 text-white/54 transition hover:border-white/30 hover:text-white" href="/advertise">Anunciar</a>
            <a className="border border-white/15 bg-white/[0.03] px-3 py-2 text-white/54 transition hover:border-white/30 hover:text-white" href="/leaderboard">Ranking</a>
          </div>
        )}
      </div>
    </section>
  );
}

function UniverseLegend({ isMobile }: { isMobile: boolean }) {
  if (isMobile) return null;
  const rows = [
    ["Tamanho", "tração + estrelas + receita"],
    ["Cor", "marca, setor ou identidade customizada"],
    ["Marcas", "saúde operacional baixa"],
    ["Órbita", "posição narrativa no ecossistema"],
  ];

  return (
    <aside className="pointer-events-none absolute bottom-6 left-8 z-30 w-80 border border-white/10 bg-black/38 p-4 font-space backdrop-blur-2xl">
      <p className="text-[10px] uppercase tracking-[0.24em] text-white/38">Legenda do universo</p>
      <div className="mt-3 space-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-4 text-[11px] leading-relaxed">
            <span className="text-white/72">{label}</span>
            <span className="max-w-[12rem] text-right normal-case text-white/44">{value}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}

function OnboardingRail({ isMobile }: { isMobile: boolean }) {
  if (isMobile) return null;
  const steps = [
    ["01", "Busque", "Encontre uma empresa ou explore os destaques."],
    ["02", "Abra", "Clique no planeta para ver métricas e contexto."],
    ["03", "Aja", "Visite perfil, personalize, compare ou anuncie."],
  ];

  return (
    <div className="pointer-events-none absolute right-8 top-24 z-20 hidden w-72 space-y-2 font-space xl:block">
      {steps.map(([n, title, desc]) => (
        <div key={n} className="border border-white/10 bg-black/24 p-3 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-white/34">{n}</span>
            <span className="text-[11px] uppercase tracking-[0.2em] text-white/64">{title}</span>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed normal-case text-white/42">{desc}</p>
        </div>
      ))}
    </div>
  );
}

function CosmicEventsLayer({ events, reducedMotion }: { events: CosmicEvent[]; reducedMotion: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {events.map((event) => (
        <div
          key={event.id}
          className="absolute hidden -translate-x-1/2 -translate-y-1/2 items-center gap-2 font-space text-[10px] uppercase tracking-[0.16em] text-white/54 sm:flex"
          style={{ left: `${event.x * 100}%`, top: `${event.y * 100}%` }}
        >
          <span
            className={`h-2 w-2 rounded-full ${reducedMotion ? "" : "animate-ping"}`}
            style={{ backgroundColor: event.color, boxShadow: `0 0 22px ${event.color}` }}
          />
          <span className="border border-white/10 bg-black/35 px-2 py-1 backdrop-blur-xl">
            {event.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function MissionRail({
  isMobile,
  hasSelected,
  hasSearched,
}: {
  isMobile: boolean;
  hasSelected: boolean;
  hasSearched: boolean;
}) {
  const missions = [
    { label: "Localize uma marca", done: hasSearched, hint: "Use a busca por nome, @login ou setor." },
    { label: "Abra um planeta", done: hasSelected, hint: "Clique para revelar contexto e métricas." },
    { label: "Escolha uma ação", done: hasSelected, hint: "Perfil, estúdio ou anúncio orbital." },
  ];

  return (
    <aside className={`${isMobile ? "fixed bottom-3 left-3 right-3 z-30" : "absolute bottom-6 left-[23rem] z-30 w-80"} pointer-events-auto border border-white/10 bg-black/38 p-3 font-space backdrop-blur-2xl`}>
      <p className="text-[10px] uppercase tracking-[0.24em] text-white/38">Missões iniciais</p>
      <div className="mt-3 grid gap-2">
        {missions.map((mission, index) => (
          <div key={mission.label} className="flex items-start gap-3 text-[11px]">
            <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center border ${mission.done ? "border-lime-300 bg-lime-300 text-black" : "border-white/12 text-white/36"}`}>
              {mission.done ? "✓" : index + 1}
            </span>
            <div>
              <p className="uppercase tracking-[0.16em] text-white/70">{mission.label}</p>
              <p className="mt-1 normal-case leading-relaxed text-white/42">{mission.hint}</p>
            </div>
          </div>
        ))}
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
  const [query, setQuery] = useState("");
  const [hasSelectedOnce, setHasSelectedOnce] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const active = selected || hovered;
  const reducedMotion = usePrefersReducedMotion();
  const playSfx = useUniverseSfx(soundEnabled && !reducedMotion);
  const normalizedQuery = normalize(query);
  const visiblePlanets = useMemo(() => {
    if (!normalizedQuery) return featured;
    return featured.filter((planet) =>
      normalize(`${planet.name || ""} ${planet.login} ${planet.sector}`).includes(normalizedQuery),
    );
  }, [featured, normalizedQuery]);

  const handleHover = useCallback((planet: PlanetNode | null) => {
    setHovered(planet);
    if (planet) playSfx("hover");
  }, [playSfx]);

  const handleSelect = useCallback((planet: PlanetNode) => {
    setSelected(planet);
    setHasSelectedOnce(true);
    playSfx("select");
  }, [playSfx]);

  const cosmicEvents = useMemo<CosmicEvent[]>(() => {
    const source = featured.slice(0, 4);
    return source.map((planet, index) => ({
      id: `${planet.login}-signal`,
      label: index === 0 ? "cometa de tração" : index === 1 ? "pulso de marca" : index === 2 ? "órbita ativa" : "sinal vivo",
      detail: planet.sector,
      x: Math.max(0.08, Math.min(0.92, planet.x + (index % 2 === 0 ? 0.09 : -0.08))),
      y: Math.max(0.12, Math.min(0.88, planet.y + (index % 2 === 0 ? -0.08 : 0.09))),
      color: planet.color,
    }));
  }, [featured]);

  useEffect(() => {
    if (reducedMotion || selected || hovered || featured.length === 0) return;
    const lead = featured.find((planet) => normalize(planet.login).includes("bilheking")) || featured[0];
    const start = window.setTimeout(() => setHovered(lead), 120);
    const end = window.setTimeout(() => setHovered(null), 1920);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(end);
    };
  }, [featured, hovered, reducedMotion, selected]);

  const renderPlanets = () => {
    if (isMobile) {
      return (
        <div className="relative z-10 flex min-h-[1280px] flex-col gap-7 px-4 pb-[58svh] pt-[300px]">
          {visiblePlanets.map((planet, index) => {
            const alignment = index % 3 === 0 ? "self-center" : index % 3 === 1 ? "self-start ml-2" : "self-end mr-2";
            const isFocused = active?.login === planet.login;
            return (
              <div key={planet.login} className={`${alignment} max-w-[58vw] transition-opacity duration-300 ${active && !isFocused ? "opacity-40" : "opacity-100"}`}>
                <CobePlanet
                  planet={planet}
                  mode={mode}
                  active={isFocused}
                  renderGlobe={!reducedMotion && (index < 2 || isFocused)}
                  dimmed={Boolean(active && !isFocused)}
                  onHover={handleHover}
                  onSelect={handleSelect}
                />
              </div>
            );
          })}
          {visiblePlanets.length === 0 && (
            <div className="mx-auto mt-20 max-w-xs border border-white/10 bg-black/35 p-4 text-center font-space text-xs text-white/50 backdrop-blur-xl">
              Nenhuma empresa encontrada nessa orbita.
            </div>
          )}
        </div>
      );
    }

    return (
      <>
        {visiblePlanets.map((planet, index) => {
          const isFocused = active?.login === planet.login;
          return (
            <div key={planet.login} className="contents">
              <CobePlanet
                planet={planet}
                mode={mode}
                active={isFocused}
                renderGlobe={!reducedMotion && (index < 8 || isFocused)}
                dimmed={Boolean(active && !isFocused)}
                onHover={handleHover}
                onSelect={handleSelect}
              />
            </div>
          );
        })}
      </>
    );
  };

  return (
    <div className="relative h-[100svh] w-full overflow-hidden bg-[#020305]">
      <div className={`relative h-full w-full ${isMobile ? "overflow-y-auto overscroll-contain scroll-smooth" : "overflow-hidden"}`}>
        <div className={`relative w-full ${isMobile ? "min-h-[1500px]" : "h-full"}`}>
          <StarField dots={fieldDots} />
          <CosmicEventsLayer events={cosmicEvents} reducedMotion={reducedMotion} />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,transparent_57%,rgba(0,0,0,0.78)_100%)]" />
          <div className="pointer-events-none sticky top-0 z-20 h-44 bg-gradient-to-b from-black/80 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/80 to-transparent" />

          <UniverseHero totalCompanies={totalCompanies} featuredCount={featured.length} isMobile={isMobile} />

          <label className="fixed left-4 right-4 top-[218px] z-30 block font-space sm:left-auto sm:right-8 sm:top-7 sm:w-72">
            <span className="sr-only">Buscar empresa</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar empresa"
              className="h-10 w-full border border-white/10 bg-black/45 px-3 text-sm text-white outline-none backdrop-blur-xl placeholder:text-white/35 focus:border-white/30"
            />
            <span className="mt-2 block text-[10px] normal-case text-white/34">
              Digite nome, @login ou setor.
            </span>
          </label>

          {isMobile && !selected && (
            <div className="pointer-events-none fixed bottom-3 left-1/2 z-30 -translate-x-1/2 border border-white/10 bg-black/45 px-3 py-2 font-space text-[10px] uppercase tracking-[0.18em] text-white/44 backdrop-blur-xl">
              toque para abrir
            </div>
          )}

          {renderPlanets()}
          <OnboardingRail isMobile={isMobile} />
          <UniverseLegend isMobile={isMobile} />
          <MissionRail isMobile={isMobile} hasSelected={hasSelectedOnce} hasSearched={Boolean(normalizedQuery)} />
        </div>
      </div>

      {selected && <CompanyHud planet={selected} mode={mode} onClose={() => setSelected(null)} />}
      {!isMobile && (
        <button
          type="button"
          onClick={() => setSoundEnabled((value) => !value)}
          className="pointer-events-auto absolute bottom-6 right-[31rem] z-30 border border-white/10 bg-black/35 px-3 py-2 font-space text-[10px] uppercase tracking-[0.16em] text-white/48 backdrop-blur-xl transition hover:border-white/25 hover:text-white"
        >
          som {soundEnabled ? "on" : "off"}
        </button>
      )}
    </div>
  );
}
