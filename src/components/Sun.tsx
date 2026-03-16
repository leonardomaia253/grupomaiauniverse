"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Pre-allocated scratch objects — no GC in useFrame
const _scratchColor = new THREE.Color();

export default function Sun({ radius = 60 }) {
  const coreRef   = useRef<THREE.Mesh>(null);
  const innerGlow = useRef<THREE.Mesh>(null);
  const outerGlow = useRef<THREE.Mesh>(null);

  // Corona rings – 3 at different inclinations / speeds
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);
  const ring3 = useRef<THREE.Mesh>(null);

  // Flare spike group
  const flareGroup = useRef<THREE.Group>(null);

  // Energy ring (equatorial)
  const energyRing = useRef<THREE.Mesh>(null);

  // Corona ring geometry/material (shared across rings via cloneGeometry)
  const { ringGeo1, ringGeo2, ringGeo3 } = useMemo(() => ({
    ringGeo1: new THREE.RingGeometry(radius * 1.28, radius * 1.38, 64),
    ringGeo2: new THREE.RingGeometry(radius * 1.50, radius * 1.56, 64),
    ringGeo3: new THREE.RingGeometry(radius * 1.72, radius * 1.76, 64),
  }), [radius]);

  const energyRingGeo = useMemo(
    () => new THREE.RingGeometry(radius * 1.1, radius * 1.14, 80),
    [radius]
  );

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;

    // Core slow rotation
    if (coreRef.current) {
      coreRef.current.rotation.y = t * 0.08;
      coreRef.current.rotation.z = t * 0.03;
    }

    // Inner/outer glow pulsing
    if (innerGlow.current) {
      const s = 1 + Math.sin(t * 1.6) * 0.04;
      innerGlow.current.scale.setScalar(s);
    }
    if (outerGlow.current) {
      const s = 1 + Math.sin(t * 1.1 + 1) * 0.06;
      outerGlow.current.scale.setScalar(s);
    }

    // Corona rings — three independent rotations
    if (ring1.current) {
      ring1.current.rotation.z = t * 0.30;
      ring1.current.rotation.x = Math.sin(t * 0.07) * 0.3;
    }
    if (ring2.current) {
      ring2.current.rotation.z = -t * 0.14;
      ring2.current.rotation.x = Math.PI * 0.25 + Math.sin(t * 0.09) * 0.2;
    }
    if (ring3.current) {
      ring3.current.rotation.z = t * 0.06;
      ring3.current.rotation.x = Math.PI * 0.5 + Math.cos(t * 0.11) * 0.15;
    }

    // Flare spikes pulse scale
    if (flareGroup.current) {
      flareGroup.current.rotation.y = t * 0.04;
      flareGroup.current.children.forEach((child, i) => {
        const pulse = 1 + Math.sin(t * 1.8 + i * 1.2) * 0.25;
        child.scale.setScalar(pulse);
      });
    }

    // Equatorial energy ring spin + opacity pulse
    if (energyRing.current) {
      energyRing.current.rotation.z = t * 0.7;
      const mat = energyRing.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.35 + Math.sin(t * 2.5) * 0.2;
    }
  });

  // Build 4 flare cone meshes pointing outward
  const flareAngles = useMemo(() => [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2], []);
  const flareMat = useMemo(
    () => new THREE.MeshBasicMaterial({ color: "#ffcc44", transparent: true, opacity: 0.55, side: THREE.DoubleSide }),
    []
  );
  const flareGeo = useMemo(() => new THREE.ConeGeometry(radius * 0.08, radius * 0.6, 6), [radius]);

  return (
    <group>
      {/* ── Central Star Core ── */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshStandardMaterial
          emissive="#ffaa00"
          emissiveIntensity={3}
          color="#ff6600"
          toneMapped={false}
        />
      </mesh>

      {/* ── Inner Glow ── */}
      <mesh ref={innerGlow}>
        <sphereGeometry args={[radius * 1.08, 32, 32]} />
        <meshBasicMaterial
          color="#ffdd44"
          transparent
          opacity={0.35}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* ── Outer Glow / Corona Haze ── */}
      <mesh ref={outerGlow}>
        <sphereGeometry args={[radius * 1.25, 32, 32]} />
        <meshBasicMaterial
          color="#ff8800"
          transparent
          opacity={0.14}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* ── Corona Ring 1 (inner, warm) ── */}
      <mesh ref={ring1} geometry={ringGeo1}>
        <meshBasicMaterial
          color="#ffdd44"
          transparent
          opacity={0.55}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* ── Corona Ring 2 (middle, orange) ── */}
      <mesh ref={ring2} geometry={ringGeo2}>
        <meshBasicMaterial
          color="#ff9900"
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* ── Corona Ring 3 (outer, pale) ── */}
      <mesh ref={ring3} geometry={ringGeo3}>
        <meshBasicMaterial
          color="#ffe8aa"
          transparent
          opacity={0.20}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* ── Equatorial Energy Ring ── */}
      <mesh ref={energyRing} geometry={energyRingGeo}>
        <meshBasicMaterial
          color="#00ccff"
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* ── Solar Flare Spikes ── */}
      <group ref={flareGroup}>
        {flareAngles.map((angle, i) => (
          <mesh
            key={i}
            geometry={flareGeo}
            material={flareMat}
            position={[
              Math.cos(angle) * radius * 1.05,
              Math.sin(angle) * radius * 1.05,
              0,
            ]}
            rotation={[0, 0, angle + Math.PI / 2]}
          />
        ))}
      </group>

      {/* ── Primary Light Source ── */}
      <pointLight intensity={200000} distance={12000} color="#ffeecc" />
      {/* ── Subtle secondary cool fill ── */}
      <pointLight intensity={8000} distance={3000} color="#4488ff" />
    </group>
  );
}
