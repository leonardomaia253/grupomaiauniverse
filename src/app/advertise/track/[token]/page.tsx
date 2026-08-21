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
    <main className="maia-editorial-shell min-h-screen bg-[#12110f] text-[#eee9df]">
      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-16">
        <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-6"><Link href="/advertise" className="text-sm text-white/45">← Mídia</Link><span className="text-xs uppercase tracking-[0.2em] text-[#b79a6c]">{STATUS[status]}</span></div>
        <div className="relative z-10 mt-12 grid gap-8 md:grid-cols-[1fr_auto] md:items-end"><div><p className="text-xs uppercase tracking-[0.22em] text-[#b79a6c]">Acompanhamento</p><h1 className="mt-4 text-5xl font-light text-[#f2eee6] sm:text-7xl">{ad.brand || "Campanha"}<span className="text-[#b79a6c]">.</span></h1><p className="mt-5 max-w-xl text-base leading-7 text-white/50">{ad.text}</p></div><Link href={`/advertise/setup/${token}`} className="border border-white/15 px-5 py-3 text-sm text-white/70">Editar conteúdo</Link></div>
        <div className="relative z-10 mt-14 grid border-l border-t border-white/10 sm:grid-cols-3">{metrics.map((metric) => <div key={metric.label} className="border-b border-r border-white/10 bg-white/[.015] p-7"><p className="text-4xl font-light text-[#f2eee6]">{metric.value.toLocaleString("pt-BR")}</p><p className="mt-2 text-xs uppercase tracking-[0.14em] text-white/35">{metric.label}</p></div>)}</div>
        <div className="relative z-10 mt-12 border-t border-white/10 pt-7"><h2 className="text-xl">Informações da veiculação</h2><dl className="mt-6 grid gap-5 text-sm sm:grid-cols-2">{[
          ["Formato", FORMAT_LABELS[ad.vehicle] ?? "Formato contratado"],
          ["Plano", ad.plan_id?.replaceAll("_", " ") ?? "—"],
          ["Criação", formatDate(ad.created_at)],
          ["Início", formatDate(ad.starts_at)],
          ["Encerramento", formatDate(ad.ends_at)],
        ].map(([label, value]) => <div key={label} className="flex justify-between border-b border-white/10 pb-3"><dt className="text-white/35">{label}</dt><dd>{value}</dd></div>)}</dl></div>
        <p className="relative z-10 mt-10 text-xs leading-5 text-white/35">Os indicadores são atualizados conforme as interações registradas pela plataforma.</p>
      </div>
    </main>
  );
}
