"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  generateUniverseLayout,
  type UniversePlanet,
  type SpacePlaza,
  type SpaceDecoration,
  type SpaceRiver,
  type SpaceBridge,
} from "@/lib/github";

const CityCanvas = dynamic(() => import("@/components/CityCanvas"), { ssr: false });

const THEME_MAP: Record<string, number> = {
  midnight: 0,
  sunset: 1,
  neon: 2,
  emerald: 3,
};

function WallpaperInner() {
  const params = useSearchParams();

  const themeParam = params.get("theme") ?? "emerald";
  const themeIndex = THEME_MAP[themeParam] ?? 3;

  const speedParam = params.get("speed");
  const speed = speedParam ? Math.min(0.5, Math.max(0.05, parseFloat(speedParam) || 0.08)) : 0.08;

  const [planets, setplanets] = useState<UniversePlanet[]>([]);
  const [plazas, setPlazas] = useState<SpacePlaza[]>([]);
  const [decorations, setDecorations] = useState<SpaceDecoration[]>([]);
  const [river, setRiver] = useState<SpaceRiver | null>(null);
  const [bridges, setBridges] = useState<SpaceBridge[]>([]);
  const [ready, setReady] = useState(false);

  const fetchUniverse = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let allcompanies: any[] = [];

    // Try pre-computed snapshot first
    try {
      const v = Math.floor(Date.now() / 300_000);
      const snapshotUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/Universe-data/snapshot.json?v=${v}`;
      const snapshotRes = await fetch(snapshotUrl);
      if (snapshotRes.ok) {
        const buf = await snapshotRes.arrayBuffer();
        const ds = new DecompressionStream("gzip");
        const stream = new Blob([buf]).stream().pipeThrough(ds);
        const snapshot = await new Response(stream).json();
        allcompanies = snapshot.companies;
      }
    } catch { /* fall through to chunked */ }

    // Fallback to chunked API
    if (allcompanies.length === 0) {
      const CHUNK = 1000;
      const res = await fetch(`/api/Universe?from=0&to=${CHUNK}`);
      if (!res.ok) return;
      const data = await res.json();
      allcompanies = data.companies ?? [];

      const total = data.stats?.total_companies ?? allcompanies.length;
      if (total > CHUNK) {
        const promises: Promise<{ companies: typeof allcompanies } | null>[] = [];
        for (let from = CHUNK; from < total; from += CHUNK) {
          promises.push(
            fetch(`/api/Universe?from=${from}&to=${from + CHUNK}`)
              .then((r) => (r.ok ? r.json() : null))
          );
        }
        const chunks = await Promise.all(promises);
        for (const chunk of chunks) {
          if (chunk) allcompanies = [...allcompanies, ...chunk.companies];
        }
      }
    }

    if (allcompanies.length === 0) return;

    const layout = generateUniverseLayout(allcompanies);
    setplanets(layout.planets);
    setPlazas(layout.plazas);
    setDecorations(layout.decorations);
    setRiver(layout.river);
    setBridges(layout.bridges);
    setReady(true);
  }, []);

  useEffect(() => {
    fetchUniverse();
  }, [fetchUniverse]);

  if (!ready) return null;

  return (
    <CityCanvas
      planets={planets}
      plazas={plazas}
      decorations={decorations}
      river={river}
      bridges={bridges}
      flyMode={false}
      onExitFly={() => {}}
      themeIndex={themeIndex}
      introMode={false}
      wallpaperMode
      wallpaperSpeed={speed}
    />
  );
}

export default function WallpaperPage() {
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", cursor: "none", overflow: "hidden" }}>
      <Suspense fallback={null}>
        <WallpaperInner />
      </Suspense>
    </div>
  );
}
