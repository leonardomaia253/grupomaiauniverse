import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase";
import { SetupContent } from "./SetupContent";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Configurar campanha — Grupo Maia", robots: { index: false, follow: false } };

const FORMAT_LABELS: Record<string, string> = {
  plane: "Formato panorâmico",
  blimp: "Formato flutuante",
  billboard: "Painel editorial",
  rooftop_sign: "Assinatura de destaque",
  led_wrap: "Faixa luminosa",
};

export default async function SetupPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!token || token.length < 10) notFound();
  const { data: ad } = await getSupabaseAdmin().from("sky_ads").select("id, text, color, bg_color, vehicle, brand, description, link, active").eq("tracking_token", token).maybeSingle();
  if (!ad) notFound();

  if (!ad.active) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#171714] px-6 text-[#f1eee6]">
        <div className="max-w-lg text-center"><p className="text-xs uppercase tracking-[0.24em] text-[#b89a62]">Grupo Maia</p><h1 className="mt-5 text-4xl font-light">Confirmação em processamento</h1><p className="mt-4 text-sm leading-6 text-white/50">Esta página será atualizada automaticamente após a confirmação do pagamento.</p><meta httpEquiv="refresh" content="5" /></div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#171714] text-[#f1eee6]">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-16">
        <div className="border-b border-white/12 pb-8"><p className="text-xs uppercase tracking-[0.24em] text-[#b89a62]">Grupo Maia · Mídia</p><h1 className="mt-4 text-4xl font-light sm:text-6xl">Campanha ativa</h1><p className="mt-4 max-w-2xl text-sm leading-6 text-white/50">Pagamento confirmado. Revise o conteúdo e acompanhe sua presença na plataforma.</p></div>
        <SetupContent token={token} ad={ad} vehicleLabel={FORMAT_LABELS[ad.vehicle] ?? "Formato contratado"} />
      </div>
    </main>
  );
}

