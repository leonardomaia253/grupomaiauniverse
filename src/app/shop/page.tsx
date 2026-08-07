import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop - Grupo LMF Universe",
  description: "Customize your planet in Grupo LMF Universe with effects, structures and more",
};

const ACCENT = "#c8e64a";

export default async function ShopLanding() {
  // If user is logged in and has a claimed planet, redirect to their shop
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const username = (
      user.user_metadata?.user_name ??
      user.user_metadata?.preferred_username ??
      user.user_metadata?.full_name ??
      user.email?.split("@")[0] ??
      ""
    ).toLowerCase();

    if (username) {
      const sb = getSupabaseAdmin();
      const { data: record } = await sb
        .from("companies")
        .select("username, claimed")
        .eq("username", username)
        .single();

      if (record?.claimed) {
        redirect(`/shop/${record.username}`);
      }
    }
  }

  return (
    <main className="min-h-screen bg-bg font-pixel uppercase text-warm">
      <div className="mx-auto max-w-5xl px-3 py-6 sm:px-4 sm:py-10">
        {/* Back */}
        <Link
          href="/"
          className="mb-6 inline-block text-sm text-muted transition-colors hover:text-cream sm:mb-8"
        >
          &larr; Back to Universe
        </Link>

        <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="border-[3px] border-border bg-bg-raised p-6 sm:p-10">
            <p className="text-[10px] tracking-[0.22em] text-muted">PLANET STUDIO</p>
            <h1 className="mt-3 text-2xl leading-tight text-cream sm:text-4xl">
              Personalize seu planeta sem perder a identidade.
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted normal-case">
              O estúdio reúne cores, auras, billboards e efeitos orbitais em uma experiência única: veja o preview, equipe itens e transforme seu perfil em presença visual.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                ["01", "Conecte", "Entre com GitHub e encontre seu planeta."],
                ["02", "Teste", "Veja itens por zona com preview ao vivo."],
                ["03", "Equipe", "Salve a aparência e volte ao universo."],
              ].map(([n, title, text]) => (
                <div key={n} className="border border-border/80 bg-bg px-4 py-4">
                  <p className="text-lg" style={{ color: ACCENT }}>{n}</p>
                  <p className="mt-2 text-xs text-cream">{title}</p>
                  <p className="mt-2 text-[10px] leading-relaxed text-muted normal-case">{text}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/" className="border-[2px] border-border px-4 py-3 text-xs text-cream transition hover:border-cream">
                Explorar universo
              </Link>
              {!user && (
                <Link href="/auth" className="px-4 py-3 text-xs text-bg transition hover:brightness-110" style={{ backgroundColor: ACCENT }}>
                  Entrar no estúdio
                </Link>
              )}
            </div>
          </section>

          <aside className="border-[3px] border-border bg-[#05070b] p-6 sm:p-8">
            <div className="relative mx-auto aspect-square max-w-sm rounded-full border border-white/10" style={{ background: "radial-gradient(circle at 30% 22%, #fff 0 7%, transparent 16%), radial-gradient(circle at 62% 70%, rgba(200,230,74,0.42), transparent 34%), linear-gradient(145deg, #27320a, #05070b 72%)", boxShadow: `0 0 80px ${ACCENT}33, inset -28px -38px 60px rgba(0,0,0,0.72)` }}>
              <div className="absolute inset-8 rounded-full border border-white/10" />
              <div className="absolute -right-4 top-16 rounded-full border border-white/10 bg-black/60 px-3 py-2 text-[10px] text-cream backdrop-blur">
                aura ativa
              </div>
              <div className="absolute bottom-12 left-1/2 w-40 -translate-x-1/2 border border-white/15 bg-black/70 px-3 py-2 text-center text-[10px] text-muted backdrop-blur">
                billboard slot
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2 text-[10px]">
              {["Auras", "Billboards", "Cores", "Efeitos", "Coroas", "Veículos"].map((item) => (
                <div key={item} className="border border-border/80 px-3 py-3 text-center text-muted">
                  {item}
                </div>
              ))}
            </div>
          </aside>
        </div>

        {/* Creator credit */}
        <div className="mt-10 border-t border-border/50 pt-4 text-center">
          <p className="text-[9px] text-muted normal-case">
            built by{" "}
            <a
              href="https://x.com/leonardomaia253"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-cream"
              style={{ color: ACCENT }}
            >
              @leonardomaia253
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
