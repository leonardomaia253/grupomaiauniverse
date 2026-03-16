"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

// ─── Types ─────────────────────────────────────────────────────

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

// ─── Constants ─────────────────────────────────────────────────

const STAGE_MESSAGES: Record<string, string> = {
  init:       "Initializing systems...",
  fetching:   "Syncing company data...",
  generating: "Mapping gravitational fields...",
  rendering:  "Rendering planetary orbits...",
  ready:      "Welcome to the Universe",
};

const TIPS = [
  "Click any planet to see that company's profile",
  "Use Fly Mode to cruise above the skyline",
  "Larger planets = stronger KPIs",
  "Try searching for a company by name",
  "Planets glow brighter with recent activity",
  "Customize your planet from the shop",
  "Explore Mode shows the full Universe layout",
];

// ─── Floating Particle (pure CSS) ──────────────────────────────

interface Particle {
  left: number;   // %
  bottom: number; // %
  size: number;   // px
  duration: number; // s
  delay: number;  // s
  opacity: number;
}

function useParticles(count: number): Particle[] {
  return useMemo(() => {
    const result: Particle[] = [];
    for (let i = 0; i < count; i++) {
      result.push({
        left:     Math.random() * 95,
        bottom:   Math.random() * 20,
        size:     2 + Math.random() * 3,
        duration: 5 + Math.random() * 7,
        delay:    Math.random() * 6,
        opacity:  0.3 + Math.random() * 0.5,
      });
    }
    return result;
  }, [count]);
}

// ─── Component ─────────────────────────────────────────────────

export default function LoadingScreen({
  stage,
  progress,
  error,
  accentColor,
  onRetry,
  onFadeComplete,
}: LoadingScreenProps) {
  const [tipIndex, setTipIndex] = useState(0);
  const [fading, setFading] = useState(false);

  const particles = useParticles(18);

  // Rotate tips every 4s
  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((i) => (i + 1) % TIPS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Trigger fade-out when stage becomes "ready"
  useEffect(() => {
    if (stage === "ready") {
      setFading(true);
    }
  }, [stage]);

  const handleTransitionEnd = useCallback(() => {
    if (fading) onFadeComplete();
  }, [fading, onFadeComplete]);

  const isError = stage === "error";
  const message = isError ? error : (STAGE_MESSAGES[stage] ?? "");
  const clampedProgress = Math.min(100, progress);

  return (
    <div
      className={`fixed inset-0 z-100 flex flex-col items-center justify-center transition-opacity duration-700 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
      style={{ background: "radial-gradient(ellipse at 50% 60%, #0d1420 0%, #060810 60%, #000002 100%)" }}
      onTransitionEnd={handleTransitionEnd}
    >
      {/* ── Hex grid background overlay ── */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M28 66L0 50V16L28 0l28 16v34z' fill='none' stroke='%23ffffff' strokeWidth='0.5'/%3E%3Cpath d='M28 100L0 84V50l28-16 28 16v34z' fill='none' stroke='%23ffffff' strokeWidth='0.5'/%3E%3C/svg%3E")`,
          backgroundSize: "56px 100px",
        }}
      />

      {/* ── Scanline sweep ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="holo-scan absolute left-0 right-0 h-20"
          style={{
            background: `linear-gradient(to bottom, transparent, ${accentColor}15, transparent)`,
          }}
        />
      </div>

      {/* ── Floating particles ── */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-64 overflow-hidden">
        {particles.map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left:   `${p.left}%`,
              bottom: `${p.bottom}%`,
              width:  p.size,
              height: p.size,
              backgroundColor: accentColor,
              "--fp-opacity": p.opacity,
              animation: `float-particle ${p.duration}s ease-in-out ${p.delay}s infinite`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* ── Main Content ── */}
      <div className="relative z-10 flex flex-col items-center gap-0">
        {/* Title */}
        <h1
          className="font-orbitron glitch-text select-none text-3xl font-black tracking-[0.3em] sm:text-5xl"
          style={{ color: accentColor }}
        >
          MAIA
          <span
            className="neon-text ml-3 text-2xl font-light tracking-[0.5em] sm:text-4xl opacity-80"
            style={{ color: accentColor }}
          >
            UNIVERSE
          </span>
        </h1>

        {/* Stage message */}
        <p
          className="font-space mt-5 text-xs tracking-[0.2em] uppercase sm:text-sm"
          style={{ color: accentColor + "99" }}
        >
          {message}
        </p>

        {/* ── HUD Progress Bar ── */}
        {!isError && (
          <div className="relative mt-8 w-64 sm:w-80">
            {/* Track */}
            <div
              className="h-[2px] w-full opacity-30"
              style={{ backgroundColor: accentColor }}
            />
            {/* Fill */}
            <div
              className="absolute left-0 top-0 h-[2px] transition-[width] duration-300"
              style={{
                width: `${clampedProgress}%`,
                backgroundColor: accentColor,
                boxShadow: `0 0 8px 2px ${accentColor}88`,
              }}
            />
            {/* Glowing dot at progress edge */}
            <div
              className="hud-dot-glow absolute top-1/2 -translate-y-1/2 h-2 w-2 rounded-full transition-[left] duration-300"
              style={{
                left:            `calc(${clampedProgress}% - 4px)`,
                backgroundColor: accentColor,
                "--hud-color":   accentColor,
              } as React.CSSProperties}
            />
            {/* Percentage label */}
            <div
              className="font-orbitron absolute right-0 mt-1 top-3 text-[10px] tabular-nums"
              style={{ color: accentColor + "80" }}
            >
              {Math.round(clampedProgress)}%
            </div>
          </div>
        )}

        {/* Error retry */}
        {isError && (
          <button
            onClick={onRetry}
            className="font-orbitron mt-8 px-8 py-2 text-xs tracking-widest uppercase transition-opacity hover:opacity-80"
            style={{
              backgroundColor: accentColor,
              color:            "#000",
              boxShadow:        `0 0 20px 4px ${accentColor}44`,
            }}
          >
            Retry
          </button>
        )}

        {/* Tips */}
        {!isError && (
          <p
            className="font-space mt-10 max-w-xs text-center text-[11px] leading-relaxed tracking-wide sm:text-xs"
            style={{ color: "#ffffff30" }}
          >
            {TIPS[tipIndex]}
          </p>
        )}
      </div>

      {/* ── Bottom corner decorations ── */}
      <div
        className="pointer-events-none absolute bottom-4 left-4 font-orbitron text-[8px] tracking-widest opacity-20 uppercase"
        style={{ color: accentColor }}
      >
        SYS V2.0 ◈ ONLINE
      </div>
      <div
        className="pointer-events-none absolute bottom-4 right-4 font-orbitron text-[8px] tracking-widest opacity-20 uppercase"
        style={{ color: accentColor }}
      >
        ◈ {new Date().getFullYear()}
      </div>
    </div>
  );
}
