"use client";

import MaiaStoryIntro from "@/components/MaiaStoryIntro";

export default function IntroPage() {
  return <MaiaStoryIntro onComplete={() => window.location.assign("/")} />;
}
