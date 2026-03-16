"use client";

import { useRef, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
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

export default function UniverseCanvas({ companies }: { companies: CompanyRecord[] }) {
  const solarSystem = useMemo(() => generateSolarSystem(companies), [companies]);

  return (
    <div style={{ width: "100%", height: "100vh", background: "#000" }}>
      <Canvas shadows gl={{ antialias: true, toneMapping: THREE.ReinhardToneMapping }}>
        <PerspectiveCamera makeDefault position={[0, 1000, 2000]} far={20000} />
        
        <Starfield count={8000} />
        <Sun radius={solarSystem.sunRadius} />
        
        {/* @ts-ignore - solar system planets have different props but same base visual needs */}
        <InstancedPlanets planets={solarSystem.planets as any} />

        <ambientLight intensity={0.2} />
        
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          maxDistance={8000}
          minDistance={100}
          makeDefault
        />

        <EffectComposer enableNormalPass={false}>
          <Bloom 
            luminanceThreshold={1.0} 
            mipmapBlur 
            intensity={1.5} 
            radius={0.4} 
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
