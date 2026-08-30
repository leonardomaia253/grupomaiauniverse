import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";
import EditorialPageShell from "@/components/EditorialPageShell";
import { getInstitutionalCompany, INSTITUTIONAL_COMPANIES } from "@/lib/company-catalog";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return INSTITUTIONAL_COMPANIES.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const company = getInstitutionalCompany((await params).slug);
  if (!company) return { title: "Empresa não encontrada" };
  const title = `${company.name} — Grupo Maia`;
  return {
    title,
    description: company.description,
    alternates: { canonical: `/empresas/${company.slug}` },
    openGraph: { title, description: company.description },
  };
}

export default async function CompanyPage({ params }: Props) {
  const company = getInstitutionalCompany((await params).slug);
  if (!company) notFound();

  const related = INSTITUTIONAL_COMPANIES
    .filter((item) => item.slug !== company.slug && item.sector === company.sector)
    .slice(0, 3);
  const index = INSTITUTIONAL_COMPANIES.findIndex((item) => item.slug === company.slug) + 1;

  return (
    <EditorialPageShell eyebrow={`${String(index).padStart(2, "0")} · ${company.sector}`} title={company.name} intro={company.description} wide>
      <section className="grid gap-8 border-y border-white/13 py-9 md:grid-cols-[minmax(0,1.35fr)_minmax(16rem,.65fr)] md:gap-16">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#b7c7a9]">O que faz</p>
          <p className="mt-5 max-w-3xl text-2xl leading-[1.35] tracking-[-.025em] text-white/85 sm:text-3xl">{company.description}</p>
        </div>
        <dl className="grid content-start border-l border-t border-white/13">
          <div className="border-b border-r border-white/13 p-5">
            <dt className="text-xs text-white/38">Área de atuação</dt>
            <dd className="mt-2 text-lg text-white/85">{company.sector}</dd>
          </div>
          <div className="border-b border-r border-white/13 p-5">
            <dt className="text-xs text-white/38">Grupo empresarial</dt>
            <dd className="mt-2 text-lg text-white/85">Grupo Maia</dd>
          </div>
        </dl>
      </section>

      <section className="mt-12 grid gap-6 rounded-3xl bg-[#eee9df] p-7 text-[#171512] sm:p-10 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-black/48">Contato</p>
          <h2 className="mt-3 max-w-2xl text-3xl tracking-[-.04em] sm:text-4xl">Quer falar com a {company.name}?</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-black/58">Envie sua solicitação e informe a empresa no assunto. A equipe direcionará o contato para a operação responsável.</p>
        </div>
        <Link href={`/support?empresa=${encodeURIComponent(company.name)}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#171512] px-6 text-xs font-semibold text-white">Entrar em contato <ArrowRight size={15} /></Link>
      </section>

      {related.length > 0 && (
        <section className="mt-14">
          <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-white/38">Outras empresas em {company.sector}</p>
          <div className="mt-5 grid border-l border-t border-white/13 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => <Link key={item.slug} href={`/empresas/${item.slug}`} className="border-b border-r border-white/13 p-5 transition hover:bg-white/[.04]"><strong className="text-lg font-medium text-white/85">{item.name}</strong><span className="mt-2 block text-xs leading-5 text-white/42">{item.description}</span></Link>)}
          </div>
        </section>
      )}

      <Link href="/#empresas" className="mt-12 inline-flex items-center gap-2 text-xs text-white/55 hover:text-white"><ArrowLeft size={14} /> Voltar ao índice de empresas</Link>
    </EditorialPageShell>
  );
}
