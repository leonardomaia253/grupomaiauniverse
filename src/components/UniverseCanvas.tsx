"use client";

import { useRef, useMemo, useState, useEffect, useCallback, useEffectEvent } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import Sun from "./Sun";
import Starfield from "./Starfield";
import InstancedPlanets from "./InstancedPlanets";
import { generateSolarSystem } from "@/lib/solarSystem";
import type { CompanyRecord } from "@/lib/github";
import { VehicleMesh } from "./RaidSequence3D";

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

// ─── Mouse-Driven Flight (Adapted for Universe) ────────────────

const DEFAULT_FLY_SPEED = 250;
const MIN_FLY_SPEED = 80;
const MAX_FLY_SPEED = 1200;
const MIN_ALT = -2500;
const MAX_ALT = 3000;
const TURN_RATE = 2.5;
const CLIMB_RATE = 150;
const MAX_BANK = 0.65;
const MAX_PITCH = 0.8;
const DEADZONE = 0.08;

function deadzoneCurve(v: number): number {
  const abs = Math.abs(v);
  if (abs < DEADZONE) return 0;
  const adjusted = (abs - DEADZONE) / (1 - DEADZONE);
  return Math.sign(v) * adjusted * adjusted;
}

const _fwd = new THREE.Vector3();
const _camOffset = new THREE.Vector3();
const _idealCamPos = new THREE.Vector3();
const _idealLook = new THREE.Vector3();
const _blendedPos = new THREE.Vector3();
const _yAxis = new THREE.Vector3(0, 1, 0);

function SpaceshipFlight({
  onExit, onHud, onPause, pauseSignal = 0, hasOverlay = false, startPaused = false,
  vehicleType = "spaceship", UniverseRadius = 15000
}: {
  onExit: () => void;
  onHud: (s: number, a: number, x: number, z: number, yaw: number) => void;
  onPause: (paused: boolean) => void;
  pauseSignal?: number;
  hasOverlay?: boolean;
  startPaused?: boolean;
  vehicleType?: string;
  UniverseRadius?: number;
}) {
  const { camera } = useThree();
  const ref = useRef<THREE.Group>(null);
  const orbitRef = useRef<any>(null);

  const mouse = useRef({ x: 0, y: 0 });
  const keys = useRef<Record<string, boolean>>({});
  const [isPaused, setIsPaused] = useState(startPaused);
  const paused = useRef(startPaused);
  const isFirstResume = useRef(startPaused);

  const yaw = useRef(0);
  const pos = useRef(new THREE.Vector3(0, 120, 400));
  const flySpeed = useRef(DEFAULT_FLY_SPEED);
  const bank = useRef(0);
  const pitch = useRef(0);

  const camPos = useRef(new THREE.Vector3(0, 140, 450));
  const camLook = useRef(new THREE.Vector3(0, 120, 400));

  const transitionProgress = useRef(1);
  const transitionFrom = useRef(new THREE.Vector3());
  const transitionLookFrom = useRef(new THREE.Vector3());
  const wasJustUnpaused = useRef(false);

  const TRAIL_POINTS = 48;
  const trailPositions = useRef(new Float32Array(TRAIL_POINTS * 3));
  const trailColors = useRef(new Float32Array(TRAIL_POINTS * 4));
  const trailGeomRef = useRef<THREE.BufferGeometry>(null);
  const trailInit = useRef(false);

  const hudTimer = useRef(0);

  useEffect(() => {
    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);
    const initialYaw = Math.atan2(-camDir.x, -camDir.z);
    yaw.current = initialYaw;

    const startPos = camera.position.clone();
    startPos.y = Math.max(MIN_ALT, Math.min(MAX_ALT, startPos.y));
    pos.current.copy(startPos);

    const behindOffset = new THREE.Vector3(
      Math.sin(initialYaw) * 50,
      20,
      Math.cos(initialYaw) * 50
    );
    camPos.current.copy(startPos).add(behindOffset);
    camLook.current.copy(startPos);

    camera.position.copy(camPos.current);
    camera.lookAt(camLook.current);
    if (startPaused) onPause(true);
  }, [camera]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!paused.current) {
        mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
      }
    };
    const onWheel = (e: WheelEvent) => {
      if (!paused.current) {
        // scale sensitivity with current speed
        const accel = flySpeed.current > 600 ? 0.2 : 0.08;
        flySpeed.current = Math.max(MIN_FLY_SPEED, Math.min(MAX_FLY_SPEED, flySpeed.current - e.deltaY * accel));
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("wheel", onWheel);
    };
  }, []);

  const prevSignal = useRef(pauseSignal);
  useEffect(() => {
    if (pauseSignal !== prevSignal.current) {
      prevSignal.current = pauseSignal;
      if (!paused.current) {
        paused.current = true;
        setIsPaused(true);
        onPause(true);
      }
    }
  }, [pauseSignal, onPause]);

  const notifyPause = useEffectEvent((p: boolean) => onPause(p));
  useEffect(() => {
    if (hasOverlay) {
      if (!paused.current) {
        paused.current = true;
        setIsPaused(true);
        notifyPause(true);
      }
    } else {
      if (paused.current) {
        paused.current = false;
        setIsPaused(false);
        wasJustUnpaused.current = true;
        transitionProgress.current = 0;
        transitionFrom.current.copy(camera.position);
        transitionLookFrom.current.copy(camLook.current);
        notifyPause(false);
      }
    }
  }, [hasOverlay]);

  const hasOverlayRef = useRef(hasOverlay);
  hasOverlayRef.current = hasOverlay;

  useEffect(() => {
    const doPause = () => {
      if (paused.current) return;
      paused.current = true;
      setIsPaused(true);
      onPause(true);
    };

    const doResume = () => {
      if (!paused.current) return;
      paused.current = false;
      setIsPaused(false);
      if (isFirstResume.current) {
        isFirstResume.current = false;
        transitionProgress.current = 1;
        wasJustUnpaused.current = false;
      } else {
        wasJustUnpaused.current = true;
        transitionProgress.current = 0;
        transitionFrom.current.copy(camera.position);
        transitionLookFrom.current.copy(camLook.current);
      }
      onPause(false);
    };

    const FLIGHT_KEYS = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "ShiftLeft", "ShiftRight"]);

    const down = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
      if (e.code === "Escape") {
        if (!paused.current) doPause();
        else if (hasOverlayRef.current) return;
        else onExit();
      } else if (e.code === "KeyP" || e.code === "Space") {
        e.preventDefault();
        if (paused.current) doResume();
        else doPause();
      } else if (e.code === "KeyF") {
        e.preventDefault();
        if (!paused.current || !hasOverlayRef.current) onExit();
      } else if (e.code === "KeyR") {
        if (!paused.current) yaw.current = Math.atan2(pos.current.x, pos.current.z);
      } else if (paused.current && FLIGHT_KEYS.has(e.code)) {
        doResume();
      }
    };
    const up = (e: KeyboardEvent) => { keys.current[e.code] = false; };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [camera, onExit, onPause]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const k = keys.current;

    if (paused.current) {
      if (ref.current) ref.current.visible = true;
      if (orbitRef.current) {
        orbitRef.current.target.copy(pos.current);
        orbitRef.current.update();
      }
      hudTimer.current += dt;
      if (hudTimer.current > 0.25) {
        hudTimer.current = 0;
        onHud(0, pos.current.y, pos.current.x, pos.current.z, yaw.current);
      }
      return;
    }

    if (wasJustUnpaused.current) {
      if (ref.current) ref.current.visible = true;
      transitionProgress.current += dt * 2;
      if (transitionProgress.current >= 1) {
        transitionProgress.current = 1;
        wasJustUnpaused.current = false;
      }
    }

    const mx = mouse.current.x;
    const my = mouse.current.y;

    let turnInput = deadzoneCurve(mx);
    if (k["KeyA"] || k["ArrowLeft"]) turnInput = -1;
    if (k["KeyD"] || k["ArrowRight"]) turnInput = 1;

    yaw.current -= turnInput * TURN_RATE * dt;

    let altInput = deadzoneCurve(my);
    if (k["KeyW"] || k["ArrowUp"]) altInput = 1;
    if (k["KeyS"] || k["ArrowDown"]) altInput = -1;

    let speedMult = 1;
    if (k["ShiftLeft"] || k["ShiftRight"]) speedMult = 2;
    if (k["AltLeft"] || k["AltRight"]) speedMult = 0.3;

    const actualSpeed = flySpeed.current * speedMult;
    const climbScale = Math.sqrt(actualSpeed / DEFAULT_FLY_SPEED);
    
    pos.current.y += altInput * CLIMB_RATE * climbScale * dt;
    pos.current.y = Math.max(MIN_ALT, Math.min(MAX_ALT, pos.current.y));

    _fwd.set(-Math.sin(yaw.current), 0, -Math.cos(yaw.current));
    pos.current.addScaledVector(_fwd, actualSpeed * dt);

    const SOFT_RADIUS = UniverseRadius * 0.85;
    const distSq = pos.current.x * pos.current.x + pos.current.z * pos.current.z;
    if (distSq > SOFT_RADIUS * SOFT_RADIUS) {
      const dist = Math.sqrt(distSq);
      if (dist > SOFT_RADIUS) {
        const excess = dist - SOFT_RADIUS;
        const pullFactor = Math.min(excess / (UniverseRadius - SOFT_RADIUS), 1.0);
        const pullMag = actualSpeed * dt * pullFactor * 1.5;
        pos.current.x -= (pos.current.x / dist) * pullMag;
        pos.current.z -= (pos.current.z / dist) * pullMag;

        const newDistSq = pos.current.x * pos.current.x + pos.current.z * pos.current.z;
        if (newDistSq > UniverseRadius * UniverseRadius) {
          const newDist = Math.sqrt(newDistSq);
          pos.current.x = (pos.current.x / newDist) * UniverseRadius;
          pos.current.z = (pos.current.z / newDist) * UniverseRadius;
        }
      }
    }

    const targetBank = -turnInput * MAX_BANK;
    bank.current += (targetBank - bank.current) * 5 * dt;
    const targetPitch = altInput * MAX_PITCH;
    pitch.current += (targetPitch - pitch.current) * 6 * dt;

    if (ref.current) {
      ref.current.visible = true;
      ref.current.position.copy(pos.current);
      ref.current.rotation.set(pitch.current, yaw.current, bank.current, "YXZ");
    }

    const camDist = 35 + flySpeed.current * 0.05;
    _camOffset.set(0, 15, camDist).applyAxisAngle(_yAxis, yaw.current);
    _idealCamPos.copy(pos.current).add(_camOffset);
    _idealLook.copy(pos.current).addScaledVector(_fwd, 5).y += 2;

    const lerpXZ = 2.0 * dt;
    const lerpY = 1.8 * dt;
    camPos.current.x += (_idealCamPos.x - camPos.current.x) * lerpXZ;
    camPos.current.z += (_idealCamPos.z - camPos.current.z) * lerpXZ;
    camPos.current.y += (_idealCamPos.y - camPos.current.y) * lerpY;
    camLook.current.lerp(_idealLook, 4.0 * dt);

    if (wasJustUnpaused.current && transitionProgress.current < 1) {
      const tEase = 1 - Math.pow(1 - transitionProgress.current, 3);
      _blendedPos.copy(transitionFrom.current).lerp(camPos.current, tEase);
      camera.position.copy(_blendedPos);
    } else {
      camera.position.copy(camPos.current);
    }
    camera.lookAt(camLook.current);

    if (!trailInit.current) {
      for (let i = 0; i < TRAIL_POINTS; i++) {
        trailPositions.current[i * 3] = pos.current.x;
        trailPositions.current[i * 3 + 1] = pos.current.y;
        trailPositions.current[i * 3 + 2] = pos.current.z;
        trailColors.current[i * 4] = 1;
        trailColors.current[i * 4 + 1] = 1;
        trailColors.current[i * 4 + 2] = 1;
        trailColors.current[i * 4 + 3] = 0;
      }
      trailInit.current = true;
    } else {
      trailPositions.current.copyWithin(3, 0, (TRAIL_POINTS - 1) * 3);
      trailPositions.current[0] = pos.current.x - _fwd.x * 5;
      trailPositions.current[1] = pos.current.y;
      trailPositions.current[2] = pos.current.z - _fwd.z * 5;
    }

    const speedRatio = actualSpeed / DEFAULT_FLY_SPEED;
    for (let i = 0; i < TRAIL_POINTS; i++) {
      const fade = 1 - (i / TRAIL_POINTS);
      const intensity = Math.max(0, Math.min(1.0, (speedRatio - 0.7) * 1.5));
      trailColors.current[i * 4 + 3] = fade * intensity * 0.5;
    }

    if (trailGeomRef.current) {
      trailGeomRef.current.attributes.position.needsUpdate = true;
      trailGeomRef.current.attributes.color.needsUpdate = true;
    }

    hudTimer.current += dt;
    if (hudTimer.current > 0.25) {
      hudTimer.current = 0;
      onHud(flySpeed.current, pos.current.y, pos.current.x, pos.current.z, yaw.current);
    }
  });

  return (
    <>
      <line>
        <bufferGeometry ref={trailGeomRef}>
          <bufferAttribute attach="attributes-position" args={[trailPositions.current, 3]} count={TRAIL_POINTS} />
          <bufferAttribute attach="attributes-color" args={[trailColors.current, 4]} count={TRAIL_POINTS} />
        </bufferGeometry>
        <lineBasicMaterial transparent vertexColors depthWrite={false} blending={THREE.AdditiveBlending} linewidth={2} />
      </line>
      <group ref={ref}>
        <group scale={[4, 4, 4]}>
          <VehicleMesh type={vehicleType} />
        </group>
        <pointLight position={[0, -2, 0]} color="#f0c870" intensity={15} distance={60} />
        <pointLight position={[0, 3, -4]} color="#ffffff" intensity={5} distance={30} />
      </group>
      {isPaused && (
        <OrbitControls
          ref={orbitRef}
          enableDamping
          dampingFactor={0.06}
          minDistance={20}
          maxDistance={300}
          maxPolarAngle={Math.PI / 2.1}
          target={pos.current.toArray() as [number, number, number]}
        />
      )}
    </>
  );
}

// ─── Universe Map Canvas ──────────────────────────────────────────

export default function UniverseCanvas({
  companies,
  flyMode = false,
  flyVehicle = "spaceship",
  onExitFly,
  onHud,
  onPause,
  flyPauseSignal = 0,
  flyHasOverlay = false,
  flyStartPaused = false
}: {
  companies: CompanyRecord[];
  flyMode?: boolean;
  flyVehicle?: string;
  onExitFly?: () => void;
  onHud?: (speed: number, alt: number, x: number, z: number, yaw: number) => void;
  onPause?: (paused: boolean) => void;
  flyPauseSignal?: number;
  flyHasOverlay?: boolean;
  flyStartPaused?: boolean;
}) {
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

  const [contextLost, setContextLost] = useState(false);
  const [canvasKey, setCanvasKey] = useState(0);

  const handleCreated = useCallback(({ gl }: { gl: THREE.WebGLRenderer }) => {
    const canvas = gl.domElement;
    canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      setContextLost(true);
    });
    canvas.addEventListener("webglcontextrestored", () => {
      setContextLost(false);
    });
  }, []);

  useEffect(() => {
    if (!contextLost) return;
    const timer = setTimeout(() => {
      setCanvasKey((k) => k + 1);
      setContextLost(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [contextLost]);

  if (contextLost) {
    return (
      <div style={{ width: "100%", height: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "rgba(255,255,255,0.7)", fontFamily: "monospace", fontSize: "12px", textAlign: "center" }}>
          RESTAURANDO CONEXÃO VISUAL...
        </div>
      </div>
    );
  }

  // Calculate Universe max extent
  const universeRadius = useMemo(() => {
    if (solarSystem.planets.length === 0) return 5000;
    const maxDist = Math.max(...solarSystem.planets.map(p => p.distance));
    return maxDist + 2000; // soft boundary
  }, [solarSystem]);

  return (
    <div style={{ width: "100%", height: "100vh", background: "#000" }}>
      <Canvas
        key={canvasKey}
        onCreated={handleCreated}
        shadows
        gl={{
          antialias:    true,
          toneMapping:  THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
        dpr={[1, 1.5]}
      >
        <PerspectiveCamera makeDefault position={[0, 1000, 2000]} far={40000} />

        <Starfield count={6000} />
        <Sun radius={solarSystem.sunRadius} />

        {atlasTexture && (
          <InstancedPlanets
            planets={solarSystem.planets as any}
            colors={defaultColors}
            atlasTexture={atlasTexture}
          />
        )}

        <ambientLight intensity={0.15} />

        {flyMode && onExitFly && onHud && onPause && (
          <SpaceshipFlight
            onExit={onExitFly}
            onHud={onHud}
            onPause={onPause}
            pauseSignal={flyPauseSignal}
            hasOverlay={flyHasOverlay}
            startPaused={flyStartPaused}
            vehicleType={flyVehicle}
            UniverseRadius={universeRadius}
          />
        )}

        {!flyMode && (
          <OrbitControls
            enablePan
            enableZoom
            maxDistance={25000}
            minDistance={100}
            makeDefault
          />
        )}

        <EffectComposer enableNormalPass={false}>
          <Bloom luminanceThreshold={0.85} mipmapBlur intensity={2.2} radius={0.5} />
          <ChromaticAberration blendFunction={BlendFunction.NORMAL} offset={new THREE.Vector2(0.0003, 0.0003) as any} radialModulation={false} modulationOffset={0} />
          <Vignette offset={0.45} darkness={0.5} blendFunction={BlendFunction.NORMAL} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
