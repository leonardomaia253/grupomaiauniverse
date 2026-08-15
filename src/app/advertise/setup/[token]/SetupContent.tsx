"use client";

import { useState } from "react";
import Link from "next/link";
import { MAX_TEXT_LENGTH } from "@/lib/skyAds";

type Campaign = {
  id: string;
  text: string;
  color: string;
  bg_color: string;
  vehicle: string;
  brand: string | null;
  description: string | null;
  link: string | null;
};

export function SetupContent({
  token,
  ad,
  vehicleLabel,
}: {
  token: string;
  ad: Campaign;
  vehicleLabel: string;
}) {
  const [text, setText] = useState(ad.text);
  const [brand, setBrand] = useState(ad.brand ?? "");
  const [description, setDescription] = useState(ad.description ?? "");
  const [link, setLink] = useState(ad.link ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const textOver = text.length > MAX_TEXT_LENGTH;
  const linkValid = !link || link.startsWith("https://") || link.startsWith("mailto:");

  async function handleSave() {
    if (!linkValid || textOver || !text.trim()) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/sky-ads/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          text: text.trim(),
          brand: brand || undefined,
          description: description || undefined,
          link: link || undefined,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Não foi possível salvar as alterações.");
        setSaving(false);
        return;
      }
      window.location.href = `/advertise/track/${token}`;
    } catch {
      setError("Falha de conexão. Tente novamente.");
      setSaving(false);
    }
  }

  const fieldClass =
    "mt-2 w-full rounded-xl border border-white/15 bg-white/[0.035] px-4 py-3 text-sm text-white outline-none transition focus:border-[#b89a62]";

  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
      <aside className="lg:sticky lg:top-8 lg:self-start">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#b89a62]">Prévia da presença</p>
        <div className="mt-4 overflow-hidden rounded-3xl border border-white/12 bg-[#eeeae0] p-7 text-[#1c1c18]">
          <div className="flex items-center justify-between border-b border-black/15 pb-4 text-[10px] uppercase tracking-[0.18em] text-[#74664d]">
            <span>Conteúdo patrocinado</span>
            <span>{vehicleLabel}</span>
          </div>
          <p className="mt-8 text-3xl font-light leading-tight">{brand || "Nome da marca"}</p>
          <p className="mt-4 max-w-md text-sm leading-6 text-[#5f5b53]">
            {description || "A descrição contextual da campanha aparecerá aqui."}
          </p>
          <div
            className="mt-8 rounded-xl px-4 py-3 text-center text-xs uppercase tracking-[0.16em]"
            style={{ backgroundColor: ad.bg_color, color: ad.color }}
          >
            {text || "Mensagem da campanha"}
          </div>
          {link && <p className="mt-4 truncate text-xs text-[#74664d]">{link}</p>}
        </div>
      </aside>

      <section>
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#b89a62]">Configuração</p>
        <h2 className="mt-3 text-3xl font-light text-white">Conteúdo da campanha</h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-white/55">
          Atualize a mensagem e o destino apresentados aos visitantes. As alterações preservam o formato contratado.
        </p>

        <div className="mt-8 space-y-6">
          <label className="block text-sm text-white/70">
            Mensagem principal
            <input value={text} onChange={(event) => setText(event.target.value)} maxLength={MAX_TEXT_LENGTH + 10} className={fieldClass} />
            <span className={`mt-2 block text-xs ${textOver ? "text-red-300" : "text-white/35"}`}>{text.length}/{MAX_TEXT_LENGTH}</span>
          </label>
          <label className="block text-sm text-white/70">
            Nome da marca
            <input value={brand} onChange={(event) => setBrand(event.target.value)} maxLength={60} className={fieldClass} />
          </label>
          <label className="block text-sm text-white/70">
            Descrição
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={200} rows={5} className={fieldClass} />
          </label>
          <label className="block text-sm text-white/70">
            Link
            <input value={link} onChange={(event) => setLink(event.target.value)} placeholder="https://..." className={fieldClass} />
            {!linkValid && <span className="mt-2 block text-xs text-red-300">Use um endereço HTTPS ou mailto.</span>}
          </label>
        </div>

        {error && <p className="mt-5 text-sm text-red-300">{error}</p>}
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button type="button" onClick={handleSave} disabled={saving || textOver || !linkValid || !text.trim()} className="rounded-full bg-[#b89a62] px-6 py-3 text-sm text-[#171714] transition hover:bg-[#c9ad78] disabled:cursor-not-allowed disabled:opacity-40">
            {saving ? "Salvando…" : "Salvar alterações"}
          </button>
          <Link href={`/advertise/track/${token}`} className="rounded-full border border-white/15 px-6 py-3 text-sm text-white/65 transition hover:border-white/35 hover:text-white">
            Ver indicadores
          </Link>
        </div>
      </section>
    </div>
  );
}

