"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ArrowRight, Captions, Pause, Play, Volume2, VolumeX, X } from "lucide-react";
import { track } from "@vercel/analytics";
import { ALL_MAIA_COMPANIES, DNA_MAIA_CUES, getDnaMaiaCue, getStoryAudio, getStoryDuration } from "@/lib/dna-maia-theme";

const FILM_DURATION = getStoryDuration("full");
type PlaybackState = "cover" | "playing" | "paused" | "ending";
type MediaQuality = "480" | "720" | "1080";

function mediaFor(chapter: string, quality: MediaQuality) {
  return {
    mp4: `/video/dna-maia/${chapter}-${quality}.mp4`,
    webm: quality === "720" ? `/video/dna-maia/${chapter}-720.webm` : undefined,
  };
}

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

export default function MaiaStoryIntro({ onComplete }: { onComplete: () => void }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const finishTimerRef = useRef<number | null>(null);
  const clockOriginRef = useRef(0);
  const [state, setState] = useState<PlaybackState>("cover");
  const [time, setTime] = useState(0);
  const [muted, setMuted] = useState(false);
  const [captions, setCaptions] = useState(true);
  const [quality, setQuality] = useState<MediaQuality>("720");
  const cue = useMemo(() => getDnaMaiaCue(time, "short"), [time]);
  const cueIndex = DNA_MAIA_CUES.findIndex((item) => item.id === cue.id);
  const media = mediaFor(cue.chapter, quality);
  const progress = Math.min(1, time / FILM_DURATION);

  const finish = useCallback((reason: "complete" | "skip") => {
    if (state === "ending") return;
    setState("ending");
    audioRef.current?.pause();
    videoRef.current?.pause();
    track("maia_editorial_intro_finished", { reason, progress: Math.round(progress * 100) });
    finishTimerRef.current = window.setTimeout(onComplete, 520);
  }, [onComplete, progress, state]);

  const tick = useCallback(function update() {
    if (state !== "playing") return;
    const current = Math.min(FILM_DURATION, (performance.now() - clockOriginRef.current) / 1000);
    setTime(current);
    if (current >= FILM_DURATION) finish("complete");
    else rafRef.current = requestAnimationFrame(update);
  }, [finish, state]);

  const startFilm = useCallback(async () => {
    let audio = audioRef.current;
    if (!audio) {
      audio = new Audio(getStoryAudio("short"));
      audio.preload = "auto";
      audio.loop = true;
      audio.volume = muted ? 0 : 0.48;
      audioRef.current = audio;
    }
    try {
      clockOriginRef.current = performance.now() - time * 1000;
      await audio.play();
      await videoRef.current?.play().catch(() => undefined);
      setState("playing");
      track("maia_editorial_intro_started", { sound: !muted });
    } catch {
      setMuted(true);
      setState("playing");
      await videoRef.current?.play().catch(() => undefined);
    }
  }, [muted, time]);

  const togglePlayback = useCallback(() => {
    if (state === "playing") {
      audioRef.current?.pause();
      videoRef.current?.pause();
      setState("paused");
    } else void startFilm();
  }, [startFilm, state]);

  const seek = useCallback((next: number) => {
    const value = Math.max(0, Math.min(FILM_DURATION - 0.1, next));
    clockOriginRef.current = performance.now() - value * 1000;
    if (audioRef.current?.duration) audioRef.current.currentTime = value % audioRef.current.duration;
    setTime(value);
  }, []);

  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const width = window.innerWidth * Math.min(window.devicePixelRatio || 1, 2);
    setQuality(connection?.saveData || window.innerWidth < 680 ? "480" : width > 1700 ? "1080" : "720");
  }, []);

  useEffect(() => {
    if (state !== "playing") return;
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [state, tick]);

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
    audioRef.current?.pause();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (finishTimerRef.current) window.clearTimeout(finishTimerRef.current);
  }, []);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    if (audioRef.current) audioRef.current.volume = next ? 0 : 0.48;
  };

  return (
    <section className={`maia-film fixed inset-0 z-[90] overflow-hidden bg-[#12110f] text-[#f4f0e8] ${state === "ending" ? "maia-film--ending" : ""}`} aria-label="Apresentação do Grupo Maia">
      <video ref={videoRef} key={media.mp4} autoPlay loop muted playsInline className="maia-film__video" aria-hidden="true">
        {media.webm && <source src={media.webm} type="video/webm" />}
        <source src={media.mp4} type="video/mp4" />
      </video>
      <div className="maia-film__wash" />

      <header className="maia-film__header">
        <div className="maia-wordmark" aria-label="Grupo Maia"><span>MAIA</span><small>Grupo</small></div>
        <button className="maia-text-action" type="button" onClick={() => finish("skip")}>Ir para o mapa <ArrowRight size={15} /></button>
      </header>

      {state === "cover" ? (
        <div className="maia-film__cover">
          <p className="maia-kicker">Filme institucional · Grupo Maia</p>
          <h1>27 negócios.<br /><em>Uma visão.</em></h1>
          <p className="maia-film__lead">Uma jornada cinematográfica pelo ecossistema que conecta tecnologia, comércio, experiências, território e futuro.</p>
          <div className="maia-film__actions">
            <button type="button" className="maia-primary-action" onClick={() => void startFilm()}><Play size={15} fill="currentColor" /> Entrar no ecossistema <span>2min30</span></button>
            <button type="button" className="maia-secondary-action" onClick={() => finish("skip")}>Conhecer as empresas</button>
          </div>
          <div className="maia-film__proof" aria-label={`${ALL_MAIA_COMPANIES.length} empresas em quatro frentes de atuação`}>
            <span><strong>{ALL_MAIA_COMPANIES.length}</strong> negócios</span><span>17 movimentos</span><span>1 visão</span>
          </div>
        </div>
      ) : (
        <>
          <main key={cue.id} className="maia-film__story" aria-live="polite" style={{ "--cue-accent": cue.accent } as CSSProperties}>
            <p className="maia-kicker"><span>{String(cueIndex + 1).padStart(2, "0")}</span> {cue.title}</p>
            {captions && <h1>{cue.line}</h1>}
            <p className="maia-film__lead">{cue.visual}</p>
            {cue.companies.length > 0 && <ul className="maia-film__companies" aria-label={`Empresas desta frente: ${cue.companies.join(", ")}`}>{cue.companies.map((company) => <li key={company}>{company}</li>)}</ul>}
          </main>
          <footer className="maia-film__controls">
            <div className="maia-film__transport">
              <button type="button" onClick={togglePlayback} aria-label={state === "playing" ? "Pausar" : "Continuar"}>{state === "playing" ? <Pause size={16} /> : <Play size={16} />}</button>
              <button type="button" onClick={toggleMute} aria-label={muted ? "Ativar trilha" : "Silenciar trilha"}>{muted ? <VolumeX size={16} /> : <Volume2 size={16} />}</button>
              <button type="button" onClick={() => setCaptions((value) => !value)} aria-label={captions ? "Ocultar texto" : "Mostrar texto"}><Captions size={17} /></button>
            </div>
            <button type="button" className="maia-film__timeline" aria-label="Posição do filme" onClick={(event) => seek((event.nativeEvent.offsetX / event.currentTarget.clientWidth) * FILM_DURATION)}><span style={{ width: `${progress * 100}%` }} /></button>
            <span className="maia-film__time">{formatTime(time)} / {formatTime(FILM_DURATION)}</span>
            <button type="button" className="maia-film__close" onClick={() => finish("skip")} aria-label="Fechar apresentação"><X size={17} /></button>
          </footer>
        </>
      )}
    </section>
  );
}
