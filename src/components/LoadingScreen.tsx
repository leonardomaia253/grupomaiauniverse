"use client";

import { useCallback, useEffect, useState } from "react";

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
  init: "Abrindo os portais",
  fetching: "Carregando empresas do grupo",
  generating: "Organizando histórias e informações",
  rendering: "Preparando o Mapa Vivo",
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
        <div className="maia-wordmark justify-center" aria-label="Grupo Maia"><span>MAIA</span><small>Grupo</small></div>
        <h1 className="mt-10 text-3xl font-normal tracking-[-.04em] sm:text-5xl">{isError ? "Não foi possível abrir o mapa." : "Organizando o mapa do grupo."}</h1>
        <p className="mt-4 text-sm text-black/50">{isError ? error || STAGE_MESSAGES.error : STAGE_MESSAGES[stage]}</p>
        {!isError ? (
          <div className="mt-9">
            <div className="h-px w-full bg-black/15"><div className="h-full bg-[#9b7b4f] transition-[width] duration-500" style={{ width: `${clampedProgress}%` }} /></div>
            <div className="mt-3 flex justify-between text-[10px] tracking-[.08em] text-black/40"><span>Carregando</span><span>{Math.round(clampedProgress)}%</span></div>
          </div>
        ) : (
          <button type="button" onClick={onRetry} className="mt-8 rounded-full px-6 py-3 text-[10px] font-semibold uppercase tracking-[.18em] text-black" style={{ backgroundColor: accentColor }}>Tentar novamente</button>
        )}
      </div>
    </div>
  );
}
