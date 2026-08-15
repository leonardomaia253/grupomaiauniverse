import type { Metadata } from "next";
import RoadmapClient from "./RoadmapClient";

export const metadata: Metadata = {
  title: "Evolução da plataforma — Grupo Maia",
  description: "Entregas, desenvolvimento atual e próximos passos do Mapa Vivo.",
};

export default function RoadmapPage() {
  return <RoadmapClient />;
}
