// @ts-nocheck
"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ─── Twinkling shader ─────────────────────────────────────────
// Uses a per-vertex random phase so each star twinkles independently.
// uTime drives the oscillation; no GC — uniform is updated in-place.

const twinkleVert = /* glsl */ `
  attribute float aPhase;
  attribute float aSize;
  varying float vAlpha;

  uniform float uTime;

  void main() {
    // Sinusoidal twinkle with unique phase per star
    float twinkle = 0.5 + 0.5 * sin(uTime * 1.8 + aPhase * 6.2832);
    vAlpha = 0.35 + twinkle * 0.65;

    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * twinkle * (300.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const twinkleFrag = /* glsl */ `
  varying float vAlpha;

  void main() {
    // Soft circular star disc with feathered edge
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float alpha = smoothstep(1.0, 0.3, d) * vAlpha;
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(1.0, 1.0, 1.0, alpha);
  }
`;

// ─── Component ─────────────────────────────────────────────────

export default function Starfield({ count = 5000 }) {
  // Layer A — far background stars (large / slow layer)
  const farRef  = useRef<THREE.Points>(null);
  // Layer B — closer stars (smaller / medium layer)
  const nearRef = useRef<THREE.Points>(null);

  const timeUniform = useMemo(() => ({ value: 0 }), []);

  // ── Far layer (count stars on a large sphere shell) ──
  const farAttribs = useMemo(() => {
    const farCount = count;
    const pos   = new Float32Array(farCount * 3);
    const phase = new Float32Array(farCount);
    const size  = new Float32Array(farCount);

    for (let i = 0; i < farCount; i++) {
      const radius = 6000 + Math.random() * 2000;
      const u = Math.random(); const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi   = Math.acos(2 * v - 1);
      pos[i * 3]     = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);
      phase[i] = Math.random();             // 0-1 random phase
      size[i]  = 1.2 + Math.random() * 2.8; // 1.2–4 px
    }
    return { positions: pos, phases: phase, sizes: size };
  }, [count]);

  // ── Near layer (2000 somewhat closer, slightly brighter) ──
  const nearAttribs = useMemo(() => {
    const nearCount = 2000;
    const pos   = new Float32Array(nearCount * 3);
    const phase = new Float32Array(nearCount);
    const size  = new Float32Array(nearCount);

    for (let i = 0; i < nearCount; i++) {
      const radius = 3500 + Math.random() * 1500;
      const u = Math.random(); const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi   = Math.acos(2 * v - 1);
      pos[i * 3]     = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = radius * Math.cos(phi);
      phase[i] = Math.random();
      size[i]  = 0.8 + Math.random() * 1.8; // slightly smaller
    }
    return { positions: pos, phases: phase, sizes: size };
  }, []);

  const shaderMat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uTime: timeUniform },
    vertexShader: twinkleVert,
    fragmentShader: twinkleFrag,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), [timeUniform]);

  useFrame(({ clock }) => {
    // Advance time uniform (single write, no allocations)
    timeUniform.value = clock.elapsedTime;

    // Very slow rotation for a sense of depth
    const t = clock.elapsedTime;
    if (farRef.current)  farRef.current.rotation.y  = t * 0.004;
    if (nearRef.current) nearRef.current.rotation.y = t * 0.0025;
  });

  return (
    <>
      {/* Far star layer */}
      <points ref={farRef} material={shaderMat}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={count}
            // @ts-ignore
            array={farAttribs.positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-aPhase"
            count={count}
            // @ts-ignore
            array={farAttribs.phases}
            itemSize={1}
          />
          <bufferAttribute
            attach="attributes-aSize"
            count={count}
            // @ts-ignore
            array={farAttribs.sizes}
            itemSize={1}
          />
        </bufferGeometry>
      </points>

      {/* Near star layer (depth parallax) */}
      <points ref={nearRef} material={shaderMat}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2000}
            // @ts-ignore
            array={nearAttribs.positions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-aPhase"
            count={2000}
            // @ts-ignore
            array={nearAttribs.phases}
            itemSize={1}
          />
          <bufferAttribute
            attach="attributes-aSize"
            count={2000}
            // @ts-ignore
            array={nearAttribs.sizes}
            itemSize={1}
          />
        </bufferGeometry>
      </points>
    </>
  );
}
