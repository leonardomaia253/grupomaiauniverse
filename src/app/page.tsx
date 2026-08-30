"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import LoadingScreen, { type LoadingStage } from "@/components/LoadingScreen";
import MaiaStoryIntro from "@/components/MaiaStoryIntro";

const UniverseCanvas = dynamic(() => import("@/components/UniverseCanvas"), { ssr: false });
const INTRO_ENABLED = process.env.NEXT_PUBLIC_MAIA_STORY_INTRO !== "off";

function HomeContent() {
  const searchParams = useSearchParams();
  const mounted = useRef(false);
  const [loadStage, setLoadStage] = useState<LoadingStage>("init");
  const [progress, setProgress] = useState(0);
  const [introOpen, setIntroOpen] = useState(false);

  const shouldOpenIntro = useCallback(() => {
    if (!INTRO_ENABLED) return false;
    const deepLink = searchParams.has("user") || searchParams.has("compare");
    return !deepLink;
  }, [searchParams]);

  const loadCompanies = useCallback(async () => {
    setLoadStage("fetching");
    setProgress(38);
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    setLoadStage("rendering");
    setProgress(84);
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    setProgress(100);
    setLoadStage("ready");
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
    setIntroOpen(false);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-bg text-warm">
      <UniverseCanvas />

      {loadStage !== "done" && (
        <LoadingScreen
          stage={loadStage}
          progress={progress}
          error={null}
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
