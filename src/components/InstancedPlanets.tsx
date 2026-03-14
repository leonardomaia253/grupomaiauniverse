"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { CompanyPlanet } from "@/lib/solarSystem";

export default function InstancedPlanets({ planets }: { planets: CompanyPlanet[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const ringMeshRef = useRef<THREE.InstancedMesh>(null);
  
  const count = planets.length;
  const geo = useMemo(() => new THREE.SphereGeometry(1, 32, 32), []);
  const ringGeo = useMemo(() => new THREE.RingGeometry(1.2, 2, 64), []);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const _color = useMemo(() => new THREE.Color(), []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.elapsedTime;

    planets.forEach((planet, i) => {
      // Calculate current position in orbit
      const currentAngle = planet.angle + t * planet.speed;
      const x = Math.cos(currentAngle) * planet.distance;
      const z = Math.sin(currentAngle) * planet.distance;
      const y = Math.sin(currentAngle) * planet.distance * planet.inclination;

      dummy.position.set(x, y, z);
      dummy.scale.setScalar(planet.radius);
      dummy.rotation.y = t * 0.5; // Self-rotation
      dummy.updateMatrix();
      
      meshRef.current!.setMatrixAt(i, dummy.matrix);
      
      if (planet.hasRings && ringMeshRef.current) {
        dummy.scale.setScalar(planet.radius);
        dummy.rotation.x = Math.PI / 2 + planet.inclination;
        ringMeshRef.current.setMatrixAt(i, dummy.matrix);
      } else if (ringMeshRef.current) {
        // Hide rings for those that don't have them
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        ringMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (ringMeshRef.current) ringMeshRef.current.instanceMatrix.needsUpdate = true;
  });

  const colors = useMemo(() => {
    const array = new Float32Array(count * 3);
    planets.forEach((planet, i) => {
      _color.set(planet.color);
      array[i * 3] = _color.r;
      array[i * 3 + 1] = _color.g;
      array[i * 3 + 2] = _color.b;
    });
    return array;
  }, [planets, count, _color]);

  return (
    <group>
      <instancedMesh ref={meshRef} args={[geo, undefined, count]}>
        <meshStandardMaterial roughness={0.7} metalness={0.2} />
        <instancedBufferAttribute 
          attach="geometry-attributes-color" 
          args={[colors, 3]} 
        />
      </instancedMesh>

      <instancedMesh ref={ringMeshRef} args={[ringGeo, undefined, count]}>
        <meshBasicMaterial 
          transparent 
          opaUniverse={0.4} 
          side={THREE.DoubleSide} 
          color="#ffffff" 
        />
      </instancedMesh>
    </group>
  );
}
