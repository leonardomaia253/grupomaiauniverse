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
      className={`fixed inset-0 z-[100] grid min-h-[100svh] place-items-center overflow-hidden bg-[#030407] px-6 text-center text-white transition-opacity duration-700 ${fading ? "opacity-0" : "opacity-100"}`}
      onTransitionEnd={() => fading && onFadeComplete()}
      role="status"
      aria-live="polite"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(64,190,255,.18),transparent_32%),linear-gradient(145deg,#06111f,#030407_60%)]" />
      <div className="maia-loader-orbit absolute left-1/2 top-1/2 h-[min(72vw,34rem)] w-[min(72vw,34rem)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10" />
      <div className="relative w-full max-w-md">
        <p className="text-[9px] uppercase tracking-[.32em] text-white/45">Grupo Maia / Mapa Vivo</p>
        <h1 className="mt-5 text-3xl font-medium tracking-[-.04em] sm:text-5xl">{isError ? "Conexão interrompida." : "Preparando o universo."}</h1>
        <p className="mt-4 text-sm text-white/50">{isError ? error || STAGE_MESSAGES.error : STAGE_MESSAGES[stage]}</p>
        {!isError ? (
          <div className="mt-9">
            <div className="h-px w-full bg-white/15"><div className="h-full transition-[width] duration-500" style={{ width: `${clampedProgress}%`, backgroundColor: accentColor, boxShadow: `0 0 18px ${accentColor}` }} /></div>
            <div className="mt-3 flex justify-between text-[9px] uppercase tracking-[.2em] text-white/35"><span>Sincronizando</span><span>{Math.round(clampedProgress)}%</span></div>
          </div>
        ) : (
          <button type="button" onClick={onRetry} className="mt-8 rounded-full px-6 py-3 text-[10px] font-semibold uppercase tracking-[.18em] text-black" style={{ backgroundColor: accentColor }}>Tentar novamente</button>
        )}
      </div>
    </div>
  );
}
