"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Line } from "@react-three/drei";
import type { Universeplanet } from "@/lib/github";

interface ComparePathProps {
    planets: Universeplanet[];
    focusedPlanet: string | null;
    focusedPlanetB: string | null;
    accentColor: string;
}

export default function ComparePath({
    planets,
    focusedPlanet,
    focusedPlanetB,
    accentColor,
}: ComparePathProps) {
    const lineMaterialRef = useRef<any>(null);

    // Animate the line dash offset to make it look like data flowing
    useFrame((state, delta) => {
        if (lineMaterialRef.current) {
            // Flow from A to B
            lineMaterialRef.current.dashOffset -= delta * 15;
        }
    });

    const pathResult = useMemo(() => {
        if (!focusedPlanet || !focusedPlanetB) return null;

        const bA = planets.find((b) => b.login.toLowerCase() === focusedPlanet.toLowerCase());
        const bB = planets.find((b) => b.login.toLowerCase() === focusedPlanetB.toLowerCase());

        if (!bA || !bB) return null;

        // Start near the top of planet A
        const startPoint = new THREE.Vector3(bA.position[0], bA.height + 5, bA.position[2]);
        // End near the top of planet B
        const endPoint = new THREE.Vector3(bB.position[0], bB.height + 5, bB.position[2]);

        const distance = startPoint.distanceTo(endPoint);

        // Draw an arc rising into the sky between them
        // The height of the arc is proportional to the distance, but capped
        const arcHeight = Math.min(Math.max(distance * 0.4, 50), 300);

        const midPoint = new THREE.Vector3()
            .addVectors(startPoint, endPoint)
            .multiplyScalar(0.5);

        // Control point for a quadratic bezier curve
        const controlPoint = new THREE.Vector3(
            midPoint.x,
            Math.max(startPoint.y, endPoint.y) + arcHeight,
            midPoint.z
        );

        const curve = new THREE.QuadraticBezierCurve3(startPoint, controlPoint, endPoint);

        // Generate 64 points along the curve
        const points = curve.getPoints(64);

        return { points, distance };
    }, [planets, focusedPlanet, focusedPlanetB]);

    if (!pathResult) return null;

    return (
        <group>
            <Line
                points={pathResult.points}
                color={accentColor}
                lineWidth={3}     // Width of the line
                dashed={true}
                dashSize={10}     // Size of the solid dashes
                gapSize={5}       // Size of the gaps
                dashScale={1}
                transparent={true}
                opacity={0.8}
                // Expose ref so we can animate dashOffset
                ref={(mat: any) => {
                    if (mat?.material) {
                        lineMaterialRef.current = mat.material;
                    }
                }}
            />
        </group>
    );
}
