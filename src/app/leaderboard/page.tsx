import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase-server";
import LeaderboardTracker from "@/components/LeaderboardTracker";
import EditorialPageShell from "@/components/EditorialPageShell";

export const dynamic = "force-dynamic";
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Indicadores públicos — Grupo Maia",
  description: "Indicadores públicos das operações apresentadas no Mapa Vivo.",
};

type TabId = "contributors" | "stars" | "repositories";
type Company = {
  username: string;
  name: string | null;
  avatar_url: string | null;
  contributions: number;
  contributions_total: number | null;
  total_stars: number;
  public_repos: number;
  primary_language: string | null;
  rank: number | null;
};

const tabs: { id: TabId; label: string; column: "rank" | "total_stars" | "public_repos"; ascending: boolean }[] = [
  { id: "contributors", label: "Contribuições públicas", column: "rank", ascending: true },
  { id: "stars", label: "Estrelas", column: "total_stars", ascending: false },
  { id: "repositories", label: "Repositórios", column: "public_repos", ascending: false },
];

export default async function IndicatorsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const params = await searchParams;
  const selected = tabs.find((tab) => tab.id === params.tab) ?? tabs[0];
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("companies")
    .select("username, name, avatar_url, contributions, contributions_total, total_stars, public_repos, primary_language, rank")
    .order(selected.column, { ascending: selected.ascending, nullsFirst: false })
    .limit(50);
  const companies = (data ?? []) as Company[];

  const metric = (company: Company) => {
    if (selected.id === "stars") return company.total_stars;
    if (selected.id === "repositories") return company.public_repos;
    return company.contributions_total && company.contributions_total > 0 ? company.contributions_total : company.contributions;
  };

  return (
    <EditorialPageShell
      eyebrow="Transparência"
      title="Indicadores públicos"
      intro="Uma leitura comparativa de sinais disponíveis publicamente. Os números ajudam a contextualizar atividade técnica; não representam valor financeiro ou qualidade isoladamente."
      wide
    >
      <LeaderboardTracker tab={selected.id === "repositories" ? "architects" : selected.id} />
      <nav className="mb-10 flex flex-wrap gap-2" aria-label="Métrica">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={`/leaderboard?tab=${tab.id}`}
            className={`rounded-full border px-4 py-2 text-xs transition ${selected.id === tab.id ? "border-[#eee9df] bg-[#eee9df] text-[#171512]" : "border-white/16 text-white/52 hover:border-white/35 hover:text-white"}`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-white/14">
        <div className="grid grid-cols-[3rem_1fr_auto] gap-4 border-b border-white/14 py-3 text-[10px] font-semibold uppercase tracking-[.14em] text-white/32 sm:grid-cols-[4rem_1fr_11rem_8rem]">
          <span>Pos.</span><span>Empresa</span><span className="hidden sm:block">Tecnologia</span><span className="text-right">{selected.label}</span>
        </div>
        {companies.map((company, index) => (
          <Link key={company.username} href={`/dev/${company.username}`} className="group grid grid-cols-[3rem_1fr_auto] items-center gap-4 border-b border-white/12 py-4 transition hover:bg-white/[.03] sm:grid-cols-[4rem_1fr_11rem_8rem] sm:px-2">
            <span className="text-xs tabular-nums text-white/28">{String(index + 1).padStart(2, "0")}</span>
            <span className="flex min-w-0 items-center gap-3">
              {company.avatar_url && <Image src={company.avatar_url} alt="" width={40} height={40} className="rounded-full grayscale" />}
              <span className="min-w-0">
                <strong className="block truncate text-base font-normal text-white/82">{company.name || company.username}</strong>
                <small className="block truncate text-xs text-white/32">@{company.username}</small>
              </span>
            </span>
            <span className="hidden text-sm text-white/38 sm:block">{company.primary_language || "Não informado"}</span>
            <span className="text-right text-base tabular-nums text-[#c5aa7d]">{metric(company).toLocaleString("pt-BR")}</span>
          </Link>
        ))}
        {companies.length === 0 && <p className="border-b border-white/12 py-10 text-sm text-white/40">Nenhum dado disponível para esta métrica.</p>}
      </div>

      <p className="mt-8 max-w-3xl text-xs leading-5 text-white/35">Fonte: APIs públicas e dados declarados pelas operações. Atualização periódica sujeita à disponibilidade dos provedores.</p>
    </EditorialPageShell>
  );
}
