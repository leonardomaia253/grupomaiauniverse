import { ImageResponse } from "next/og";

export const alt = "MAIA — um grupo, múltiplas frentes de atuação";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px", background: "#171714", color: "#f1eee6", fontFamily: "Arial, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #5a554a", paddingBottom: 24 }}><span style={{ fontSize: 30, letterSpacing: 8 }}>MAIA</span><span style={{ fontSize: 18, color: "#b89a62", letterSpacing: 3 }}>GRUPO EMPRESARIAL</span></div>
      <div style={{ display: "flex", flexDirection: "column", maxWidth: 940, gap: 24 }}><span style={{ fontSize: 76, lineHeight: 1.02, letterSpacing: -3 }}>Empresas diferentes.<br />Uma direção comum.</span><span style={{ fontSize: 25, color: "#bcb6a9" }}>Estratégia, tecnologia, operação e patrimônio conectados em um mesmo portfólio.</span></div>
      <div style={{ display: "flex", justifyContent: "space-between", color: "#8f8a7f", fontSize: 17 }}><span>Mapa Vivo</span><span>Conheça o grupo</span></div>
    </div>,
    size
  );
}

