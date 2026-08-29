"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, Search, X } from "lucide-react";

export type CompanyRecord = {
  id: number;
  username: string;
  name: string | null;
  avatar_url: string | null;
  contributions: number;
  contributions_total: number;
  public_repos: number;
  total_stars: number;
  rank: number | null;
  claimed: boolean;
  category: string | null;
  employee_count: number;
  applications_count: number;
  total_prs: number;
  total_reviews: number;
  followers: number;
};

type CompanyProfile = {
  login: string;
  name: string;
  match: string[];
  sector: string;
  description: string;
  ownership: string;
  status?: string;
};

const PROFILES: CompanyProfile[] = [
  { login: "13-de-maio", name: "13 de Maio", match: ["13 de maio"], sector: "Imóveis", description: "Ativo patrimonial imobiliário do Grupo Maia.", ownership: "Grupo Maia" },
  { login: "abroo", name: "Abroo", match: ["abroo"], sector: "Plataforma Digital", description: "Estrutura modular para novas frentes de produto e serviço.", ownership: "Grupo Maia" },
  { login: "agrovolup", name: "Agrovolup", match: ["agrovolup", "agro volup"], sector: "Agro & IA", description: "Tecnologia e inteligência aplicadas ao agronegócio.", ownership: "Grupo Maia" },
  { login: "avantyp", name: "Avantyp", match: ["avantyp"], sector: "Estratégia & Tech", description: "Estrutura estratégica dedicada à tecnologia aplicada.", ownership: "Grupo Maia" },
  { login: "bilheking", name: "Bilheking", match: ["bilheking"], sector: "Entretenimento", description: "Tecnologia comercial para eventos, vendas e relacionamento com públicos.", ownership: "Grupo Maia" },
  { login: "boase", name: "Boase", match: ["boase"], sector: "Operação & Serv.", description: "Serviços orientados à consistência, conexão e execução.", ownership: "Grupo Maia" },
  { login: "gaslee", name: "Gaslee", match: ["gaslee"], sector: "Energia", description: "Serviços cotidianos de energia com eficiência comercial.", ownership: "Grupo Maia" },
  { login: "grupo-maia", name: "Grupo Maia", match: ["grupo maia", "holding insight hub"], sector: "Holding", description: "Governança, capital e capacidades compartilhadas para todo o ecossistema.", ownership: "Holding" },
  { login: "habitat-x", name: "Habitat X", match: ["habitat x", "habitatx"], sector: "Imóveis", description: "Espaços, moradia e produto imobiliário com identidade própria.", ownership: "Grupo Maia" },
  { login: "influarc", name: "Influarc", match: ["influarc"], sector: "Mídia", description: "Influência, conteúdo e distribuição digital.", ownership: "Grupo Maia" },
  { login: "instaboost", name: "Instaboost", match: ["instaboost"], sector: "Crescimento Social", description: "Operação de alcance e crescimento em canais sociais.", ownership: "Grupo Maia", status: "MVP" },
  { login: "iris", name: "Iris", match: ["iris", "auto law orchestra"], sector: "IA & Automação", description: "Tecnologia de leitura, percepção e clareza operacional.", ownership: "Grupo Maia" },
  { login: "jack-it-fit", name: "Jack it fit", match: ["jackitfit", "jack it fit"], sector: "Performance", description: "Operação dedicada à performance, ao cuidado e ao bem-estar.", ownership: "Grupo Maia" },
  { login: "kinkora", name: "Kinkora", match: ["kinkora", "hotjob creator hub"], sector: "Comunidade", description: "Marca, relacionamento e construção de comunidade.", ownership: "Grupo Maia" },
  { login: "lmaia", name: "LMAIA", match: ["lmaia", "leonardomaia"], sector: "Holding", description: "Estrutura de capital e governança patrimonial da família Maia.", ownership: "Grupo Maia" },
  { login: "maia-go", name: "Maia Go", match: ["maia go", "maiago", "maia smart market"], sector: "Mobilidade", description: "Mobilidade, execução e conexão entre operações.", ownership: "Grupo Maia" },
  { login: "minvest", name: "Minvest", match: ["minvest"], sector: "Investimentos", description: "Inteligência de capital e perspectiva patrimonial de longo prazo.", ownership: "Grupo Maia" },
  { login: "pipex", name: "Pipex", match: ["pipex", "leadsmaia"], sector: "Automação", description: "Fluxos, integrações e cadência entre áreas de negócio.", ownership: "Grupo Maia" },
  { login: "proto-rh", name: "PROTO.RH", match: ["proto.rh", "protorh", "smartrh"], sector: "RH & People", description: "Gente, processos e inteligência de contratação em uma plataforma.", ownership: "Grupo Maia" },
  { login: "scoreking", name: "Scoreking", match: ["scoreking"], sector: "IA & Automação", description: "Dados para leitura de performance, risco e tomada de decisão.", ownership: "Grupo Maia" },
  { login: "seu-jornaleiro", name: "Seu Jornaleiro", match: ["seujornaleiro", "seu jornaleiro"], sector: "Mídia", description: "Conteúdo, distribuição e presença local em uma operação integrada.", ownership: "Grupo Maia" },
  { login: "spur", name: "Spur", match: ["spur"], sector: "Performance", description: "Execução, produção e estratégia comercial para negócios em expansão.", ownership: "Grupo Maia" },
  { login: "sun-and-tan", name: "Sun & Tan", match: ["sun tan", "sun & tan"], sector: "Saúde", description: "Beleza e bem-estar conectando presença física e canais digitais.", ownership: "Grupo Maia" },
  { login: "the-maia", name: "The Maia", match: ["the maia", "themaia"], sector: "Holding", description: "Marca e identidade institucional do ecossistema.", ownership: "Grupo Maia" },
  { login: "tikal-beach-club", name: "Tikal Beach Club", match: ["tikal"], sector: "Hospitalidade", description: "Experiência, lazer e hospitalidade com posicionamento premium.", ownership: "Grupo Maia" },
  { login: "tosi", name: "Tosi", match: ["tosi", "tech style match"], sector: "Produto Digital", description: "Produto e tecnologia orientados à eficiência e à construção de margem.", ownership: "Grupo Maia" },
  { login: "venti", name: "Venti", match: ["venti", "imoveisventi"], sector: "Imóveis", description: "Atuação imobiliária com leitura patrimonial, territorial e comercial.", ownership: "Grupo Maia" },
  { login: "voluclinic", name: "Voluclinic", match: ["voluclinic", "volup clinic"], sector: "Saúde", description: "Tecnologia aplicada a atendimento, agenda e operação clínica.", ownership: "Grupo Maia" },
  { login: "volup-ai", name: "Volup AI", match: ["volup ai", "volup-ai"], sector: "IA & Automação", description: "Inteligência aplicada a produtos, operações e novas capacidades.", ownership: "Grupo Maia" },
];

const CONSTELLATION_POSITIONS = [
  [11, 22], [28, 12], [48, 18], [69, 11], [87, 24], [20, 40], [40, 37],
  [61, 34], [79, 43], [92, 57], [71, 58], [50, 54], [29, 57], [9, 61],
  [18, 79], [38, 74], [58, 78], [80, 76], [91, 88], [69, 91], [48, 89],
  [28, 94], [7, 91], [4, 43], [53, 6], [86, 8], [37, 5], [95, 35], [57, 95],
] as const;

const CONSTELLATION_EDGES = [
  [0, 1], [0, 5], [0, 6], [1, 2], [1, 6], [2, 3], [2, 6], [2, 7], [2, 24],
  [3, 4], [3, 7], [3, 24], [4, 8], [4, 25], [5, 6], [5, 12], [5, 13],
  [6, 7], [6, 11], [6, 12], [7, 8], [7, 10], [7, 11], [8, 9], [8, 10],
  [9, 10], [9, 17], [10, 11], [10, 16], [10, 17], [11, 12], [11, 15], [11, 16],
  [12, 13], [12, 14], [12, 15], [13, 14], [13, 23], [14, 15], [14, 22],
  [15, 16], [15, 20], [15, 21], [16, 17], [16, 19], [16, 20], [17, 18],
  [17, 19], [18, 19], [19, 20], [20, 21], [21, 22], [22, 23], [23, 5],
  [7, 26], [7, 27], [7, 28], [12, 22], [23, 24], [26, 28],
] as const;

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function findRecord(profile: CompanyProfile, records: CompanyRecord[]) {
  return records.find((record) => {
    const value = normalize(`${record.username} ${record.name ?? ""}`);
    return profile.match.some((term) => value.includes(normalize(term)));
  });
}

export default function UniverseCanvas({ companies }: { companies: CompanyRecord[] }) {
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("Todos");
  const [selected, setSelected] = useState<CompanyProfile>(() => PROFILES.find((profile) => profile.name === "Grupo Maia") ?? PROFILES[0]);
  const [mobileMode, setMobileMode] = useState<"map" | "index">("map");

  const sectors = useMemo(() => ["Todos", ...Array.from(new Set(PROFILES.map((profile) => profile.sector))).sort()], []);
  const visible = useMemo(() => {
    const needle = normalize(query.trim());
    return PROFILES.filter((profile) => {
      const matchesSector = sector === "Todos" || profile.sector === sector;
      const matchesQuery = !needle || normalize(`${profile.name} ${profile.sector} ${profile.description}`).includes(needle);
      return matchesSector && matchesQuery;
    });
  }, [query, sector]);

  const selectedRecord = findRecord(selected, companies);

  const selectCompany = (profile: CompanyProfile) => {
    setSelected(profile);
    if (window.matchMedia("(max-width: 1023px)").matches) setMobileMode("map");
  };

  return (
    <section className="min-h-screen overflow-x-hidden bg-[#101713] text-[#f4f1e9] selection:bg-[#dbe7cf]/30">
      <header className="relative z-30 h-[72px] border-b border-white/10 bg-[#101713] px-5 sm:px-8 lg:px-10">
        <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between gap-6">
          <Link href="/" className="maia-wordmark min-h-11 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#dbe7cf]" aria-label="Grupo Maia Universe — início"><Image src="/brand/grupo-maia-symbol-reverse.svg" alt="" width={30} height={30} priority /><span><strong>Grupo Maia</strong><small>Universe</small></span></Link>
          <nav className="hidden h-full items-center gap-7 text-[11px] text-white/55 md:flex" aria-label="Navegação principal">
            <a href="#empresas" className="flex h-full items-center transition hover:text-white">Empresas</a>
            <Link href="/intro" className="flex h-full items-center transition hover:text-white">Apresentação do grupo</Link>
            <Link href="/support" className="flex h-full items-center gap-2 border-l border-white/10 pl-7 text-white/75 transition hover:text-[#b79a6c]">Contato <ArrowUpRight size={14} /></Link>
          </nav>
          <Link href="/support" className="flex min-h-11 items-center text-[11px] text-white/70 md:hidden">Contato</Link>
        </div>
      </header>

      <main className="mx-auto min-h-[calc(100vh-72px)] max-w-[1440px] lg:h-[calc(100vh-72px)] lg:min-h-[720px] lg:overflow-hidden">
        <div className="grid min-h-[calc(100vh-72px)] lg:h-full lg:grid-cols-[57%_43%]">
          <section aria-label="Mapa Vivo das Empresas" className={`${mobileMode === "index" ? "hidden lg:flex" : "flex"} relative min-h-[calc(100svh-72px)] flex-col overflow-hidden border-white/10 lg:min-h-0 lg:border-r`}>
            <div className="pointer-events-none absolute inset-0 maia-constellation-field" aria-hidden="true" />
            <div className="relative z-10 flex h-full flex-col p-5 sm:p-8 lg:p-10">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                <div className="max-w-[440px]">
                  <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[#b7c7a9]">Grupo Maia Universe · 29 empresas</p>
                  <h1 className="mt-3 text-[34px] font-normal leading-[1.02] tracking-[-.055em] text-[#f4f1e9] sm:text-[42px]">Empresas autônomas.<br /><span className="font-serif text-[#b7c7a9]">Direção compartilhada.</span></h1>
                  <p className="mt-4 max-w-[390px] text-[13px] leading-6 text-white/50">Explore setores, relações e empresas que compõem o ecossistema do Grupo Maia.</p>
                </div>
                <ModeSwitcher mode={mobileMode} onChange={setMobileMode} />
              </div>

              <LivingConstellation profiles={PROFILES} selected={selected} onSelect={setSelected} />

              <aside aria-live="polite" className="relative mt-5 grid border-y border-white/10 py-5 sm:grid-cols-[1fr_auto] sm:items-end sm:gap-8">
                <div><div className="flex items-center gap-3"><span className="text-[9px] tabular-nums text-[#b79a6c]">{String(PROFILES.indexOf(selected) + 1).padStart(2, "0")}</span><p className="text-[9px] font-semibold uppercase tracking-[.2em] text-[#b79a6c]">{selected.sector}</p></div><h2 className="mt-2 text-[28px] font-normal tracking-[-.045em] text-[#f2eee6]">{selected.name}</h2><p className="mt-2 max-w-[520px] text-[12px] leading-5 text-white/45">{selected.description}</p></div>
                <Link href={`/dev/${selectedRecord?.username ?? selected.login}`} className="mt-4 inline-flex min-h-11 items-center gap-3 text-[11px] text-white/70 transition hover:text-[#b79a6c] sm:mt-0">Conhecer empresa <ArrowRight size={16} /></Link>
              </aside>
            </div>
          </section>

          <section id="empresas" aria-label="Índice de Empresas" className={`${mobileMode === "map" ? "hidden lg:flex" : "flex"} min-h-[calc(100svh-72px)] flex-col bg-[#12110f] lg:min-h-0`}>
            <div className="border-b border-white/10 px-5 py-6 sm:px-8 lg:px-9">
              <div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[#b79a6c]">Índice de Empresas</p><p className="mt-2 text-[12px] text-white/40">{visible.length} {visible.length === 1 ? "empresa" : "empresas"}</p></div><ModeSwitcher mode={mobileMode} onChange={setMobileMode} compact /></div>
              <label className="relative mt-5 block"><span className="sr-only">Buscar por empresa ou setor</span><Search size={16} className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-white/35" /><input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Buscar por empresa ou setor" className="h-12 w-full border-0 border-b border-white/15 bg-transparent pl-7 pr-3 text-sm text-[#f2eee6] outline-none placeholder:text-white/30 focus:border-[#b79a6c]" /></label>
              <label className="mt-4 block"><span className="sr-only">Filtrar por setor</span><select value={sector} onChange={(event) => setSector(event.target.value)} className="min-h-10 w-full border border-white/15 bg-[#12110f] px-3 text-[11px] text-white/60 outline-none focus:border-[#b79a6c]">{sectors.map((item) => <option key={item}>{item}</option>)}</select></label>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {visible.map((profile, index) => <button key={profile.login} type="button" onClick={() => selectCompany(profile)} className={`group grid min-h-[76px] w-full grid-cols-[38px_1fr_auto] items-center border-b border-white/10 px-5 text-left transition hover:bg-white/[.025] focus-visible:bg-white/[.04] focus-visible:outline-none sm:px-8 ${selected.login === profile.login ? "bg-white/[.025]" : ""}`}><span className={`text-[9px] tabular-nums ${selected.login === profile.login ? "text-[#b79a6c]" : "text-white/25"}`}>{String(index + 1).padStart(2, "0")}</span><span><strong className="block text-[20px] font-normal tracking-[-.035em] text-[#f2eee6]">{profile.name}</strong><small className="mt-1 block text-[11px] text-white/35">{profile.sector}</small></span>{selected.login === profile.login ? <ArrowUpRight size={18} className="text-[#b79a6c]" /> : <ArrowRight size={18} className="text-white/25 transition group-hover:translate-x-1 group-hover:text-[#b79a6c]" />}</button>)}
              {visible.length === 0 && <div className="px-8 py-12 text-sm text-white/45"><p>Nenhuma empresa corresponde à busca.</p><button type="button" onClick={() => { setQuery(""); setSector("Todos"); }} className="mt-4 inline-flex min-h-11 items-center gap-2 text-[#b79a6c]">Limpar filtros <X size={14} /></button></div>}
            </div>
          </section>
        </div>
      </main>
    </section>
  );
}

function LivingConstellation({ profiles, selected, onSelect }: { profiles: CompanyProfile[]; selected: CompanyProfile; onSelect: (profile: CompanyProfile) => void }) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const selectedIndex = profiles.findIndex((profile) => profile.login === selected.login);

  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;

    const move = (event: PointerEvent) => {
      const bounds = field.getBoundingClientRect();
      setPointer({
        x: ((event.clientX - bounds.left) / bounds.width - 0.5) * 2,
        y: ((event.clientY - bounds.top) / bounds.height - 0.5) * 2,
      });
    };
    const leave = () => setPointer({ x: 0, y: 0 });
    field.addEventListener("pointermove", move, { passive: true });
    field.addEventListener("pointerleave", leave);
    return () => {
      field.removeEventListener("pointermove", move);
      field.removeEventListener("pointerleave", leave);
    };
  }, []);

  const relatedEdges = useMemo(() => new Set(CONSTELLATION_EDGES.flatMap(([from, to], index) => from === selectedIndex || to === selectedIndex ? [index] : [])), [selectedIndex]);
  const depthStyle = { "--maia-parallax-x": `${pointer.x * 7}px`, "--maia-parallax-y": `${pointer.y * 5}px` } as CSSProperties;

  return (
    <div ref={fieldRef} className="maia-living-constellation relative mt-4 min-h-[350px] flex-1" style={depthStyle}>
      <div className="maia-constellation-grain" aria-hidden="true" />
      <div className="maia-constellation-scan" aria-hidden="true" />
      <div className="maia-constellation-status" aria-hidden="true"><span>{profiles.length} empresas</span><span>Conexões ativas</span></div>
      <svg className="maia-constellation-network" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <ellipse className="maia-orbit" cx="49" cy="52" rx="43" ry="39" />
        <ellipse className="maia-orbit maia-orbit--inner" cx="49" cy="52" rx="28" ry="25" />
        {CONSTELLATION_EDGES.map(([from, to], index) => {
          const a = CONSTELLATION_POSITIONS[from];
          const b = CONSTELLATION_POSITIONS[to];
          return <line key={`${from}-${to}`} className={`maia-constellation-link ${relatedEdges.has(index) ? "is-active" : ""}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />;
        })}
        {CONSTELLATION_EDGES.slice(0, 10).map(([from, to], index) => {
          const a = CONSTELLATION_POSITIONS[from];
          const b = CONSTELLATION_POSITIONS[to];
          return <circle key={`pulse-${from}-${to}`} className="maia-energy-pulse" r="0.45"><animate attributeName="cx" values={`${a[0]};${b[0]}`} dur={`${4.5 + (index % 4) * 0.8}s`} begin={`${index * -0.7}s`} repeatCount="indefinite" /><animate attributeName="cy" values={`${a[1]};${b[1]}`} dur={`${4.5 + (index % 4) * 0.8}s`} begin={`${index * -0.7}s`} repeatCount="indefinite" /></circle>;
        })}
      </svg>

      {profiles.map((profile, index) => {
        const [x, y] = CONSTELLATION_POSITIONS[index];
        const isSelected = selected.login === profile.login;
        const anchorX = x < 12 ? "0%" : x > 88 ? "-100%" : "-50%";
        return (
          <button
            key={profile.login}
            type="button"
            onClick={() => onSelect(profile)}
            className={`maia-constellation-node group absolute min-h-11 text-left ${isSelected ? "is-selected" : ""}`}
            style={{ left: `${x}%`, top: `${y}%`, "--node-delay": `${-(index % 7) * 0.9}s`, "--node-anchor-x": anchorX } as CSSProperties}
            aria-label={`Selecionar ${profile.name}, ${profile.sector}`}
            aria-pressed={isSelected}
          >
            <span className="maia-node-dot" aria-hidden="true" />
            <span className="maia-node-label">{profile.name}</span>
            <span className="maia-node-sector">{profile.sector}</span>
          </button>
        );
      })}
    </div>
  );
}

function ModeSwitcher({ mode, onChange, compact = false }: { mode: "map" | "index"; onChange: (mode: "map" | "index") => void; compact?: boolean }) {
  return <div className={`${compact ? "flex lg:hidden" : "flex"} w-full max-w-[270px] border border-white/15 p-1 text-[11px]`} role="group" aria-label="Modo de visualização"><button type="button" aria-pressed={mode === "map"} onClick={() => onChange("map")} className={`min-h-10 flex-1 transition ${mode === "map" ? "bg-[#f2eee6] text-[#12110f]" : "text-white/50 hover:text-white"}`}>Mapa</button><button type="button" aria-pressed={mode === "index"} onClick={() => onChange("index")} className={`min-h-10 flex-1 transition ${mode === "index" ? "bg-[#f2eee6] text-[#12110f]" : "text-white/50 hover:text-white"}`}>Índice</button></div>;
}
