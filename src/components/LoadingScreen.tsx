"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type LoadingStage =
  | "init"
  | "fetching"
  | "generating"
  | "rendering"
  | "ready"
  | "done"
  | "error";

interface LoadingScreenProps {
  stage: LoadingStage;
  progress: number;
  error: string | null;
  accentColor: string;
  onRetry: () => void;
  onFadeComplete: () => void;
}

const SCRIPT_LINES = [
  "Olhe ao seu redor...",
  "Bilhoes de mentes, conexoes e possibilidades...",
  "Uma energia que transforma ideias em imperios.",
  "Tecnologia em magia. Caos em sincronia.",
  "Nos criamos o amanha.",
  "Bem-vindo ao Grupo Maia.",
];

const STAGE_MESSAGES: Record<string, string> = {
  init: "Abrindo os portais...",
  fetching: "Conectando empresas e possibilidades...",
  generating: "Desenhando o grande grafo Maia...",
  rendering: "Sincronizando energia coletiva...",
  ready: "O proximo capitulo comeca agora",
};

const BACKDROPS = [
  "radial-gradient(circle at 25% 20%, rgba(54, 211, 255, 0.28), transparent 32%), radial-gradient(circle at 72% 34%, rgba(252, 211, 77, 0.22), transparent 34%), linear-gradient(135deg, #06111f 0%, #04050b 58%, #0b0712 100%)",
  "radial-gradient(circle at 58% 28%, rgba(160, 116, 255, 0.26), transparent 34%), radial-gradient(circle at 32% 68%, rgba(41, 211, 157, 0.18), transparent 36%), linear-gradient(145deg, #070916 0%, #05050a 64%, #110913 100%)",
  "radial-gradient(circle at 50% 18%, rgba(255, 255, 255, 0.14), transparent 28%), radial-gradient(circle at 70% 70%, rgba(255, 198, 87, 0.18), transparent 34%), linear-gradient(160deg, #07131d 0%, #030407 66%, #080910 100%)",
];

let introAudio: HTMLAudioElement | null = null;
let introHasPlayed = false;

function useIntroLine(progress: number): number {
  return Math.min(SCRIPT_LINES.length - 1, Math.floor((Math.max(0, progress) / 100) * SCRIPT_LINES.length));
}

export default function LoadingScreen({
  stage,
  progress,
  error,
  accentColor,
  onRetry,
  onFadeComplete,
}: LoadingScreenProps) {
  const [fading, setFading] = useState(false);
  const [backdropIndex, setBackdropIndex] = useState(0);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const audioAttempted = useRef(false);
  const lineIndex = useIntroLine(progress);
  const isError = stage === "error";
  const clampedProgress = Math.min(100, progress);
  const message = isError ? error : (STAGE_MESSAGES[stage] ?? "");

  const startIntroAudio = useCallback(async () => {
    if (isError || introHasPlayed) return;
    if (!introAudio) {
      introAudio = new Audio("/audio/grupo-maia-intro.mp3");
      introAudio.preload = "auto";
      introAudio.volume = 0.82;
      introAudio.addEventListener("ended", () => {
        introHasPlayed = true;
      });
    }

    try {
      await introAudio.play();
      setAudioBlocked(false);
    } catch {
      setAudioBlocked(true);
    }
  }, [isError]);

  useEffect(() => {
    const timer = setInterval(() => setBackdropIndex((index) => (index + 1) % BACKDROPS.length), 5200);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (stage !== "ready") return;
    const frame = requestAnimationFrame(() => setFading(true));
    return () => cancelAnimationFrame(frame);
  }, [stage]);

  useEffect(() => {
    if (audioAttempted.current || isError) return;
    audioAttempted.current = true;
    const timer = window.setTimeout(() => {
      startIntroAudio();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isError, startIntroAudio]);

  useEffect(() => {
    if (isError || introHasPlayed) return;
    const unlock = () => {
      startIntroAudio();
    };
    window.addEventListener("pointerdown", unlock, { passive: true });
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, [isError, startIntroAudio]);

  const handleTransitionEnd = useCallback(() => {
    if (fading) onFadeComplete();
  }, [fading, onFadeComplete]);

  return (
    <div
      className={`fixed inset-0 z-100 overflow-hidden transition-opacity duration-1000 ${fading ? "opacity-0" : "opacity-100"}`}
      style={{ background: "#030407" }}
      onTransitionEnd={handleTransitionEnd}
    >
      {BACKDROPS.map((backdrop, index) => (
        <div
          key={backdrop}
          className="absolute inset-0 scale-105 transition-opacity duration-[1800ms]"
          style={{
            background: backdrop,
            filter: "blur(10px)",
            opacity: index === backdropIndex ? 1 : 0,
          }}
        />
      ))}

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.2),rgba(0,0,0,0.55))]" />
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at center, transparent 0, transparent 42%, rgba(0,0,0,0.84) 100%)" }} />

      <div className="maia-motes pointer-events-none absolute inset-0" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <p className="font-space text-[10px] uppercase tracking-[0.32em] text-white/45">Grupo Maia Universe</p>
        <h1 className="font-orbitron mt-4 max-w-4xl text-3xl font-semibold leading-tight text-white sm:text-6xl">
          {SCRIPT_LINES[lineIndex]}
        </h1>
        <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/55 sm:text-base">
          {message}
        </p>

        {!isError && (
          <div className="mt-10 w-full max-w-md">
            <div className="h-px w-full bg-white/15">
              <div
                className="h-px transition-[width] duration-500"
                style={{
                  width: `${clampedProgress}%`,
                  backgroundColor: accentColor,
                  boxShadow: `0 0 24px ${accentColor}`,
                }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-white/38">
              <span>Adscendo</span>
              <span>{Math.round(clampedProgress)}%</span>
            </div>
          </div>
        )}

        {isError && (
          <button
            onClick={onRetry}
            className="mt-8 rounded-sm px-7 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-black transition hover:brightness-110"
            style={{ backgroundColor: accentColor }}
          >
            Tentar novamente
          </button>
        )}

        {!isError && audioBlocked && (
          <button
            onClick={startIntroAudio}
            className="mt-5 border border-white/20 bg-white/[0.06] px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/72 transition hover:border-white/35 hover:bg-white/[0.1] hover:text-white"
          >
            Ativar voz
          </button>
        )}
      </div>

      <style>{`
        .maia-motes {
          background-image:
            radial-gradient(circle at 18% 22%, rgba(255,255,255,0.42) 0 1px, transparent 2px),
            radial-gradient(circle at 72% 18%, rgba(255,255,255,0.3) 0 1px, transparent 2px),
            radial-gradient(circle at 38% 72%, rgba(255,255,255,0.34) 0 1px, transparent 2px),
            radial-gradient(circle at 84% 68%, rgba(255,255,255,0.24) 0 1px, transparent 2px),
            radial-gradient(circle at 54% 44%, rgba(255,255,255,0.18) 0 1px, transparent 2px);
          animation: maia-mote-drift 8s ease-in-out infinite;
        }
        @keyframes maia-mote-drift {
          0%, 100% { transform: translate3d(0, 0, 0); opacity: 0.45; }
          50% { transform: translate3d(10px, -18px, 0); opacity: 0.82; }
        }
      `}</style>
    </div>
  );
}
