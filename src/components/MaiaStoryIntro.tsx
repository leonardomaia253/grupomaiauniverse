"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { track } from "@vercel/analytics";
import {
  DNA_MAIA_AUDIO,
  DNA_MAIA_CUES,
  COMPANY_IDENTITIES,
  getDnaMaiaCue,
  getStoryAudio,
  getStoryDuration,
  type StoryMode,
} from "@/lib/dna-maia-theme";

const CHAPTER_MEDIA = {
  code: "code",
  origin: "origin",
  intelligence: "intelligence",
  experience: "experience",
  future: "future",
  universe: "universe",
} as const;

type MediaQuality = "480" | "720" | "1080";

function getChapterMedia(chapter: keyof typeof CHAPTER_MEDIA, quality: MediaQuality) {
  const name = CHAPTER_MEDIA[chapter];
  return {
    mp4: `/video/dna-maia/${name}-${quality}.mp4`,
    webm: quality === "720" ? `/video/dna-maia/${name}-720.webm` : undefined,
  };
}

type PlaybackState = "awaiting" | "playing" | "paused" | "ending";

interface MaiaStoryIntroProps {
  onComplete: () => void;
}

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

export default function MaiaStoryIntro({ onComplete }: MaiaStoryIntroProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const endingTimerRef = useRef<number | null>(null);
  const endingRef = useRef(false);
  const resumeAfterVisibilityRef = useRef(false);
  const hideControlsTimerRef = useRef<number | null>(null);
  const mountedAtRef = useRef(0);
  const [mode, setMode] = useState<StoryMode>("short");
  const [time, setTime] = useState(0);
  const [state, setState] = useState<PlaybackState>("awaiting");
  const [muted, setMuted] = useState(false);
  const [captions, setCaptions] = useState(true);
  const [mediaFailed, setMediaFailed] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);
  const [constrainedNetwork, setConstrainedNetwork] = useState(false);
  const [mediaQuality, setMediaQuality] = useState<MediaQuality>("720");
  const [videoLoopOpacity, setVideoLoopOpacity] = useState(0.6);

  const duration = getStoryDuration(mode);
  const cue = useMemo(() => getDnaMaiaCue(time, mode), [mode, time]);
  const cueIndex = DNA_MAIA_CUES.findIndex((item) => item.id === cue.id);
  const nextCue = DNA_MAIA_CUES[Math.min(DNA_MAIA_CUES.length - 1, cueIndex + 1)];
  const progress = Math.min(1, time / duration);
  const visibleCompanies = useMemo(() => {
    if (!cue.companies.length) return [];
    const pages = Array.from({ length: Math.ceil(cue.companies.length / 4) }, (_, index) => cue.companies.slice(index * 4, index * 4 + 4));
    const key = mode === "short" ? "shortAt" : "fullAt";
    const cueEnd = DNA_MAIA_CUES[cueIndex + 1]?.[key] ?? duration;
    const pageDuration = Math.max(1.8, (cueEnd - cue[key]) / pages.length);
    return pages[Math.min(pages.length - 1, Math.floor((time - cue[key]) / pageDuration))];
  }, [cue, cueIndex, duration, mode, time]);
  const activeMedia = getChapterMedia(mediaFailed ? "code" : cue.chapter, mediaQuality);

  const finish = useCallback((reason: "complete" | "skip") => {
    if (endingRef.current) return;
    endingRef.current = true;
    setState("ending");
    const finalProgress = Math.min(100, Math.round(((audioRef.current?.currentTime ?? 0) / duration) * 100));
    track("maia_intro_finished", { reason, mode, progress: finalProgress });
    const audio = audioRef.current;
    if (audio) {
      const start = audio.volume;
      let frame = 0;
      const fade = () => {
        frame += 1;
        audio.volume = Math.max(0, start * (1 - frame / 18));
        if (frame < 18) requestAnimationFrame(fade);
        else audio.pause();
      };
      requestAnimationFrame(fade);
    }
    endingTimerRef.current = window.setTimeout(onComplete, 720);
  }, [duration, mode, onComplete]);

  const sync = useCallback(function updateClock() {
    const audio = audioRef.current;
    if (!audio || audio.paused) return;
    setTime(audio.currentTime);
    rafRef.current = requestAnimationFrame(updateClock);
  }, []);

  const play = useCallback(async () => {
    if (!audioRef.current) {
      const audio = new Audio(getStoryAudio(mode, window.innerWidth <= 640));
      audio.preload = "auto";
      audio.volume = muted ? 0 : 0.92;
      audio.addEventListener("error", () => {
        if (!audio.src.endsWith(DNA_MAIA_AUDIO.fallbackVoice)) {
          audio.src = DNA_MAIA_AUDIO.fallbackVoice;
          audio.load();
        }
      });
      audioRef.current = audio;
    }
    try {
      await audioRef.current.play();
      await videoRef.current?.play().catch(() => undefined);
      setState("playing");
      track("maia_intro_started", { mode });
    } catch {
      setState("awaiting");
    }
  }, [mode, muted]);

  useEffect(() => {
    if (state !== "playing") return;
    const audio = audioRef.current;
    const onEnded = () => finish("complete");
    audio?.addEventListener("ended", onEnded);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(sync);
    return () => {
      audio?.removeEventListener("ended", onEnded);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [finish, state, sync]);

  const togglePause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void play();
    else {
      audio.pause();
      videoRef.current?.pause();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setState("paused");
    }
  }, [play]);

  const seek = useCallback((nextTime: number) => {
    if (mode === "short") return;
    const clamped = Math.max(0, Math.min(duration - 0.1, nextTime));
    if (audioRef.current) audioRef.current.currentTime = clamped;
    setTime(clamped);
  }, [duration, mode]);

  useEffect(() => {
    mountedAtRef.current = performance.now();
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    const lowPowerDevice = navigator.hardwareConcurrency <= 4 || (deviceMemory !== undefined && deviceMemory <= 4);
    const update = () => setReducedMotion(media.matches || lowPowerDevice);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    const constrained = Boolean(connection?.saveData || connection?.effectiveType === "2g" || connection?.effectiveType === "slow-2g");
    setConstrainedNetwork(constrained);
    const renderedWidth = window.innerWidth * Math.min(window.devicePixelRatio || 1, 2);
    setMediaQuality(constrained || window.innerWidth <= 640 ? "480" : renderedWidth >= 1600 && connection?.effectiveType !== "3g" ? "1080" : "720");
    setMuted(localStorage.getItem("maia_intro_muted") === "true");
    setCaptions(localStorage.getItem("maia_intro_captions") !== "false");
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = reducedMotion ? 0.75 : 1;
    void video.play().catch(() => undefined);
  }, [activeMedia, reducedMotion]);

  useEffect(() => {
    if (constrainedNetwork) return;
    const preload = document.createElement("link");
    preload.rel = "preload";
    preload.as = "video";
    preload.href = getChapterMedia(nextCue.chapter, mediaQuality).mp4;
    document.head.appendChild(preload);
    return () => preload.remove();
  }, [constrainedNetwork, mediaQuality, nextCue.chapter]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && audioRef.current && !audioRef.current.paused) {
        resumeAfterVisibilityRef.current = true;
        audioRef.current.pause();
        videoRef.current?.pause();
        setState("paused");
      } else if (!document.hidden && resumeAfterVisibilityRef.current) {
        resumeAfterVisibilityRef.current = false;
        void play();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [play]);

  useEffect(() => {
    if (reducedMotion || !window.matchMedia("(pointer: coarse)").matches) return;
    const onOrientation = (event: DeviceOrientationEvent) => {
      const gamma = Math.max(-18, Math.min(18, event.gamma ?? 0));
      const beta = Math.max(-18, Math.min(18, (event.beta ?? 0) - 45));
      setPointer({ x: gamma / 36, y: beta / 36 });
    };
    window.addEventListener("deviceorientation", onOrientation, { passive: true });
    return () => window.removeEventListener("deviceorientation", onOrientation);
  }, [reducedMotion]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish("skip");
      if (event.key === " ") { event.preventDefault(); togglePause(); }
      if (mode === "full" && event.key === "ArrowRight") seek(time + 5);
      if (mode === "full" && event.key === "ArrowLeft") seek(time - 5);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finish, mode, seek, time, togglePause]);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (endingTimerRef.current) window.clearTimeout(endingTimerRef.current);
    if (hideControlsTimerRef.current) window.clearTimeout(hideControlsTimerRef.current);
    audioRef.current?.pause();
  }, []);

  const activateMode = async (nextMode: StoryMode) => {
    setMode(nextMode);
    setTime(0);
    setMediaFailed(false);
    if (!audioRef.current) {
      const audio = new Audio(getStoryAudio(nextMode, window.innerWidth <= 640));
      audio.preload = "auto";
      audio.volume = muted ? 0 : 0.92;
      audioRef.current = audio;
    }
    audioRef.current.currentTime = 0;
    try {
      await audioRef.current.play();
      await videoRef.current?.play().catch(() => undefined);
      setState("playing");
      track("maia_intro_started", { mode: nextMode });
    } catch {
      setState("awaiting");
    }
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    localStorage.setItem("maia_intro_muted", String(next));
    if (audioRef.current) audioRef.current.volume = next ? 0 : 0.92;
  };

  const toggleCaptions = () => {
    const next = !captions;
    setCaptions(next);
    localStorage.setItem("maia_intro_captions", String(next));
  };

  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (hideControlsTimerRef.current) window.clearTimeout(hideControlsTimerRef.current);
    if (state === "playing") hideControlsTimerRef.current = window.setTimeout(() => setControlsVisible(false), 3200);
  }, [state]);

  const parallaxX = reducedMotion ? 0 : pointer.x * 16;
  const parallaxY = reducedMotion ? 0 : pointer.y * 10;

  return (
    <section
      className={`maia-story fixed inset-0 z-[90] overflow-hidden bg-[#020307] text-white ${state === "ending" ? "maia-story--ending" : ""}`}
      aria-label="Experiência cinematográfica do Grupo Maia"
      onPointerMove={(event) => {
        showControls();
        setPointer({ x: event.clientX / window.innerWidth - 0.5, y: event.clientY / window.innerHeight - 0.5 });
      }}
      onPointerLeave={() => setControlsVisible(false)}
      onFocusCapture={showControls}
    >
      <video
        ref={videoRef}
        key={activeMedia.mp4}
        autoPlay
        loop
        muted
        playsInline
        poster="/og-image.png"
        onLoadedData={() => track("maia_intro_media_ready", { chapter: cue.chapter, quality: mediaQuality, latencyMs: Math.round(performance.now() - mountedAtRef.current) })}
        onError={() => { track("maia_intro_media_error", { chapter: cue.chapter, quality: mediaQuality }); setMediaFailed(true); }}
        onTimeUpdate={(event) => {
          const { currentTime, duration: videoDuration } = event.currentTarget;
          const edge = Math.min(currentTime, Math.max(0, videoDuration - currentTime));
          setVideoLoopOpacity(0.6 * Math.min(1, edge / 0.55));
        }}
        className="absolute inset-0 h-full w-full object-cover opacity-60"
        style={{ transform: `translate3d(${parallaxX}px,${parallaxY}px,0) scale(1.07)`, opacity: videoLoopOpacity }}
        aria-hidden="true"
      >
        {activeMedia.webm && <source src={activeMedia.webm} type="video/webm" />}
        <source src={activeMedia.mp4} type="video/mp4" />
      </video>
      <div className="maia-story__grade absolute inset-0" />
      <div className="absolute inset-0 opacity-20 transition-colors duration-1000" style={{ background: `radial-gradient(circle at 72% 34%, ${cue.accent}55, transparent 38%)` }} />
      <div className="maia-story__noise absolute inset-0 opacity-[0.08]" />
      <div className="maia-story__orbital absolute inset-0" style={{ transform: `translate3d(${-parallaxX * 0.45}px,${-parallaxY * 0.45}px,0)` }} />

      <header className={`relative z-20 flex items-center justify-between px-5 py-5 transition-opacity sm:px-10 lg:px-16 ${controlsVisible ? "opacity-100" : "opacity-35"}`}>
        <span className="text-[9px] uppercase tracking-[.3em] text-white/60">Grupo Maia / Mapa Vivo</span>
        <button type="button" onClick={() => finish("skip")} className="rounded-full border border-white/20 bg-black/20 px-4 py-2 text-[9px] uppercase tracking-[.2em] backdrop-blur-md hover:border-white/60">Entrar no universo</button>
      </header>

      <div className="relative z-10 flex h-[calc(100%-140px)] items-end px-5 pb-16 sm:px-10 sm:pb-20 lg:px-16">
        <div key={cue.id} className="maia-story__copy max-w-5xl" aria-live="polite">
          <div className="mb-5 flex items-center gap-3 text-[9px] uppercase tracking-[.28em]" style={{ color: cue.accent }}>
            <span className="h-px w-10" style={{ backgroundColor: cue.accent }} />
            <span>{cue.title}</span>
            <span className="text-white/35">0{cueIndex + 1} / 0{DNA_MAIA_CUES.length}</span>
          </div>
          {captions && (
            <h1 className="max-w-5xl text-4xl font-medium leading-[.98] tracking-[-.055em] sm:text-6xl lg:text-[clamp(5rem,8vw,9rem)]">
              {cue.line.split(" ").map((word, index) => <span key={`${cue.id}-${index}`} className="maia-story__word mr-[.22em]" style={{ animationDelay: `${index * 55}ms` }}>{word}</span>)}
            </h1>
          )}
          <p className="mt-5 max-w-xl text-sm leading-relaxed text-white/55 sm:text-base">{cue.visual}</p>
          {!!visibleCompanies.length && (
            <div className="mt-7 flex max-w-4xl flex-wrap gap-x-5 gap-y-2" aria-label={`Empresas: ${visibleCompanies.join(", ")}`}>
              {visibleCompanies.map((company, index) => (
                <span key={company} className="maia-story__company text-[10px] uppercase tracking-[.18em]" style={{ animationDelay: `${index * 80}ms`, color: COMPANY_IDENTITIES[company]?.color }}>
                  <span className="mr-2" aria-hidden="true">{COMPANY_IDENTITIES[company]?.symbol}</span>{company}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <footer className={`absolute inset-x-0 bottom-0 z-30 px-5 pb-5 transition-opacity sm:px-10 lg:px-16 ${controlsVisible ? "opacity-100" : "opacity-35"}`}>
        <div className="mb-4 flex items-center justify-between gap-4 text-[9px] uppercase tracking-[.16em] text-white/50">
          <div className="flex items-center gap-4">
            <button type="button" onClick={togglePause}>{state === "paused" ? "Continuar" : "Pausar"}</button>
            <button type="button" onClick={toggleMute}>{muted ? "Ativar som" : "Silenciar"}</button>
            <button type="button" onClick={toggleCaptions}>{captions ? "Ocultar texto" : "Mostrar texto"}</button>
          </div>
          <span className="tabular-nums">{formatTime(time)} / {formatTime(duration)}</span>
        </div>
        <button
          type="button"
          aria-label="Progresso da experiência"
          disabled={mode === "short"}
          className={`group relative block h-5 w-full ${mode === "full" ? "cursor-pointer" : "cursor-default"}`}
          onClick={(event) => seek((event.nativeEvent.offsetX / event.currentTarget.clientWidth) * duration)}
        >
          <span className="absolute inset-x-0 top-1/2 h-px bg-white/20" />
          <span className="absolute left-0 top-1/2 h-px -translate-y-1/2" style={{ width: `${progress * 100}%`, backgroundColor: cue.accent, boxShadow: `0 0 18px ${cue.accent}` }} />
        </button>
      </footer>

      {state === "awaiting" && (
        <div className="absolute inset-0 z-40 grid place-items-center bg-black/50 px-6 backdrop-blur-sm">
          <div className="max-w-xl text-center">
            <p className="text-[9px] uppercase tracking-[.32em] text-cyan-200/70">O DNA Maia está vivo</p>
            <h2 className="mt-5 text-4xl font-medium tracking-[-.05em] sm:text-6xl">Escolha como entrar.</h2>
            <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-white/55">Som, imagem e movimento serão sincronizados a partir do seu toque.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <button type="button" onClick={() => void activateMode("short")} className="rounded-full bg-white px-6 py-3 text-[10px] font-semibold uppercase tracking-[.18em] text-black">Experiência · 75s</button>
              <button type="button" onClick={() => void activateMode("full")} className="rounded-full border border-white/25 px-6 py-3 text-[10px] uppercase tracking-[.18em] text-white">Filme completo · 3min</button>
            </div>
          </div>
        </div>
      )}
      <p className="sr-only">Manifesto audiovisual do Grupo Maia. A narrativa percorre origem, inteligência, crescimento, experiências, território e futuro, conectando vinte e seis empresas em um único mapa vivo.</p>
    </section>
  );
}
