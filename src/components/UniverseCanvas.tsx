"use client";

import { useRef, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import Sun from "./Sun";
import Starfield from "./Starfield";
import InstancedPlanets from "./InstancedPlanets";
import { generateSolarSystem } from "@/lib/solarSystem";
import type { CompanyRecord, GalaxyZone } from "@/lib/github";

export interface PlanetColors {
  face: string;
  roof: string;
  windowLit: string[];
  windowOff: string;
  accent?: string;
}

// Placeholder atlas so InstancedPlanets doesn't crash without a real atlas
function makeFallbackAtlas(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 8; c.height = 8;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#162040";
  ctx.fillRect(0, 0, 8, 8);
  ctx.fillStyle = "#e0d0b0";
  ctx.fillRect(2, 2, 2, 2);
  ctx.fillRect(5, 2, 2, 2);
  ctx.fillRect(2, 5, 2, 2);
  ctx.fillRect(5, 5, 2, 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export default function UniverseCanvas({ companies }: { companies: CompanyRecord[] }) {
  const solarSystem = useMemo(() => generateSolarSystem(companies), [companies]);

  const defaultColors: import("./CityCanvas").PlanetColors = {
    windowLit: ["#f8d880"],
    windowOff:  "#1a1018",
    face:       "#281828",
    roof:       "#604050",
    accent:     "#c8e64a",
  };

  const atlasTexture = useMemo(() => {
    if (typeof window === "undefined") return null;
    return makeFallbackAtlas();
  }, []);

  return (
    <div style={{ width: "100%", height: "100vh", background: "#000" }}>
      <Canvas
        shadows
        gl={{
          antialias:    true,
          toneMapping:  THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
        dpr={[1, 1.5]}  // cap at 1.5x for performance
      >
        <PerspectiveCamera makeDefault position={[0, 1000, 2000]} far={20000} />

        {/* Environment */}
        <Starfield count={6000} />
        <Sun radius={solarSystem.sunRadius} />

        {/* Planets */}
        {atlasTexture && (
          // @ts-ignore — solar system planets have different props but same base visual needs
          <InstancedPlanets
            planets={solarSystem.planets as any}
            colors={defaultColors}
            atlasTexture={atlasTexture}
          />
        )}

        {/* Lighting */}
        <ambientLight intensity={0.15} />

        {/* Camera controls */}
        <OrbitControls
          enablePan
          enableZoom
          maxDistance={8000}
          minDistance={100}
          makeDefault
        />

        {/* Post-processing stack */}
        <EffectComposer enableNormalPass={false}>
          {/* Bloom — lower threshold so planets glow through */}
          <Bloom
            luminanceThreshold={0.85}
            mipmapBlur
            intensity={2.2}
            radius={0.5}
          />
          {/* Subtle chromatic aberration for sci-fi look */}
          <ChromaticAberration
            blendFunction={BlendFunction.NORMAL}
            offset={new THREE.Vector2(0.0003, 0.0003) as any}
            radialModulation={false}
            modulationOffset={0}
          />
          {/* Vignette to frame the scene */}
          <Vignette
            offset={0.45}
            darkness={0.5}
            blendFunction={BlendFunction.NORMAL}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
