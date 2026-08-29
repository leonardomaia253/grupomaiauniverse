import { ImageResponse } from "next/og";
import { getSiteUrl } from "@/lib/brand";

export const alt = "Grupo Maia Universe — 29 empresas conectadas";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  const logo = `${getSiteUrl()}/brand/grupo-maia-symbol-reverse.svg`;

  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#101713", color: "#f4f1e9", padding: "64px 72px", fontFamily: "Arial, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} width="64" height="64" alt="" />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 28, fontWeight: 700 }}>Grupo Maia</span>
          <span style={{ color: "#b7c7a9", fontSize: 15, letterSpacing: "0.18em", textTransform: "uppercase" }}>Universe</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", maxWidth: 900 }}>
        <span style={{ color: "#b7c7a9", fontSize: 18, letterSpacing: "0.14em", textTransform: "uppercase" }}>Ecossistema empresarial</span>
        <span style={{ marginTop: 22, fontSize: 82, lineHeight: 0.96, letterSpacing: "-0.055em" }}>29 empresas.<br />Uma estrutura conectada.</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(244,241,233,.22)", paddingTop: 20, color: "#b7c7a9", fontSize: 16 }}>
        <span>Governança · Capital · Operação</span>
        <span>universe.grupomaia.me</span>
      </div>
    </div>,
    size,
  );
}
