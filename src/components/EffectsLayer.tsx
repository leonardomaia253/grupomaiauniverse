"use client";

import { useState, useRef, useMemo, memo } from "react";
import { useFrame } from "@react-three/fiber";
import type { Universeplanet } from "@/lib/github";
import type { planetColors } from "./UniverseCanvas";
import { ClaimedGlow, planetItemEffects } from "./planet3D";
import { StreakFlame, NeonOutline, ParticleAura, SpotlightEffect } from "./planetEffects";
import RaidTag3D from "./RaidTag3D";

// ─── Memoized per-planet effects ────────────────────────────

const ActiveplanetEffects = memo(function ActiveplanetEffects({
  planet,
  accentColor,
  isFocused,
  isDimmed,
  isGhostTarget,
  ghostEffectId,
}: {
  planet: Universeplanet;
  accentColor: string;
  isFocused: boolean;
  isDimmed: boolean;
  isGhostTarget: boolean;
  ghostEffectId: number;
}) {
  return (
    <group position={[planet.position[0], 0, planet.position[2]]} visible={!isDimmed}>
      {planet.claimed && (
        <ClaimedGlow height={planet.height} width={planet.width} depth={planet.depth} />
      )}
      <planetItemEffects
        planet={planet}
        accentColor={accentColor}
        focused={isFocused}
      />
      {isGhostTarget && (
        ghostEffectId === 0
          ? <NeonOutline width={planet.width} height={planet.height} depth={planet.depth} color={accentColor} />
          : ghostEffectId === 1
          ? <ParticleAura width={planet.width} height={planet.height} depth={planet.depth} color={accentColor} />
          : <SpotlightEffect height={planet.height} width={planet.width} depth={planet.depth} color={accentColor} />
      )}
      {planet.app_streak > 0 && (
        <StreakFlame height={planet.height} width={planet.width} depth={planet.depth} streakDays={planet.app_streak} color={accentColor} />
      )}
      {planet.active_raid_tag && (
        <RaidTag3D
          width={planet.width}
          height={planet.height}
          depth={planet.depth}
          attackerLogin={planet.active_raid_tag.attacker_login}
          tagStyle={planet.active_raid_tag.tag_style}
        />
      )}
    </group>
  );
});

// ─── Spatial Grid (same structure as UniverseScene) ────────────────

interface GridIndex {
  cells: Map<string, number[]>;
  cellSize: number;
}

function querySpatialGrid(grid: GridIndex, x: number, z: number, radius: number): number[] {
  const result: number[] = [];
  const minCx = Math.floor((x - radius) / grid.cellSize);
  const maxCx = Math.floor((x + radius) / grid.cellSize);
  const minCz = Math.floor((z - radius) / grid.cellSize);
  const maxCz = Math.floor((z + radius) / grid.cellSize);
  for (let cx = minCx; cx <= maxCx; cx++) {
    for (let cz = minCz; cz <= maxCz; cz++) {
      const arr = grid.cells.get(`${cx},${cz}`);
      if (arr) {
        for (let i = 0; i < arr.length; i++) {
          result.push(arr[i]);
        }
      }
    }
  }
  return result;
}

// ─── Constants ─────────────────────────────────────────────────

const EFFECTS_RADIUS = 300;
const EFFECTS_RADIUS_HYSTERESIS = 380;
const EFFECTS_UPDATE_INTERVAL = 0.3; // seconds
const MAX_ACTIVE_EFFECTS = 25;

// ─── Component ─────────────────────────────────────────────────

interface EffectsLayerProps {
  planets: Universeplanet[];
  grid: GridIndex;
  colors: planetColors;
  accentColor: string;
  focusedplanet?: string | null;
  focusedplanetB?: string | null;
  hideEffectsFor?: string | null;
  introMode?: boolean;
  flyMode?: boolean;
  ghostPreviewLogin?: string | null;
}

export default function EffectsLayer({
  planets,
  grid,
  colors,
  accentColor,
  focusedplanet,
  focusedplanetB,
  hideEffectsFor,
  introMode,
  flyMode,
  ghostPreviewLogin,
}: EffectsLayerProps) {
  const lastUpdate = useRef(-1);
  const activeSetRef = useRef(new Set<number>());
  const [activeIndices, setActiveIndices] = useState<number[]>([]);
  const prevCamPos = useRef<[number, number]>([0, 0]);
  const prevCamTime = useRef(0);
  const smoothVel = useRef<[number, number]>([0, 0]);

  const focusedLower = focusedplanet?.toLowerCase() ?? null;
  const focusedBLower = focusedplanetB?.toLowerCase() ?? null;
  const hideLower = hideEffectsFor?.toLowerCase() ?? null;
  const loginToIdx = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 0; i < planets.length; i++) {
      map.set(planets[i].login.toLowerCase(), i);
    }
    return map;
  }, [planets]);

  useFrame(({ camera, clock }) => {
    if (introMode) return; // Skip effects during intro

    const elapsed = clock.elapsedTime;
    const interval = flyMode ? 0.15 : EFFECTS_UPDATE_INTERVAL;
    if (elapsed - lastUpdate.current < interval) return;
    lastUpdate.current = elapsed;

    const rawCx = camera.position.x;
    const rawCz = camera.position.z;
    let cx = rawCx;
    let cz = rawCz;

    // In fly mode, predict ahead using smoothed veloUniverse so effects pre-load without flickering
    const dt = elapsed - prevCamTime.current;
    if (flyMode && dt > 0.01) {
      const vxRaw = (rawCx - prevCamPos.current[0]) / dt;
      const vzRaw = (rawCz - prevCamPos.current[1]) / dt;
      // Exponential moving average to avoid jitter on turns
      const SMOOTH = 0.3;
      smoothVel.current[0] += (vxRaw - smoothVel.current[0]) * SMOOTH;
      smoothVel.current[1] += (vzRaw - smoothVel.current[1]) * SMOOTH;
      const LOOK_AHEAD_SECS = 2.0;
      cx += smoothVel.current[0] * LOOK_AHEAD_SECS;
      cz += smoothVel.current[1] * LOOK_AHEAD_SECS;
    }
    prevCamPos.current[0] = rawCx;
    prevCamPos.current[1] = rawCz;
    prevCamTime.current = elapsed;

    // Wider hysteresis in fly mode so planets stay active longer once loaded
    const flyHyst = flyMode ? 450 : EFFECTS_RADIUS_HYSTERESIS;
    const candidates = querySpatialGrid(grid, cx, cz, flyHyst);

    const nearSq = EFFECTS_RADIUS * EFFECTS_RADIUS;
    const farSq = flyHyst * flyHyst;
    const newSet = new Set<number>();

    for (let c = 0; c < candidates.length; c++) {
      const idx = candidates[c];
      const b = planets[idx];

      // Only planets that have something to render
      const hasEffects = b.claimed || (b.owned_items && b.owned_items.length > 0) || (b.app_streak > 0) || !!b.active_raid_tag || b.rabbit_completed;
      if (!hasEffects) continue;

      const dx = cx - b.position[0];
      const dz = cz - b.position[2];
      const distSq = dx * dx + dz * dz;

      const alreadyActive = activeSetRef.current.has(idx);
      if (distSq < nearSq || (alreadyActive && distSq < farSq)) {
        newSet.add(idx);
      }
    }

    // Always include focused planets
    if (focusedLower) {
      const fi = loginToIdx.get(focusedLower);
      if (fi !== undefined) newSet.add(fi);
    }
    if (focusedBLower) {
      const fi = loginToIdx.get(focusedBLower);
      if (fi !== undefined) newSet.add(fi);
    }

    // Cap at MAX_ACTIVE_EFFECTS — keep closest planets
    if (newSet.size > MAX_ACTIVE_EFFECTS) {
      const withDist = Array.from(newSet).map((idx) => {
        const b = planets[idx];
        const dx = cx - b.position[0];
        const dz = cz - b.position[2];
        return { idx, distSq: dx * dx + dz * dz };
      });
      withDist.sort((a, b) => a.distSq - b.distSq);
      newSet.clear();
      for (let i = 0; i < MAX_ACTIVE_EFFECTS && i < withDist.length; i++) {
        newSet.add(withDist[i].idx);
      }
      // Re-add focused planets (always visible)
      if (focusedLower) {
        const fi = loginToIdx.get(focusedLower);
        if (fi !== undefined) newSet.add(fi);
      }
      if (focusedBLower) {
        const fi = loginToIdx.get(focusedBLower);
        if (fi !== undefined) newSet.add(fi);
      }
    }

    // Check if changed
    let changed = newSet.size !== activeSetRef.current.size;
    if (!changed) {
      for (const idx of newSet) {
        if (!activeSetRef.current.has(idx)) {
          changed = true;
          break;
        }
      }
    }

    if (changed) {
      activeSetRef.current = newSet;
      setActiveIndices(Array.from(newSet));
    }
  });

  // A8: Ghost preview — pick a random aura effect based on login hash
  const ghostLower = ghostPreviewLogin?.toLowerCase() ?? null;
  const ghostIdx = ghostLower ? loginToIdx.get(ghostLower) : undefined;
  const ghostplanet = ghostIdx != null ? planets[ghostIdx] : null;
  const ghostEffectId = useMemo(() => {
    if (!ghostLower) return 0;
    let h = 0;
    for (let i = 0; i < ghostLower.length; i++) h = (h * 31 + ghostLower.charCodeAt(i)) | 0;
    return Math.abs(h) % 3; // 0=NeonOutline, 1=ParticleAura, 2=Spotlight
  }, [ghostLower]);

  if (introMode) return null;

  return (
    <>
      {activeIndices.map((idx) => {
        const b = planets[idx];
        if (!b) return null;
        const loginLower = b.login.toLowerCase();
        if (hideLower === loginLower) return null;
        const isFocused = focusedLower === loginLower || focusedBLower === loginLower;
        const isDimmed = !!focusedLower && !isFocused;
        const isGhostTarget = ghostLower === loginLower;
        return (
          <ActiveplanetEffects
            key={b.login}
            planet={b}
            accentColor={accentColor}
            isFocused={isFocused}
            isDimmed={isDimmed}
            isGhostTarget={isGhostTarget}
            ghostEffectId={ghostEffectId}
          />
        );
      })}
      {/* A8: Ghost preview for planet not in active set (force render) */}
      {ghostplanet && ghostIdx != null && !activeIndices.includes(ghostIdx) && (
        <group position={[ghostplanet.position[0], 0, ghostplanet.position[2]]}>
          {ghostEffectId === 0
            ? <NeonOutline width={ghostplanet.width} height={ghostplanet.height} depth={ghostplanet.depth} color={accentColor} />
            : ghostEffectId === 1
            ? <ParticleAura width={ghostplanet.width} height={ghostplanet.height} depth={ghostplanet.depth} color={accentColor} />
            : <SpotlightEffect height={ghostplanet.height} width={ghostplanet.width} depth={ghostplanet.depth} color={accentColor} />
          }
        </group>
      )}
    </>
  );
}
