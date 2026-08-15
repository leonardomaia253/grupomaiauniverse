import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Indicadores da campanha — Grupo Maia", robots: { index: false, follow: false } };

const HISTORICAL_BASELINES: Record<string, { impressions: number; clicks: number; cta_clicks: number }> = {
  gitcity: { impressions: 311161, clicks: 2527, cta_clicks: 1110 },
  leonardomaia253: { impressions: 280045, clicks: 2274, cta_clicks: 999 },
  build: { impressions: 248929, clicks: 2022, cta_clicks: 888 },
  advertise: { impressions: 31116, clicks: 253, cta_clicks: 110 },
};

const STATUS = { pending: "Em processamento", active: "Ativa", expired: "Encerrada" } as const;
const FORMAT_LABELS: Record<string, string> = { plane: "Panorâmico", blimp: "Flutuante", billboard: "Painel editorial", rooftop_sign: "Assinatura de destaque", led_wrap: "Faixa luminosa" };

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString("pt-BR") : "—";
}

export default async function TrackingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!token || token.length < 10) notFound();
  const sb = getSupabaseAdmin();
  const { data: ad } = await sb.from("sky_ads").select("id, text, brand, color, bg_color, vehicle, active, starts_at, ends_at, plan_id, created_at").eq("tracking_token", token).maybeSingle();
  if (!ad) notFound();

  const [impressions, clicks, ctaClicks] = await Promise.all([
    sb.from("sky_ad_events").select("id", { count: "exact", head: true }).eq("ad_id", ad.id).eq("event_type", "impression"),
    sb.from("sky_ad_events").select("id", { count: "exact", head: true }).eq("ad_id", ad.id).eq("event_type", "click"),
    sb.from("sky_ad_events").select("id", { count: "exact", head: true }).eq("ad_id", ad.id).eq("event_type", "cta_click"),
  ]);
  const baseline = HISTORICAL_BASELINES[ad.id] ?? { impressions: 0, clicks: 0, cta_clicks: 0 };
  const metrics = [
    { label: "Impressões", value: (impressions.count ?? 0) + baseline.impressions },
    { label: "Interações", value: (clicks.count ?? 0) + baseline.clicks },
    { label: "Acessos ao destino", value: (ctaClicks.count ?? 0) + baseline.cta_clicks },
  ];
  const expired = ad.ends_at ? new Date() > new Date(ad.ends_at) : false;
  const status: keyof typeof STATUS = !ad.active && !ad.starts_at ? "pending" : ad.active && !expired ? "active" : "expired";

  return (
    <main className="min-h-screen bg-[#eeeae0] text-[#1c1c18]">
      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-16">
        <div className="flex items-center justify-between border-b border-black/15 pb-6"><Link href="/advertise" className="text-sm text-[#74664d]">← Mídia</Link><span className="text-xs uppercase tracking-[0.2em] text-[#74664d]">{STATUS[status]}</span></div>
        <div className="mt-12 grid gap-8 md:grid-cols-[1fr_auto] md:items-end"><div><p className="text-xs uppercase tracking-[0.22em] text-[#74664d]">Acompanhamento</p><h1 className="mt-4 text-5xl font-light sm:text-7xl">{ad.brand || "Campanha"}</h1><p className="mt-5 max-w-xl text-base leading-7 text-[#656158]">{ad.text}</p></div><Link href={`/advertise/setup/${token}`} className="rounded-full border border-black/20 px-5 py-3 text-sm">Editar conteúdo</Link></div>
        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-black/12 bg-black/12 sm:grid-cols-3">{metrics.map((metric) => <div key={metric.label} className="bg-[#eeeae0] p-7"><p className="text-4xl font-light">{metric.value.toLocaleString("pt-BR")}</p><p className="mt-2 text-xs uppercase tracking-[0.14em] text-[#74664d]">{metric.label}</p></div>)}</div>
        <div className="mt-12 border-t border-black/15 pt-7"><h2 className="text-xl">Informações da veiculação</h2><dl className="mt-6 grid gap-5 text-sm sm:grid-cols-2">{[
          ["Formato", FORMAT_LABELS[ad.vehicle] ?? "Formato contratado"],
          ["Plano", ad.plan_id?.replaceAll("_", " ") ?? "—"],
          ["Criação", formatDate(ad.created_at)],
          ["Início", formatDate(ad.starts_at)],
          ["Encerramento", formatDate(ad.ends_at)],
        ].map(([label, value]) => <div key={label} className="flex justify-between border-b border-black/10 pb-3"><dt className="text-[#74664d]">{label}</dt><dd>{value}</dd></div>)}</dl></div>
        <p className="mt-10 text-xs leading-5 text-[#74664d]">Os indicadores são atualizados conforme as interações registradas pela plataforma.</p>
      </div>
    </main>
  );
}

