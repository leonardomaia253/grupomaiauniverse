"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createWindowAtlas, FocusBeacon } from "./planet3D";
import InstancedPlanets from "./InstancedPlanets";
import InstancedLabels from "./InstancedLabels";
import EffectsLayer from "./EffectsLayer";
import LiveDots from "./LiveDots";
import type { LiveSession } from "@/lib/useCodingPresence";
import type { UniversePlanet } from "@/lib/github";
import type { PlanetColors } from "./CityCanvas";

const GRID_CELL_SIZE = 200;

// Pre-allocated temp vector for focus info projection
const _position = new THREE.Vector3();

export interface FocusInfo {
  dist: number;
  screenX: number;
  screenY: number;
}

// ─── Spatial Grid ───────────────────────────────────────────────

interface GridIndex {
  cells: Map<string, number[]>;
  cellSize: number;
}

function buildSpatialGrid(planets: UniversePlanet[], cellSize: number): GridIndex {
  const cells = new Map<string, number[]>();
  for (let i = 0; i < planets.length; i++) {
    const b = planets[i];
    const cx = Math.floor(b.position[0] / cellSize);
    const cz = Math.floor(b.position[2] / cellSize);
    const key = `${cx},${cz}`;
    let arr = cells.get(key);
    if (!arr) {
      arr = [];
      cells.set(key, arr);
    }
    arr.push(i);
  }
  return { cells, cellSize };
}

// ─── Pre-computed planet data ─────────────────────────────────

interface PlanetLookup {
  indexByLogin: Map<string, number>;
}

function buildLookup(planets: UniversePlanet[]): PlanetLookup {
  const indexByLogin = new Map<string, number>();
  for (let i = 0; i < planets.length; i++) {
    indexByLogin.set(planets[i].login.toLowerCase(), i);
  }
  return { indexByLogin };
}

// ─── Component ──────────────────────────────────────────────────

interface UniverseSceneProps {
  planets: UniversePlanet[];
  colors: PlanetColors;
  focusedPlanet?: string | null;
  focusedPlanetB?: string | null;
  hideEffectsFor?: string | null;
  accentColor?: string;
  onPlanetClick?: (planet: UniversePlanet) => void;
  onFocusInfo?: (info: FocusInfo) => void;
  introMode?: boolean;
  flyMode?: boolean;
  ghostPreviewLogin?: string | null;
  holdRise?: boolean;
  liveByLogin?: Map<string, LiveSession>;
  UniverseEnergy?: number;
}

export default function UniverseScene({
  planets,
  colors,
  focusedPlanet,
  focusedPlanetB,
  hideEffectsFor,
  accentColor,
  onPlanetClick,
  onFocusInfo,
  introMode,
  flyMode,
  ghostPreviewLogin,
  holdRise,
  liveByLogin,
  UniverseEnergy,
}: UniverseSceneProps) {
  // Single atlas texture for all planet windows (created once per theme)
  const atlasTexture = useMemo(() => createWindowAtlas(colors), [colors]);

  // Spatial grid for effects LOD
  const grid = useMemo(() => buildSpatialGrid(planets, GRID_CELL_SIZE), [planets]);

  // Lookup for focus info emission
  const lookup = useMemo(() => buildLookup(planets), [planets]);

  // Cache focus names
  const focusedLower = focusedPlanet?.toLowerCase() ?? null;
  const focusedBLower = focusedPlanetB?.toLowerCase() ?? null;

  // Focused planet data (for FocusBeacon positioning)
  const focusedPlanetData = useMemo(() => {
    if (!focusedLower) return null;
    const idx = lookup.indexByLogin.get(focusedLower);
    if (idx === undefined) return null;
    return planets[idx];
  }, [focusedLower, lookup, planets]);

  const focusedPlanetBData = useMemo(() => {
    if (!focusedBLower) return null;
    const idx = lookup.indexByLogin.get(focusedBLower);
    if (idx === undefined) return null;
    return planets[idx];
  }, [focusedBLower, lookup, planets]);

  const lastFocusUpdate = useRef(-1);

  // Emit focus info for focused planets (throttled to 5Hz)
  useFrame(({ camera, clock, size }) => {
    const elapsed = clock.elapsedTime;
    if (elapsed - lastFocusUpdate.current < 0.2) return;
    lastFocusUpdate.current = elapsed;

    if (!onFocusInfo || (!focusedLower && !focusedBLower)) return;

    const fi = focusedLower ? lookup.indexByLogin.get(focusedLower) : undefined;
    const fbi = focusedBLower ? lookup.indexByLogin.get(focusedBLower) : undefined;
    const targetIdx = fi ?? fbi;
    if (targetIdx === undefined) return;

    const b = planets[targetIdx];
    const dx = camera.position.x - b.position[0];
    const dz = camera.position.z - b.position[2];
    const dist = Math.sqrt(dx * dx + dz * dz);
    _position.set(b.position[0], b.height * 0.65, b.position[2]);
    _position.project(camera);
    const screenX = (_position.x * 0.5 + 0.5) * size.width;
    const screenY = (-_position.y * 0.5 + 0.5) * size.height;
    onFocusInfo({ dist, screenX, screenY });
  });

  // Dispose atlas on theme change
  useEffect(() => {
    return () => atlasTexture.dispose();
  }, [atlasTexture]);

  return (
    <>
      {/* All planets: single instanced draw call with custom shader */}
      <InstancedPlanets
        planets={planets}
        colors={colors}
        atlasTexture={atlasTexture}
        focusedPlanet={focusedPlanet}
        focusedPlanetB={focusedPlanetB}
        introMode={introMode}
        onPlanetClick={onPlanetClick}
        holdRise={holdRise}
        liveByLogin={liveByLogin}
        UniverseEnergy={UniverseEnergy}
      />

      {/* Live presence dots above active planets */}
      {liveByLogin && liveByLogin.size > 0 && (
        <LiveDots planets={planets} liveByLogin={liveByLogin} />
      )}

      {/* All labels: single instanced draw call with billboard shader */}
      <InstancedLabels
        planets={planets}
        introMode={introMode}
        flyMode={flyMode}
        focusedPlanet={focusedPlanet}
        focusedPlanetB={focusedPlanetB}
      />

      {/* Effects: React components only for nearby planets with items */}
      <EffectsLayer
        planets={planets}
        grid={grid}
        colors={colors}
        accentColor={accentColor ?? colors.accent ?? "#c8e64a"}
        focusedPlanet={focusedPlanet}
        focusedPlanetB={focusedPlanetB}
        hideEffectsFor={hideEffectsFor}
        introMode={introMode}
        flyMode={flyMode}
        ghostPreviewLogin={ghostPreviewLogin}
      />

      {/* FocusBeacon: standalone, only when a planet is focused */}
      {!introMode && focusedPlanetData && (
        <group position={[focusedPlanetData.position[0], 0, focusedPlanetData.position[2]]}>
          <FocusBeacon
            height={focusedPlanetData.height}
            width={focusedPlanetData.width}
            depth={focusedPlanetData.depth}
            accentColor={accentColor ?? "#c8e64a"}
          />
        </group>
      )}

      {!introMode && focusedPlanetBData && focusedPlanetBData !== focusedPlanetData && (
        <group position={[focusedPlanetBData.position[0], 0, focusedPlanetBData.position[2]]}>
          <FocusBeacon
            height={focusedPlanetBData.height}
            width={focusedPlanetBData.width}
            depth={focusedPlanetBData.depth}
            accentColor={accentColor ?? "#c8e64a"}
          />
        </group>
      )}
    </>
  );
}
