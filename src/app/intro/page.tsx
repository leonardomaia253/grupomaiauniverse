"use client";

import MaiaStoryIntro from "@/components/MaiaStoryIntro";
import { useRouter } from "next/navigation";

export default function IntroPage() {
  const router = useRouter();
  return <MaiaStoryIntro onComplete={() => router.push("/")} />;
}
