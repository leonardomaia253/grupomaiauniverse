"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function Sun({ radius = 60 }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.elapsedTime * 0.1;
    }
    if (glowRef.current) {
        const s = 1 + Math.sin(clock.elapsedTime * 2) * 0.05;
        glowRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group>
      {/* Central Star */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshStandardMaterial 
          emissive="#ffbb00" 
          emissiveIntensity={2} 
          color="#ff7700"
          toneMapped={false}
        />
      </mesh>

      {/* Outer Glow / Corona */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[radius * 1.2, 32, 32]} />
        <meshBasicMaterial 
          color="#ffcc00" 
          transparent 
          opacity={0.3} 
          side={THREE.BackSide}
        />
      </mesh>

      {/* Primary Light Source */}
      <pointLight intensity={150000} distance={10000} color="#ffddaa" />
    </group>
  );
}
