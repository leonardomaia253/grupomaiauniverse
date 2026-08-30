import type { Metadata } from "next";
import RoadmapClient from "./RoadmapClient";

export const metadata: Metadata = {
  title: "Evolução da plataforma — Grupo Maia",
  description: "Entregas e próximos passos da plataforma institucional do Grupo Maia.",
};

export default function RoadmapPage() {
  return <RoadmapClient />;
}
