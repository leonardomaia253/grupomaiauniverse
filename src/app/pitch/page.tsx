import type { Metadata } from "next";
import { getPitchStats } from "@/lib/pitch-stats";
import PitchDeck from "./PitchDeck";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Pitch Deck - Git Universe",
  description:
    "Git Universe: transforming GitHub profiles into an interactive 3D Universe. 11,800+ companies, organic growth, revenue from day one.",
};

export default async function PitchPage() {
  const stats = await getPitchStats();
  return <PitchDeck stats={stats} />;
}
