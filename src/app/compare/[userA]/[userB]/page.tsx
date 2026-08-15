import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import EditorialPageShell from "@/components/EditorialPageShell";

type Props = { params: Promise<{ userA: string; userB: string }> };
type Company = {
  username: string;
  name: string | null;
  contributions: number;
  contributions_total: number | null;
  public_repos: number;
  total_stars: number;
  primary_language: string | null;
  rank: number | null;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userA, userB } = await params;
  return {
    title: `${userA} e ${userB} — Comparação pública`,
    description: `Comparação de indicadores públicos entre ${userA} e ${userB}.`,
  };
}

export default async function ComparePage({ params }: Props) {
  const { userA, userB } = await params;
  const supabase = await createServerSupabase();
  const fields = "username, name, contributions, contributions_total, public_repos, total_stars, primary_language, rank";
  const [{ data: companyA }, { data: companyB }] = await Promise.all([
    supabase.from("companies").select(fields).eq("username", userA.toLowerCase()).single(),
    supabase.from("companies").select(fields).eq("username", userB.toLowerCase()).single(),
  ]);
  if (!companyA || !companyB) notFound();

  const a = companyA as Company;
  const b = companyB as Company;
  const contributions = (company: Company) => company.contributions_total && company.contributions_total > 0 ? company.contributions_total : company.contributions;
  const rows = [
    ["Contribuições públicas", contributions(a), contributions(b)],
    ["Repositórios", a.public_repos, b.public_repos],
    ["Estrelas", a.total_stars, b.total_stars],
    ["Posição no conjunto", a.rank, b.rank],
  ] as const;

  return (
    <EditorialPageShell eyebrow="Análise comparativa" title="Duas operações, a mesma referência." intro="Indicadores públicos apresentados lado a lado para facilitar contexto. A comparação não representa recomendação, valor financeiro ou julgamento de qualidade." wide>
      <div className="grid grid-cols-[1fr_1fr] border-l border-t border-white/13">
        {[a, b].map((company) => (
          <section key={company.username} className="border-b border-r border-white/13 p-6 sm:p-8">
            <p className="text-[10px] uppercase tracking-[.15em] text-[#bda57e]">{company.primary_language || "Tecnologia não informada"}</p>
            <h2 className="mt-4 text-3xl tracking-[-.04em] text-white/85 sm:text-5xl">{company.name || company.username}</h2>
            <p className="mt-3 text-sm text-white/35">@{company.username}</p>
          </section>
        ))}
      </div>
      <div className="border-l border-white/13">
        {rows.map(([label, valueA, valueB]) => (
          <div key={label} className="grid grid-cols-[1.2fr_.8fr_.8fr] border-b border-white/13">
            <span className="border-r border-white/13 p-4 text-xs text-white/42 sm:p-5">{label}</span>
            <span className="border-r border-white/13 p-4 text-right text-lg tabular-nums text-white/76 sm:p-5">{valueA?.toLocaleString("pt-BR") ?? "—"}</span>
            <span className="border-r border-white/13 p-4 text-right text-lg tabular-nums text-white/76 sm:p-5">{valueB?.toLocaleString("pt-BR") ?? "—"}</span>
          </div>
        ))}
      </div>
      <p className="mt-6 text-xs leading-5 text-white/32">Fonte: informações públicas dos provedores integrados. Diferenças de período, disponibilidade e critérios de coleta podem afetar a leitura.</p>
    </EditorialPageShell>
  );
}
