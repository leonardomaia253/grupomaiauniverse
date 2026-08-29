"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";

export type LoadingStage = "init" | "fetching" | "generating" | "rendering" | "ready" | "done" | "error";

interface LoadingScreenProps {
  stage: LoadingStage;
  progress: number;
  error: string | null;
  accentColor: string;
  onRetry: () => void;
  onFadeComplete: () => void;
}

const STAGE_MESSAGES: Record<LoadingStage, string> = {
  init: "Preparando o ecossistema",
  fetching: "Carregando empresas do grupo",
  generating: "Organizando relações e setores",
  rendering: "Desenhando a teia de empresas",
  ready: "Universo pronto",
  done: "Universo pronto",
  error: "Não foi possível carregar o mapa",
};

export default function LoadingScreen({ stage, progress, error, accentColor, onRetry, onFadeComplete }: LoadingScreenProps) {
  const [fading, setFading] = useState(false);
  const isReady = stage === "ready";
  const isError = stage === "error";
  const clampedProgress = Math.max(0, Math.min(100, progress));

  const finish = useCallback(() => setFading(true), []);

  useEffect(() => {
    if (!isReady || fading) return;
    const timer = window.setTimeout(finish, 500);
    return () => window.clearTimeout(timer);
  }, [fading, finish, isReady]);

  return (
    <div
      className={`maia-loading fixed inset-0 z-[100] grid min-h-[100svh] place-items-center overflow-hidden px-6 text-center transition-opacity duration-700 ${fading ? "opacity-0" : "opacity-100"}`}
      onTransitionEnd={() => fading && onFadeComplete()}
      role="status"
      aria-live="polite"
    >
      <div className="relative w-full max-w-md">
        <Image className="maia-splash-symbol mx-auto" src="/brand/grupo-maia-symbol-reverse.svg" alt="Símbolo do Grupo Maia" width={112} height={112} priority />
        <div className="maia-splash-wordmark mt-7" aria-label="Grupo Maia Universe"><strong>Grupo Maia</strong><span>Universe</span></div>
        <h1 className="sr-only">{isError ? "Não foi possível abrir o mapa." : "Carregando o Grupo Maia Universe"}</h1>
        <p className="mt-8 text-[11px] uppercase tracking-[.16em] text-white/48">{isError ? error || STAGE_MESSAGES.error : STAGE_MESSAGES[stage]}</p>
        {!isError ? (
          <div className="mt-9">
            <div className="h-px w-full bg-white/12"><div className="h-full bg-[#dbe7cf] transition-[width] duration-500" style={{ width: `${clampedProgress}%` }} /></div>
            <div className="mt-3 flex justify-between text-[10px] uppercase tracking-[.12em] text-white/35"><span>29 empresas conectadas</span><span>{Math.round(clampedProgress)}%</span></div>
          </div>
        ) : (
          <button type="button" onClick={onRetry} className="mt-8 border border-[#dbe7cf] px-6 py-3 text-[10px] font-semibold uppercase tracking-[.18em] text-[#f4f1e9]" style={{ borderColor: accentColor }}>Tentar novamente</button>
        )}
      </div>
    </div>
  );
}
