"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

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
  { login: "bilheking", name: "Bilheking", match: ["bilheking"], sector: "Bilheteria e entretenimento", description: "Tecnologia comercial para eventos, vendas, recorrência e relacionamento com públicos.", ownership: "66% Leonardo / 34% Jodelle" },
  { login: "tosi", name: "Tosi", match: ["tosi"], sector: "Produto digital", description: "Produto, tecnologia e operação orientados à eficiência e à construção de margem.", ownership: "100% Leonardo" },
  { login: "jack-it-fit", name: "Jack it fit", match: ["jackitfit", "jack it fit"], sector: "Saúde e fitness", description: "Operação recorrente dedicada à performance, ao cuidado e ao bem-estar.", ownership: "100% Leonardo" },
  { login: "spur", name: "Spur", match: ["spur"], sector: "Performance e crescimento", description: "Execução, produção e estratégia comercial para negócios em expansão.", ownership: "80% Leonardo / 20% Jodelle" },
  { login: "volup", name: "Volup", match: ["volup"], sector: "IA e automação", description: "Inteligência aplicada a produtos, operações e novas capacidades para o grupo.", ownership: "100% Leonardo" },
  { login: "scoreking", name: "Scoreking", match: ["scoreking"], sector: "Score e inteligência", description: "Dados para leitura de performance, risco e tomada de decisão.", ownership: "100% Leonardo" },
  { login: "instaboost", name: "Instaboost", match: ["instaboost"], sector: "Crescimento social", description: "Operação de alcance, distribuição e crescimento em canais sociais.", ownership: "100% Leonardo", status: "Operacional MVP" },
  { login: "kinkora", name: "Kinkora", match: ["kinkora"], sector: "Experiência e comunidade", description: "Marca, relacionamento e construção de comunidade.", ownership: "90% Leonardo / 10% Jodelle" },
  { login: "abroo", name: "Abroo", match: ["abroo"], sector: "Plataforma digital", description: "Estrutura modular para novas frentes de produto e serviço.", ownership: "100% Leonardo" },
  { login: "voluclinic", name: "Voluclinic", match: ["voluclinic"], sector: "Healthtech", description: "Tecnologia aplicada a atendimento, agenda e operação clínica.", ownership: "100% Leonardo" },
  { login: "avantyp", name: "Avantyp", match: ["avantyp"], sector: "Estratégia e tecnologia", description: "Estrutura estratégica dedicada à tecnologia aplicada.", ownership: "100% Leonardo" },
  { login: "boase", name: "Boase", match: ["boase"], sector: "Operação e serviços", description: "Serviços orientados à consistência, conexão e execução.", ownership: "100% Leonardo" },
  { login: "venti-imoveis", name: "Venti Imóveis", match: ["venti", "venti imoveis"], sector: "Imóveis", description: "Atuação imobiliária com leitura patrimonial, territorial e comercial.", ownership: "100% Leonardo" },
  { login: "instead", name: "Instead", match: ["instead"], sector: "Produto e operação", description: "Produtos e processos concebidos para reduzir atrito operacional.", ownership: "100% Leonardo" },
  { login: "seu-jornaleiro", name: "Seu Jornaleiro", match: ["seujornaleiro", "seu jornaleiro"], sector: "Mídia e distribuição", description: "Conteúdo, distribuição e presença local em uma operação integrada.", ownership: "50% Leonardo / 50% Jodelle" },
  { login: "pipex", name: "Pipex", match: ["pipex"], sector: "Pipelines e automação", description: "Fluxos, integrações e cadência entre áreas de negócio.", ownership: "100% Leonardo" },
  { login: "smartrh", name: "SmartRH", match: ["smartrh", "smart rh"], sector: "RH e people ops", description: "Gente, processos e inteligência de contratação em uma mesma plataforma.", ownership: "100% Leonardo" },
  { login: "iris", name: "Iris", match: ["iris"], sector: "Visão e inteligência", description: "Tecnologia de leitura, percepção e clareza operacional.", ownership: "100% Leonardo" },
  { login: "gaslee", name: "Gaslee", match: ["gaslee"], sector: "Energia e serviços", description: "Serviços cotidianos de energia com eficiência comercial.", ownership: "100% Leonardo" },
  { login: "maia-go", name: "Maia GO", match: ["maia go", "maiago"], sector: "Mobilidade e operação", description: "Mobilidade, execução e conexão entre operações.", ownership: "100% Leonardo" },
  { login: "minvest", name: "Minvest", match: ["minvest"], sector: "Investimentos", description: "Inteligência de capital e perspectiva patrimonial de longo prazo.", ownership: "100% Leonardo" },
  { login: "habitat-x", name: "Habitat X", match: ["habitat x", "habitatx"], sector: "Habitat e real estate", description: "Espaços, moradia e produto imobiliário com identidade própria.", ownership: "100% Leonardo" },
  { login: "tikal-beach-club", name: "Tikal Beach Club", match: ["tikal"], sector: "Hospitalidade", description: "Experiência, lazer e hospitalidade com posicionamento premium.", ownership: "100% Leonardo" },
  { login: "sun-and-tan", name: "Sun & Tan", match: ["sun tan", "sun & tan"], sector: "Beleza e bem-estar", description: "Marca direta ao consumidor, conectando presença física e canais digitais.", ownership: "100% Leonardo" },
  { login: "13-de-maio", name: "13 de Maio", match: ["13 de maio"], sector: "Ativo patrimonial", description: "Participação patrimonial do Grupo Maia.", ownership: "10% Leonardo" },
  { login: "agrovolup", name: "Agrovolup", match: ["agrovolup", "agro volup"], sector: "Agro e IA", description: "Tecnologia e inteligência aplicadas ao agronegócio.", ownership: "Leonardo e Volup", status: "Estrutura societária reservada" },
];

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
  const [selected, setSelected] = useState<CompanyProfile | null>(null);

  const sectors = useMemo(() => ["Todos", ...Array.from(new Set(PROFILES.map((profile) => profile.sector))).sort()], []);
  const visible = useMemo(() => {
    const needle = normalize(query.trim());
    return PROFILES.filter((profile) => {
      const matchesSector = sector === "Todos" || profile.sector === sector;
      const matchesQuery = !needle || normalize(`${profile.name} ${profile.sector} ${profile.description}`).includes(needle);
      return matchesSector && matchesQuery;
    });
  }, [query, sector]);

  const selectedRecord = selected ? findRecord(selected, companies) : undefined;

  return (
    <section className="min-h-screen bg-[#eeeae0] text-[#1c1c18]">
      <header className="border-b border-black/15 px-5 py-6 sm:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="text-sm tracking-[0.22em]">MAIA</Link>
          <nav className="flex gap-5 text-xs text-[#6d675c]"><Link href="/intro">Apresentação</Link><Link href="/support">Contato</Link></nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-10 sm:py-20">
        <p className="text-xs uppercase tracking-[0.22em] text-[#74664d]">Portfólio do Grupo Maia</p>
        <div className="mt-5 grid gap-8 lg:grid-cols-[1.25fr_.75fr] lg:items-end">
          <h1 className="max-w-4xl text-5xl font-light leading-[.98] tracking-[-.05em] sm:text-7xl">Diferentes competências.<br /><span className="font-serif italic text-[#8a7045]">Uma visão integrada.</span></h1>
          <p className="max-w-lg text-sm leading-7 text-[#68635a]">Conheça as empresas, suas áreas de atuação e os dados públicos disponíveis. A organização privilegia clareza e contexto.</p>
        </div>

        <div className="mt-14 grid gap-4 border-y border-black/15 py-5 md:grid-cols-[1fr_1fr_auto]">
          <label className="text-xs uppercase tracking-[0.15em] text-[#74664d]">Buscar
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Empresa, setor ou atividade" className="mt-2 block w-full border-0 border-b border-black/20 bg-transparent py-2 text-base normal-case tracking-normal text-[#1c1c18] outline-none focus:border-[#8a7045]" />
          </label>
          <label className="text-xs uppercase tracking-[0.15em] text-[#74664d]">Área de atuação
            <select value={sector} onChange={(event) => setSector(event.target.value)} className="mt-2 block w-full border-0 border-b border-black/20 bg-transparent py-2 text-base normal-case tracking-normal outline-none">{sectors.map((item) => <option key={item}>{item}</option>)}</select>
          </label>
          <p className="self-end pb-2 text-sm text-[#74664d]">{visible.length} empresas</p>
        </div>

        <div className="mt-4 border-t border-black/15">
          {visible.map((profile, index) => (
            <button key={profile.login} type="button" onClick={() => setSelected(profile)} className="group grid w-full grid-cols-[2.5rem_1fr_auto] items-center gap-4 border-b border-black/15 py-5 text-left transition hover:bg-black/[0.025] sm:grid-cols-[3rem_1.1fr_1fr_auto]">
              <span className="text-xs tabular-nums text-[#948b7b]">{String(index + 1).padStart(2, "0")}</span>
              <span className="text-xl tracking-[-.02em] sm:text-2xl">{profile.name}</span>
              <span className="hidden text-sm text-[#746f66] sm:block">{profile.sector}</span>
              <span className="text-xl text-[#8a7045] transition-transform group-hover:translate-x-1">→</span>
            </button>
          ))}
          {visible.length === 0 && <p className="py-14 text-sm text-[#74664d]">Nenhuma empresa corresponde aos filtros selecionados.</p>}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/45" onClick={() => setSelected(null)}>
          <aside className="h-full w-full max-w-xl overflow-y-auto bg-[#171714] p-7 text-[#f1eee6] sm:p-10" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between"><span className="text-xs uppercase tracking-[0.2em] text-[#b89a62]">{selected.sector}</span><button onClick={() => setSelected(null)} aria-label="Fechar" className="text-2xl text-white/55">×</button></div>
            <h2 className="mt-12 text-5xl font-light tracking-[-.04em]">{selected.name}</h2>
            <p className="mt-6 text-base leading-7 text-white/58">{selected.description}</p>
            <dl className="mt-12 border-t border-white/15 text-sm">
              <div className="grid grid-cols-[8rem_1fr] border-b border-white/12 py-4"><dt className="text-white/35">Participação</dt><dd>{selected.ownership}</dd></div>
              <div className="grid grid-cols-[8rem_1fr] border-b border-white/12 py-4"><dt className="text-white/35">Situação</dt><dd>{selected.status ?? "Em operação"}</dd></div>
              <div className="grid grid-cols-[8rem_1fr] border-b border-white/12 py-4"><dt className="text-white/35">Contribuições</dt><dd>{Math.max(selectedRecord?.contributions_total ?? 0, selectedRecord?.contributions ?? 0).toLocaleString("pt-BR")}</dd></div>
              <div className="grid grid-cols-[8rem_1fr] border-b border-white/12 py-4"><dt className="text-white/35">Repositórios</dt><dd>{(selectedRecord?.public_repos ?? 0).toLocaleString("pt-BR")}</dd></div>
            </dl>
            <div className="mt-10 flex flex-wrap gap-3"><Link href={`/dev/${selectedRecord?.username ?? selected.login}`} className="rounded-full bg-[#f1eee6] px-5 py-3 text-sm text-[#171714]">Ver perfil</Link><Link href="/support" className="rounded-full border border-white/20 px-5 py-3 text-sm text-white/70">Falar com o grupo</Link></div>
          </aside>
        </div>
      )}
    </section>
  );
}

