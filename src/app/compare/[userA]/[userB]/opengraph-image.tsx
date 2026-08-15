import { ImageResponse } from "next/og";

export const alt = "Comparativo de indicadores públicos — Grupo Maia";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ userA: string; userB: string }> }) {
  const { userA, userB } = await params;
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px", background: "#171714", color: "#f1eee6", fontFamily: "Arial, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #5a554a", paddingBottom: 24 }}><span style={{ fontSize: 28, letterSpacing: 7 }}>MAIA</span><span style={{ fontSize: 18, color: "#b89a62" }}>INDICADORES PÚBLICOS</span></div>
      <div style={{ display: "flex", flexDirection: "column", gap: 30 }}><span style={{ fontSize: 25, color: "#bcb6a9" }}>Leitura comparativa</span><div style={{ display: "flex", alignItems: "center", gap: 30, fontSize: 62 }}><span>@{userA}</span><span style={{ color: "#b89a62", fontSize: 28 }}>e</span><span>@{userB}</span></div><span style={{ fontSize: 24, color: "#8f8a7f" }}>Dados públicos apresentados lado a lado, sem pontuação competitiva.</span></div>
      <span style={{ fontSize: 18, color: "#8f8a7f" }}>Mapa Vivo · Grupo Maia</span>
    </div>,
    size
  );
}

