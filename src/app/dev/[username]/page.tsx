import { cache } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase-server";
import ClaimButton from "@/components/ClaimButton";
import DeleteAccountButton from "@/components/DeleteAccountButton";
import ProfileTracker from "@/components/ProfileTracker";
import EditorialPageShell from "@/components/EditorialPageShell";
import { getInstitutionalCompany } from "@/lib/company-catalog";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

interface Props { params: Promise<{ username: string }> }

const PUBLIC_COMPANY_FIELDS = "id,username,name,avatar_url,bio,contributions,contributions_total,public_repos,total_stars,primary_language,rank,fetched_at,claimed";

const getCompany = cache(async (username: string) => {
  try {
    const supabase = await createServerSupabase();
    const { data } = await supabase
      .from("companies")
      .select(PUBLIC_COMPANY_FIELDS)
      .eq("username", username.toLowerCase())
      .maybeSingle();
    if (data) return { ...data, institutional: false as const, repository: `https://github.com/${data.username}` };
  } catch (error) {
    console.warn("[Grupo Maia Universe] Métricas externas indisponíveis.", error);
  }

  const institutional = getInstitutionalCompany(username);
  if (!institutional) return null;
  return {
    id: 0,
    username: institutional.slug,
    name: institutional.name,
    avatar_url: null,
    bio: institutional.description,
    contributions: 0,
    contributions_total: 0,
    public_repos: 0,
    total_stars: 0,
    primary_language: null,
    rank: null,
    fetched_at: null,
    claimed: false,
    institutional: true as const,
    repository: institutional.repository,
    sector: institutional.sector,
  };
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const company = await getCompany(username);
  if (!company) return { title: "Empresa não encontrada — Grupo Maia" };
  const title = `${company.name || company.username} — Grupo Maia Universe`;
  const description = company.bio || `Conheça ${company.name || company.username}, empresa do ecossistema Grupo Maia.`;
  return { title, description, alternates: { canonical: `/dev/${company.username}` }, openGraph: { title, description } };
}

export default async function CompanyProfilePage({ params }: Props) {
  const { username } = await params;
  const company = await getCompany(username);
  if (!company) return null;

  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const authLogin = (user?.user_metadata?.user_name ?? user?.user_metadata?.preferred_username ?? "").toLowerCase();
  const isOwner = Boolean(user && authLogin === company.username.toLowerCase() && company.claimed);
  const contributions = company.contributions_total > 0 ? company.contributions_total : company.contributions;
  const updatedAt = company.fetched_at ? new Date(company.fetched_at).toLocaleDateString("pt-BR") : "não informada";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const profileJsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Organization",
      name: company.name ?? company.username,
      image: company.avatar_url,
      url: `${baseUrl}/dev/${company.username}`,
      sameAs: company.repository,
    },
  };

  const indicators = company.institutional ? [
    ["Setor", company.sector || "Não informado"],
    ["Ecossistema", "Grupo Maia"],
    ["Status", "Operação mapeada"],
  ] : [
    ["Contribuições públicas", contributions.toLocaleString("pt-BR")],
    ["Repositórios", company.public_repos.toLocaleString("pt-BR")],
    ["Estrelas", company.total_stars.toLocaleString("pt-BR")],
    ["Tecnologia principal", company.primary_language || "Não informada"],
    ["Posição no conjunto", company.rank ? `#${company.rank}` : "Não informada"],
    ["Última atualização", updatedAt],
  ];

  return (
    <EditorialPageShell
      eyebrow="Perfil de empresa"
      title={company.name || company.username}
      intro={company.bio || "Informações públicas e indicadores técnicos desta operação."}
      wide
    >
      <ProfileTracker login={company.username} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(profileJsonLd) }} />

      <div className="grid gap-10 border-y border-white/13 py-8 lg:grid-cols-[15rem_1fr] lg:gap-16">
        <div>
          {company.avatar_url ? (
            <Image src={company.avatar_url} alt="" width={180} height={180} className="h-36 w-36 rounded-full object-cover grayscale sm:h-44 sm:w-44" priority />
          ) : (
            <div className="h-36 w-36 rounded-full border border-white/15 bg-white/[.03] sm:h-44 sm:w-44" />
          )}
          <p className="mt-5 text-sm text-white/45">@{company.username}</p>
          <div className="mt-5"><ClaimButton companyLogin={company.username} claimed={company.claimed ?? false} /></div>
        </div>

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#b7c7a9]">{company.institutional ? "Visão institucional" : "Indicadores públicos"}</p>
          <dl className="mt-4 grid border-l border-t border-white/13 sm:grid-cols-2 lg:grid-cols-3">
            {indicators.map(([label, value]) => (
              <div key={label} className="min-h-28 border-b border-r border-white/13 p-4">
                <dt className="text-xs text-white/35">{label}</dt>
                <dd className="mt-3 break-words text-xl tracking-[-.025em] text-white/80">{value}</dd>
              </div>
            ))}
          </dl>
          {!company.institutional && <p className="mt-4 text-xs leading-5 text-white/32">Fonte: informações públicas disponibilizadas pelos provedores integrados. Indicadores não constituem avaliação financeira.</p>}
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        <Link href={`/?user=${company.username}`} className="rounded-full bg-[#eee9df] px-5 py-3 text-xs font-medium text-[#171512]">Localizar no mapa</Link>
        {company.repository && <a href={company.repository} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/18 px-5 py-3 text-xs text-white/65 transition hover:border-white/38 hover:text-white">Consultar projeto</a>}
        <Link href="/leaderboard" className="rounded-full border border-white/18 px-5 py-3 text-xs text-white/65 transition hover:border-white/38 hover:text-white">Ver indicadores gerais</Link>
      </div>

      {isOwner && (
        <section className="mt-16 border-t border-white/13 pt-8">
          <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-white/38">Gestão do perfil</p>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <Link href={`/shop/${company.username}`} className="rounded-full border border-white/18 px-5 py-3 text-xs text-white/65">Configurações da presença visual</Link>
            <DeleteAccountButton />
          </div>
        </section>
      )}
    </EditorialPageShell>
  );
}
