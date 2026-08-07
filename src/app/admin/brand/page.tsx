import { redirect } from "next/navigation";
import { BRAND, getSiteUrl } from "@/lib/brand";
import { createServerSupabase } from "@/lib/supabase-server";

const OWNER_LOGIN = "srizzon";

const rows = [
  ["Nome", BRAND.name],
  ["Nome curto", BRAND.shortName],
  ["Grupo", BRAND.groupName],
  ["Dominio canonico", BRAND.domain],
  ["URL base", BRAND.baseUrl],
  ["URL efetiva", getSiteUrl()],
  ["Email de contato", BRAND.contactEmail],
  ["Email remetente", BRAND.fromEmail],
  ["Repositorio", BRAND.repository],
];

export default async function AdminBrandPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const login = (
    user.user_metadata.user_name ??
    user.user_metadata.preferred_username ??
    ""
  ).toLowerCase();

  if (login !== OWNER_LOGIN) redirect("/");

  return (
    <main className="min-h-screen bg-bg px-4 py-8 text-cream sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-col gap-2">
          <p className="text-[10px] uppercase tracking-[0.24em] text-muted">
            Admin
          </p>
          <h1 className="text-2xl text-lime sm:text-3xl">
            Configuracao de marca
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted">
            Estes valores alimentam metadata, emails, links canonicos e textos
            publicos. Variaveis como NEXT_PUBLIC_BASE_URL, NEXT_PUBLIC_SITE_URL
            e NEXT_PUBLIC_APP_URL podem alterar a URL efetiva em deploy.
          </p>
        </div>

        <section className="border border-border bg-bg-raised">
          <dl className="divide-y divide-border">
            {rows.map(([label, value]) => (
              <div
                key={label}
                className="grid gap-2 px-4 py-4 sm:grid-cols-[180px_1fr] sm:px-5"
              >
                <dt className="text-[10px] uppercase tracking-[0.18em] text-muted">
                  {label}
                </dt>
                <dd className="break-all text-sm text-cream">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </main>
  );
}
