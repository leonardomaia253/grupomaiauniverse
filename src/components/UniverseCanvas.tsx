"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CONSTELLATION_COLORS, CONSTELLATION_NAMES, type CompanyRecord } from "@/lib/github";

type PlanetNode = {
  login: string;
  name: string | null;
  sector: string;
  color: string;
  accentColor: string;
  x: number;
  y: number;
  radius: number;
  depth: number;
  damage: number;
  orbit: number;
  phase: number;
  mass: number;
  contributions: number;
  totalStars: number;
  company: CompanyRecord;
};

type PlanetLink = {
  source: number;
  target: number;
  opacity: number;
};

type ScreenPlanet = {
  planet: PlanetNode;
  x: number;
  y: number;
  radius: number;
};

const MAX_RENDER_LINKS = 560;
const TAU = Math.PI * 2;
const BRAND_COLORS: Array<{ match: string[]; color: string; scale?: number }> = [
  { match: ["bilheking"], color: "#7c3aed", scale: 1.55 },
  { match: ["spur"], color: "#ef233c" },
  { match: ["tosi"], color: "#2563eb" },
  { match: ["jackitfit", "jack it fit", "jack-it-fit"], color: "#050505" },
  { match: ["volupai", "volup ai", "volup-ai"], color: "#10b981", scale: 1.55 },
  { match: ["seujornaleiro", "seu jornaleiro", "seu-jornaleiro"], color: "#f97316" },
  { match: ["cattlecontrol", "cattle control", "cattle-control"], color: "#16a34a" },
  { match: ["iris"], color: "#facc15" },
  { match: ["kinkora"], color: "#ec4899" },
  { match: ["avantyp"], color: "#7f1d1d" },
  { match: ["boase"], color: "#38bdf8" },
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

function normalizeBrand(value: string | null | undefined): string {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function sectorFor(company: CompanyRecord): string {
  return company.primary_language || company.category || "Ecossistema";
}

function brandForCompany(company: CompanyRecord) {
  const candidates = [
    normalizeBrand(company.username),
    normalizeBrand(company.name),
    normalizeBrand(`${company.username} ${company.name || ""}`).replace(/\s+/g, ""),
  ];
  return BRAND_COLORS.find((brand) =>
    brand.match.some((match) => {
      const normalizedMatch = normalizeBrand(match);
      const compactMatch = normalizedMatch.replace(/\s+/g, "");
      return candidates.some((candidate) => candidate === normalizedMatch || candidate.includes(normalizedMatch) || candidate.includes(compactMatch));
    }),
  );
}

function colorForCompany(company: CompanyRecord, fallback: string): string {
  const brand = brandForCompany(company);
  if (brand) return brand.color;
  if (company.custom_color) return company.custom_color;
  const hue = (hashString(`${company.username}:${company.primary_language || company.category || ""}`) + hashString(fallback)) % 360;
  const saturation = 58 + Math.round(seededUnit(hue + 19) * 22);
  const lightness = 52 + Math.round(seededUnit(hue + 31) * 16);
  return `hsl(${hue} ${saturation}% ${lightness}%)`;
}

function sizeScaleForCompany(company: CompanyRecord): number {
  return brandForCompany(company)?.scale || 1;
}

function damageForCompany(company: CompanyRecord): number {
  if (typeof company.health_score !== "number") return 0.18;
  return Math.max(0, Math.min(0.86, (100 - company.health_score) / 100));
}

function formatMetric(value: number | null | undefined, empty = "Nao informado"): string {
  if (!value || value <= 0) return empty;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${value}`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "Sem atualizacao registrada";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sem atualizacao registrada";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function buildPlanetarium(companies: CompanyRecord[]) {
  const ranked = companies
    .slice()
    .sort((a, b) => {
      const aMass = (a.contributions_total || a.contributions || 0) + (a.total_stars || 0) * 2;
      const bMass = (b.contributions_total || b.contributions || 0) + (b.total_stars || 0) * 2;
      return bMass - aMass;
    });

  const maxMass = Math.max(
    1,
    ...ranked.map((company) => (company.contributions_total || company.contributions || 0) + (company.total_stars || 0) * 2),
  );

  const groups = new Map<string, CompanyRecord[]>();
  for (const company of ranked) {
    const sector = sectorFor(company);
    groups.set(sector, [...(groups.get(sector) || []), company]);
  }

  const groupEntries = Array.from(groups.entries()).sort((a, b) => b[1].length - a[1].length);
  const groupCenters = new Map<string, { x: number; y: number; color: string }>();
  groupEntries.forEach(([sector], index) => {
    const angle = (index / Math.max(1, groupEntries.length)) * TAU - Math.PI / 2;
    const orbit = 0.18 + Math.min(0.22, index / Math.max(1, groupEntries.length) * 0.12);
    const knownColor = CONSTELLATION_COLORS[sector] || CONSTELLATION_COLORS[sector.toLowerCase()] || undefined;
    const compact = ranked.length <= 12;
    groupCenters.set(sector, {
      x: compact ? 0.5 : 0.5 + Math.cos(angle) * orbit,
      y: compact ? 0.5 : 0.5 + Math.sin(angle) * orbit,
      color: knownColor || `hsl(${(hashString(sector) % 240) + 24} 52% 64%)`,
    });
  });

  const planets: PlanetNode[] = [];
  const nodeIndex = new Map<string, number>();
  const densityScale = ranked.length > 900 ? 0.68 : ranked.length > 520 ? 0.78 : ranked.length > 260 ? 0.88 : 1;

  for (const [sector, sectorCompanies] of groupEntries) {
    const center = groupCenters.get(sector)!;
    sectorCompanies.forEach((company, index) => {
      const seed = hashString(company.username);
      const compact = ranked.length <= 12;
      const angle = compact ? (index / Math.max(1, sectorCompanies.length)) * TAU - Math.PI / 2 : seededUnit(seed) * TAU;
      const ring = Math.sqrt((index + 1) / Math.max(1, sectorCompanies.length));
      const depth = 0.78 + seededUnit(seed + 29) * 0.58;
      const spreadJitter = 0.82 + seededUnit(seed + 41) * 0.7;
      const spread = (compact ? 0.03 + ring * 0.058 : 0.055 + ring * (0.11 + Math.min(0.08, sectorCompanies.length / 2200))) * spreadJitter;
      const mass = (company.contributions_total || company.contributions || 0) + (company.total_stars || 0) * 2;
      const brandScale = sizeScaleForCompany(company);
      const planet: PlanetNode = {
        login: company.username,
        name: company.name,
        sector,
        color: colorForCompany(company, center.color),
        accentColor: center.color,
        x: Math.min(0.91, Math.max(0.09, center.x + Math.cos(angle) * spread)),
        y: Math.min(0.83, Math.max(0.17, center.y + Math.sin(angle) * spread)),
        radius: ((compact ? 26 : 6.5) + Math.pow(mass / maxMass, 0.5) * (compact ? 46 : 34)) * depth * brandScale * densityScale,
        depth,
        damage: damageForCompany(company),
        orbit: 0.8 + seededUnit(seed + 7) * 1.7,
        phase: seededUnit(seed + 13) * TAU,
        mass,
        contributions: company.contributions_total || company.contributions || 0,
        totalStars: company.total_stars || 0,
        company,
      };
      nodeIndex.set(planet.login.toLowerCase(), planets.length);
      planets.push(planet);
    });
  }

  const links: PlanetLink[] = [];
  for (const [, sectorCompanies] of groupEntries) {
    const visible = sectorCompanies
      .map((company) => nodeIndex.get(company.username.toLowerCase()))
      .filter((index): index is number => typeof index === "number");
    const hub = visible[0];
    if (hub === undefined) continue;
    for (let i = 1; i < visible.length && links.length < MAX_RENDER_LINKS; i += 2) {
      links.push({ source: hub, target: visible[i], opacity: Math.max(0.05, 0.22 - i / visible.length * 0.16) });
    }
  }

  return {
    planets,
    links,
    sectors: groupEntries.map(([id, items]) => ({
      id,
      count: items.length,
      color: groupCenters.get(id)!.color,
    })),
  };
}

function drawGlobe(
  ctx: CanvasRenderingContext2D,
  planet: PlanetNode,
  x: number,
  y: number,
  time: number,
  active: boolean,
) {
  const r = planet.radius * (active ? 1.48 : 1);
  const longitudeShift = (time * 0.00018 * planet.orbit + planet.phase) % TAU;

  const glow = ctx.createRadialGradient(x - r * 0.35, y - r * 0.45, r * 0.1, x, y, r * 2.2);
  glow.addColorStop(0, "rgba(255,255,255,0.34)");
  glow.addColorStop(0.18, planet.color);
  glow.addColorStop(0.42, active ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.07)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.beginPath();
  ctx.arc(x, y, r * (active ? 2.35 : 1.95), 0, TAU);
  ctx.fillStyle = glow;
  ctx.globalAlpha = active ? 0.95 : 0.62;
  ctx.fill();

  const body = ctx.createRadialGradient(x - r * 0.42, y - r * 0.48, r * 0.08, x + r * 0.32, y + r * 0.36, r * 1.2);
  body.addColorStop(0, "rgba(255,255,255,0.98)");
  body.addColorStop(0.18, "rgba(245,242,234,0.95)");
  body.addColorStop(0.45, planet.color);
  body.addColorStop(0.74, "rgba(74,76,78,0.92)");
  body.addColorStop(1, "rgba(7,8,9,0.98)");

  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fillStyle = body;
  ctx.globalAlpha = 1;
  ctx.fill();
  ctx.clip();

  ctx.strokeStyle = active ? "rgba(12,14,16,0.34)" : "rgba(12,14,16,0.24)";
  ctx.lineWidth = Math.max(0.5, r * 0.026);
  for (let i = -2; i <= 2; i++) {
    const yy = y + (i * r) / 3.2;
    const h = Math.sqrt(Math.max(0, r * r - (yy - y) * (yy - y)));
    ctx.beginPath();
    ctx.ellipse(x, yy, h, Math.max(1, r * 0.1), 0, 0, TAU);
    ctx.stroke();
  }
  for (let i = 0; i < 4; i++) {
    const angle = longitudeShift + (i * Math.PI) / 4;
    ctx.beginPath();
    ctx.ellipse(x, y, Math.abs(Math.cos(angle)) * r, r, 0, 0, TAU);
    ctx.stroke();
  }

  for (let i = 0; i < 3; i++) {
    const markerAngle = longitudeShift + planet.phase * 0.37 + i * 2.1;
    const markerY = y + Math.sin(markerAngle * 0.74) * r * 0.42;
    const markerX = x + Math.cos(markerAngle) * r * 0.46;
    const markerSize = Math.max(1.4, r * 0.055);
    ctx.beginPath();
    ctx.arc(markerX, markerY, markerSize, 0, TAU);
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(markerX, markerY, markerSize * 2.1, 0, TAU);
    ctx.strokeStyle = "rgba(255,255,255,0.34)";
    ctx.lineWidth = 0.65;
    ctx.stroke();
  }

  const scarCount = Math.round(planet.damage * 7);
  for (let i = 0; i < scarCount; i++) {
    const scarSeed = hashString(`${planet.login}:scar:${i}`);
    const scarAngle = longitudeShift * 0.45 + seededUnit(scarSeed) * TAU;
    const scarDistance = (0.12 + seededUnit(scarSeed + 3) * 0.62) * r;
    const scarX = x + Math.cos(scarAngle) * scarDistance;
    const scarY = y + Math.sin(scarAngle * 1.3) * scarDistance * 0.72;
    const scarSize = r * (0.05 + seededUnit(scarSeed + 5) * 0.11);
    ctx.beginPath();
    ctx.ellipse(scarX, scarY, scarSize * 1.45, scarSize * 0.72, scarAngle, 0, TAU);
    ctx.fillStyle = `rgba(0,0,0,${0.18 + planet.damage * 0.42})`;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(scarX - Math.cos(scarAngle) * scarSize * 1.7, scarY - Math.sin(scarAngle) * scarSize);
    ctx.lineTo(scarX + Math.cos(scarAngle) * scarSize * 1.9, scarY + Math.sin(scarAngle) * scarSize);
    ctx.strokeStyle = `rgba(255,255,255,${0.08 + planet.damage * 0.18})`;
    ctx.lineWidth = Math.max(0.7, r * 0.018);
    ctx.stroke();
  }

  const shade = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
  shade.addColorStop(0, "rgba(255,255,255,0)");
  shade.addColorStop(0.54, "rgba(0,0,0,0.08)");
  shade.addColorStop(1, "rgba(0,0,0,0.56)");
  ctx.fillStyle = shade;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();

  ctx.beginPath();
  ctx.arc(x, y, r + 0.65, 0, TAU);
  ctx.strokeStyle = active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.28)";
  ctx.lineWidth = active ? 1.4 : 0.7;
  ctx.stroke();

  if (active) {
    ctx.beginPath();
    ctx.arc(x, y, r + 5, 0, TAU);
    ctx.strokeStyle = planet.accentColor;
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

export default function UniverseCanvas({
  companies,
}: {
  companies: CompanyRecord[];
  flyMode?: boolean;
  flyVehicle?: string;
  onExitFly?: () => void;
  onHud?: (speed: number, alt: number, x: number, z: number, yaw: number) => void;
  onPause?: (paused: boolean) => void;
  flyPauseSignal?: number;
  flyHasOverlay?: boolean;
  flyStartPaused?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pointerRef = useRef({ x: -1, y: -1 });
  const hoverRef = useRef<PlanetNode | null>(null);
  const screenPlanetsRef = useRef<ScreenPlanet[]>([]);
  const [hovered, setHovered] = useState<PlanetNode | null>(null);
  const [selected, setSelected] = useState<PlanetNode | null>(null);
  const planetarium = useMemo(() => buildPlanetarium(companies), [companies]);

  const findPlanetAt = useCallback((x: number, y: number) => {
    let nearest: PlanetNode | null = null;
    let nearestDistance = Infinity;
    for (const item of screenPlanetsRef.current) {
      const distance = Math.hypot(x - item.x, y - item.y);
      if (distance <= item.radius + 18 && distance < nearestDistance) {
        nearest = item.planet;
        nearestDistance = distance;
      }
    }
    return nearest;
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.35);
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const background = ctx.createRadialGradient(width * 0.52, height * 0.45, 0, width * 0.52, height * 0.48, Math.max(width, height) * 0.82);
    background.addColorStop(0, "#172432");
    background.addColorStop(0.48, "#071018");
    background.addColorStop(1, "#020305");
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.globalAlpha = 0.42;
    const starCount = width < 640 ? 48 : 90;
    for (let i = 0; i < starCount; i++) {
      const seed = i * 173;
      const x = seededUnit(seed + 1) * width;
      const y = seededUnit(seed + 2) * height;
      const size = 0.55 + seededUnit(seed + 3) * 1.25;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, TAU);
      ctx.fillStyle = `rgba(255,255,255,${0.12 + seededUnit(seed + 4) * 0.38})`;
      ctx.fill();
    }
    ctx.restore();

    const time = performance.now();
    for (const link of planetarium.links) {
      const source = planetarium.planets[link.source];
      const target = planetarium.planets[link.target];
      if (!source || !target) continue;
      ctx.beginPath();
      ctx.moveTo(source.x * width, source.y * height);
      ctx.quadraticCurveTo(
        (source.x + target.x) * width * 0.5,
        (source.y + target.y) * height * 0.5 - 18,
        target.x * width,
        target.y * height,
      );
      ctx.strokeStyle = "rgba(255,255,255,0.22)";
      ctx.globalAlpha = link.opacity;
      ctx.lineWidth = 0.55;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    let nearest: PlanetNode | null = null;
    let nearestDistance = Infinity;
    const pointer = pointerRef.current;
    const sorted = planetarium.planets.slice().sort((a, b) => a.radius - b.radius);
    const screenPlanets: ScreenPlanet[] = [];
    for (const planet of sorted) {
      const driftX = Math.sin(time * 0.00008 * planet.orbit + planet.phase) * 3.5;
      const driftY = Math.cos(time * 0.00007 * planet.orbit + planet.phase) * 2.5;
      const baseX = planet.x * width + driftX;
      const baseY = planet.y * height + driftY;
      const isSelected = selected?.login === planet.login;
      const isActive = isSelected || nearest?.login === planet.login;
      const focus = isActive ? (isSelected ? 0.18 : 0.12) : 0;
      const x = baseX + (width * 0.5 - baseX) * focus;
      const y = baseY + (height * 0.5 - baseY) * focus;
      screenPlanets.push({ planet, x, y, radius: planet.radius * (isActive ? 1.48 : 1) });
      const distance = Math.hypot(pointer.x - x, pointer.y - y);
      if (distance < planet.radius + 10 && distance < nearestDistance) {
        nearest = planet;
        nearestDistance = distance;
      }
      drawGlobe(ctx, planet, x, y, time, isActive);
    }
    screenPlanetsRef.current = screenPlanets;

    if (hoverRef.current?.login !== nearest?.login) {
      hoverRef.current = nearest;
      setHovered(nearest);
    }
  }, [planetarium, selected]);

  useEffect(() => {
    let frame = 0;
    const loop = () => {
      draw();
      frame = window.requestAnimationFrame(loop);
    };
    loop();
    return () => window.cancelAnimationFrame(frame);
  }, [draw]);

  useEffect(() => {
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [draw]);

  return (
    <div ref={containerRef} className="relative h-screen w-full overflow-hidden bg-[#020305]">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 touch-none"
        onPointerMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;
          pointerRef.current = { x, y };
          event.currentTarget.style.cursor = findPlanetAt(x, y) ? "pointer" : "default";
        }}
        onPointerDown={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;
          pointerRef.current = { x, y };
          const planet = findPlanetAt(x, y);
          if (planet) {
            hoverRef.current = planet;
            setHovered(planet);
            setSelected(planet);
          }
        }}
        onPointerLeave={() => {
          pointerRef.current = { x: -1, y: -1 };
          if (canvasRef.current) canvasRef.current.style.cursor = "default";
          hoverRef.current = null;
          setHovered(null);
        }}
        onClick={() => {
          if (hoverRef.current) setSelected(hoverRef.current);
        }}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black/65 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/70 to-transparent" />

      <div className="pointer-events-none absolute left-5 top-5 max-w-[calc(100vw-2.5rem)] font-space sm:left-8 sm:top-7">
        <p className="text-[10px] uppercase tracking-[0.34em] text-white/38">Grupo Maia Universe</p>
        <h2 className="mt-2 text-xl font-semibold normal-case text-white/88 sm:text-3xl">Mapa de empresas</h2>
        <p className="mt-3 max-w-sm text-xs leading-relaxed normal-case text-white/44 sm:text-sm">
          {planetarium.planets.length} globes conectados por presenca, tracao e capital relacional.
        </p>
      </div>

      <div className="pointer-events-none absolute right-5 top-6 hidden max-w-xs flex-wrap justify-end gap-2 sm:flex">
        {planetarium.sectors.slice(0, 6).map((sector) => (
          <div key={sector.id} className="flex items-center gap-2 border border-white/10 bg-white/[0.035] px-2.5 py-1 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: sector.color }} />
            <span className="text-[10px] normal-case text-white/46">{CONSTELLATION_NAMES[sector.id] || sector.id}</span>
          </div>
        ))}
      </div>

      {(hovered || selected) && (
        <div className="pointer-events-auto absolute bottom-4 left-4 right-4 max-h-[72vh] overflow-auto border border-white/12 bg-[#070808]/82 p-4 text-left font-space shadow-2xl shadow-black/40 backdrop-blur-2xl sm:bottom-6 sm:left-auto sm:right-6 sm:w-[410px] sm:p-5">
          {(() => {
            const planet = selected || hovered!;
            const company = planet.company;
            const updatedAt = company.fetched_at || company.created_at;
            const details = [
              { label: "Contribuicoes", value: formatMetric(planet.contributions) },
              { label: "Estrelas", value: formatMetric(planet.totalStars) },
              { label: "Repositorios", value: formatMetric(company.public_repos) },
              { label: "Funcionarios", value: formatMetric(company.employee_count) },
              { label: "Aplicacoes", value: formatMetric(company.applications_count) },
              { label: "Saude", value: typeof company.health_score === "number" ? `${company.health_score}%` : "Nao informado" },
              { label: "Superficie", value: planet.damage > 0.55 ? "Critica" : planet.damage > 0.28 ? "Instavel" : "Integra" },
            ];
            const secondary = [
              { label: "Setor", value: CONSTELLATION_NAMES[planet.sector] || planet.sector },
              { label: "Linguagem", value: company.primary_language || "Nao informado" },
              { label: "Receita", value: formatMetric(company.revenue) },
              { label: "Capital social", value: formatMetric(company.share_capital) },
            ];
            return (
              <>
                <div className="flex items-start gap-4">
                  <div
                    className="mt-0.5 h-12 w-12 shrink-0 rounded-full border border-white/18 shadow-[0_0_28px_rgba(255,255,255,0.16)]"
                    style={{
                      background:
                        `radial-gradient(circle at 30% 22%, #fff 0%, #f3efe5 24%, ${planet.color} 54%, #050607 100%)`,
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: planet.color }} />
                      <p className="truncate text-[11px] uppercase tracking-[0.22em] text-white/42">Empresa</p>
                    </div>
                    <h3 className="mt-2 truncate text-lg font-semibold leading-tight normal-case text-white sm:text-xl">
                      {planet.name || planet.login}
                    </h3>
                    <p className="mt-1 truncate text-sm normal-case text-white/52">@{planet.login}</p>
                  </div>
                  <button
                    className="pointer-events-auto grid h-8 w-8 shrink-0 place-items-center border border-white/10 bg-white/[0.04] text-sm text-white/46 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                    onClick={() => {
                      setSelected(null);
                      setHovered(null);
                      hoverRef.current = null;
                    }}
                    aria-label="Fechar detalhes"
                  >
                    x
                  </button>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 border-y border-white/10 py-3 text-xs normal-case">
                  <span className="text-white/40">Dados</span>
                  <span className="text-right text-white/68">{formatDate(updatedAt)}</span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden border border-white/10 bg-white/10 text-xs normal-case sm:grid-cols-3">
                  {details.map((item) => (
                    <div key={item.label} className="min-h-[68px] bg-[#080a0b]/95 p-3">
                      <p className="text-white/36">{item.label}</p>
                      <p className="mt-2 text-[15px] font-semibold text-white/86">{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-2 text-xs normal-case">
                  {secondary.map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-4">
                      <span className="text-white/36">{item.label}</span>
                      <span className="max-w-[62%] truncate text-right text-white/72">{item.value}</span>
                    </div>
                  ))}
                </div>

                {company.bio && (
                  <div className="mt-4 border-t border-white/10 pt-3 text-xs leading-relaxed normal-case text-white/54">
                    {company.bio}
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
