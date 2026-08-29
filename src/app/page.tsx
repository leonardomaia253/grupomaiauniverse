"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import type { CompanyRecord } from "@/components/UniverseCanvas";
import LoadingScreen, { type LoadingStage } from "@/components/LoadingScreen";
import MaiaStoryIntro from "@/components/MaiaStoryIntro";

const UniverseCanvas = dynamic(() => import("@/components/UniverseCanvas"), { ssr: false });
const INTRO_ENABLED = process.env.NEXT_PUBLIC_MAIA_STORY_INTRO !== "off";
const INTRO_STORAGE_KEY = "maia_editorial_intro_seen_v3";

type CityPayload = { companies?: CompanyRecord[] };

function HomeContent() {
  const searchParams = useSearchParams();
  const mounted = useRef(false);
  const [companies, setCompanies] = useState<CompanyRecord[]>([]);
  const [loadStage, setLoadStage] = useState<LoadingStage>("init");
  const [progress, setProgress] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [introOpen, setIntroOpen] = useState(false);

  const shouldOpenIntro = useCallback(() => {
    if (!INTRO_ENABLED) return false;
    const deepLink = searchParams.has("user") || searchParams.has("compare");
    const forced = searchParams.get("intro") === "1";
    return !deepLink && (forced || localStorage.getItem(INTRO_STORAGE_KEY) !== "true");
  }, [searchParams]);

  const loadCompanies = useCallback(async () => {
    setLoadError(null);
    setLoadStage("fetching");
    setProgress(18);
    try {
      const response = await fetch("/api/city?from=0&to=1000");
      if (!response.ok) throw new Error("Não foi possível consultar as empresas.");
      setProgress(58);
      const payload = await response.json() as CityPayload;
      setCompanies(Array.isArray(payload.companies) ? payload.companies : []);
      setLoadStage("rendering");
      setProgress(84);
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      setProgress(100);
      setLoadStage("ready");
    } catch (error) {
      console.warn("[Mapa Vivo] Dados externos indisponíveis; usando o diretório institucional local.", error);
      setCompanies([]);
      setProgress(100);
      setLoadStage("ready");
    }
  }, []);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    void loadCompanies();
  }, [loadCompanies]);

  const finishLoading = () => {
    setLoadStage("done");
    if (shouldOpenIntro()) setIntroOpen(true);
  };

  const closeIntro = () => {
    localStorage.setItem(INTRO_STORAGE_KEY, "true");
    setIntroOpen(false);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-bg text-warm">
      <UniverseCanvas companies={companies} />

      {loadStage !== "done" && (
        <LoadingScreen
          stage={loadStage}
          progress={progress}
          error={loadError}
          accentColor="#dbe7cf"
          onRetry={() => void loadCompanies()}
          onFadeComplete={finishLoading}
        />
      )}

      {INTRO_ENABLED && introOpen && loadStage === "done" && <MaiaStoryIntro onComplete={closeIntro} />}

      {INTRO_ENABLED && !introOpen && loadStage === "done" && (
        <button type="button" onClick={() => setIntroOpen(true)} className="maia-map-film-button">
          <span className="maia-play-mark" aria-hidden="true" /> Apresentação do grupo
        </button>
      )}
    </main>
  );
}

export default function HomePage() {
  return <Suspense><HomeContent /></Suspense>;
}
