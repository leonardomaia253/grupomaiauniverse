import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import EditorialPageShell from "@/components/EditorialPageShell";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: `Identidade de ${username} — Grupo Maia`, description: "Gestão da presença visual de um perfil verificado." };
}

export default async function CompanyIdentityPage({ params }: Props) {
  const { username } = await params;
  const supabase = await createServerSupabase();
  const [{ data: company }, { data: { user } }] = await Promise.all([
    supabase.from("companies").select("id, username, name, claimed, custom_color, bio").eq("username", username.toLowerCase()).single(),
    supabase.auth.getUser(),
  ]);
  if (!company) notFound();
  const authLogin = (user?.user_metadata?.user_name ?? user?.user_metadata?.preferred_username ?? "").toLowerCase();
  const isOwner = Boolean(user && authLogin === company.username.toLowerCase() && company.claimed);

  return (
    <EditorialPageShell eyebrow="Gestão de perfil" title={company.name || company.username} intro="Revisão da identidade e das informações apresentadas no Mapa Vivo. Alterações ficam restritas ao responsável verificado pela operação.">
      {!isOwner ? (
        <section className="border border-white/13 p-7 sm:p-10">
          <h2 className="text-2xl tracking-[-.035em] text-white/82">Acesso restrito</h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-white/45">Esta área está disponível somente para o perfil autenticado responsável por @{company.username}.</p>
          <div className="mt-7 flex flex-wrap gap-2">
            <Link href={`/dev/${company.username}`} className="rounded-full bg-[#eee9df] px-5 py-3 text-xs font-medium text-[#171512]">Voltar ao perfil</Link>
            <Link href="/support" className="rounded-full border border-white/18 px-5 py-3 text-xs text-white/65">Solicitar suporte</Link>
          </div>
        </section>
      ) : (
        <>
          <dl className="grid border-l border-t border-white/13 sm:grid-cols-2">
            <div className="border-b border-r border-white/13 p-6"><dt className="text-xs text-white/35">Identificador público</dt><dd className="mt-3 text-lg text-white/78">@{company.username}</dd></div>
            <div className="border-b border-r border-white/13 p-6"><dt className="text-xs text-white/35">Status de verificação</dt><dd className="mt-3 text-lg text-white/78">Responsável verificado</dd></div>
            <div className="border-b border-r border-white/13 p-6"><dt className="text-xs text-white/35">Cor de referência</dt><dd className="mt-3 flex items-center gap-3 text-lg text-white/78"><span className="h-5 w-5 rounded-full border border-white/20" style={{ backgroundColor: company.custom_color || "#b79a6c" }} />{company.custom_color || "Padrão do grupo"}</dd></div>
            <div className="border-b border-r border-white/13 p-6"><dt className="text-xs text-white/35">Descrição</dt><dd className="mt-3 text-sm leading-6 text-white/55">{company.bio || "Não informada"}</dd></div>
          </dl>
          <div className="mt-8 border-t border-white/13 pt-8">
            <p className="max-w-2xl text-sm leading-6 text-white/45">Para preservar consistência editorial e segurança, alterações de marca, descrição e vínculos são revisadas pela equipe responsável.</p>
            <a href={`mailto:contato@grupomaia.me?subject=${encodeURIComponent(`Atualização do perfil ${company.username}`)}`} className="mt-6 inline-flex rounded-full bg-[#eee9df] px-5 py-3 text-xs font-medium text-[#171512]">Solicitar atualização</a>
          </div>
        </>
      )}
    </EditorialPageShell>
  );
}
