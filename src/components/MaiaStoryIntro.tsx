"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Pause, Play, Volume2, VolumeX, X } from "lucide-react";
import { track } from "@vercel/analytics";

const FILM_DURATION = 75;
type PlaybackState = "playing" | "paused" | "ending";

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

export default function MaiaStoryIntro({ onComplete }: { onComplete: () => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const finishTimerRef = useRef<number | null>(null);
  const [state, setState] = useState<PlaybackState>("playing");
  const [time, setTime] = useState(0);
  const [muted, setMuted] = useState(true);

  const finish = useCallback((reason: "complete" | "skip") => {
    if (state === "ending") return;
    setState("ending");
    videoRef.current?.pause();
    track("maia_editorial_intro_finished", { reason, progress: Math.round((time / FILM_DURATION) * 100) });
    finishTimerRef.current = window.setTimeout(onComplete, 520);
  }, [onComplete, state, time]);

  const startFilm = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      await video.play();
      setState("playing");
      track("maia_editorial_intro_started", { sound: !video.muted });
    } catch {
      video.muted = true;
      setMuted(true);
      await video.play().catch(() => undefined);
      setState("playing");
      track("maia_editorial_intro_started", { sound: false });
    }
  }, [state]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    void video.play().then(() => setState("playing")).catch(() => setState("paused"));
  }, []);

  const togglePlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (state === "playing") {
      video.pause();
      setState("paused");
    } else void startFilm();
  }, [startFilm, state]);

  const seek = useCallback((next: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(FILM_DURATION - 0.1, next));
    setTime(video.currentTime);
  }, []);

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish("skip");
      if (event.key === " ") { event.preventDefault(); togglePlayback(); }
      if (event.key === "ArrowRight") seek(time + 5);
      if (event.key === "ArrowLeft") seek(time - 5);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finish, seek, time, togglePlayback]);

  useEffect(() => () => {
    videoRef.current?.pause();
    if (finishTimerRef.current) window.clearTimeout(finishTimerRef.current);
  }, []);

  return (
    <section className={`maia-film fixed inset-0 z-[90] overflow-hidden bg-[#12110f] text-[#f4f0e8] ${state === "ending" ? "maia-film--ending" : ""}`} aria-label="Apresentação do Grupo Maia">
      <video
        ref={videoRef}
        preload="auto"
        autoPlay
        muted={muted}
        playsInline
        className="maia-film__video"
        onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
        onEnded={() => finish("complete")}
        aria-label="Filme institucional do Grupo Maia"
      >
        <source src="/video/grupo-maia/filme-9x16.mp4?v=audio-musical-2" media="(orientation: portrait)" type="video/mp4" />
        <source src="/video/grupo-maia/filme-16x9.mp4?v=audio-musical-2" type="video/mp4" />
      </video>
      <div className="maia-film__wash" />

      <header className="maia-film__header">
        <button className="maia-text-action" type="button" onClick={() => finish("skip")}>Ir para o mapa <ArrowRight size={15} /></button>
      </header>

      <footer className="maia-film__controls">
        <div className="maia-film__transport">
          <button type="button" onClick={togglePlayback} aria-label={state === "playing" ? "Pausar" : "Continuar"}>{state === "playing" ? <Pause size={16} /> : <Play size={16} />}</button>
          <button type="button" onClick={toggleMute} aria-label={muted ? "Ativar som" : "Silenciar"}>{muted ? <VolumeX size={16} /> : <Volume2 size={16} />}</button>
        </div>
        <button type="button" className="maia-film__timeline" aria-label="Posição do filme" onClick={(event) => seek((event.nativeEvent.offsetX / event.currentTarget.clientWidth) * FILM_DURATION)}><span style={{ width: `${Math.min(100, (time / FILM_DURATION) * 100)}%` }} /></button>
        <span className="maia-film__time">{formatTime(time)} / {formatTime(FILM_DURATION)}</span>
        <button type="button" className="maia-film__close" onClick={() => finish("skip")} aria-label="Fechar apresentação"><X size={17} /></button>
      </footer>
    </section>
  );
}
