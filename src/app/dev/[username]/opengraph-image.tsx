import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const alt = "Empresa do Grupo Maia";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data } = await supabase.from("companies").select("username, name, public_repos, total_stars, contributions, contributions_total").eq("username", username.toLowerCase()).single();
  const name = data?.name || data?.username || username;
  const contributions = data ? Math.max(data.contributions_total ?? 0, data.contributions ?? 0) : 0;
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px", background: "#eeeae0", color: "#1c1c18", fontFamily: "Arial, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #b8b0a0", paddingBottom: 24 }}><span style={{ fontSize: 28, letterSpacing: 7 }}>MAIA</span><span style={{ fontSize: 18, color: "#74664d" }}>PORTFÓLIO</span></div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}><span style={{ fontSize: 22, color: "#74664d", textTransform: "uppercase", letterSpacing: 3 }}>Empresa do grupo</span><span style={{ fontSize: 88, lineHeight: 1 }}>{name}</span><span style={{ fontSize: 24, color: "#6e6b63" }}>@{data?.username || username}</span></div>
      <div style={{ display: "flex", gap: 48, fontSize: 20, color: "#57544d" }}><span>{contributions.toLocaleString("pt-BR")} contribuições públicas</span><span>{(data?.public_repos ?? 0).toLocaleString("pt-BR")} repositórios</span><span>{(data?.total_stars ?? 0).toLocaleString("pt-BR")} estrelas</span></div>
    </div>,
    size
  );
}

