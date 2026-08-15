import Link from "next/link";
import EditorialPageShell from "@/components/EditorialPageShell";

export const metadata = {
  title: "Identidade no mapa — Grupo Maia",
  description: "Ferramentas de apresentação visual para perfis autorizados no Mapa Vivo.",
};

export default function VisualIdentityPage() {
  return (
    <EditorialPageShell
      eyebrow="Ferramentas"
      title="Identidade no mapa"
      intro="Uma área de configuração para responsáveis por perfis verificados. O objetivo é manter informações e presença visual coerentes com cada operação."
      wide
    >
      <div className="grid border-l border-t border-white/13 md:grid-cols-3">
        {[
          ["01", "Verifique o perfil", "Localize a empresa no índice e conclua a validação de responsabilidade."],
          ["02", "Revise as informações", "Confira nome, descrição, links públicos e indicadores apresentados."],
          ["03", "Ajuste a presença", "Defina elementos visuais sem comprometer a legibilidade e a identidade institucional."],
        ].map(([number, title, description]) => (
          <section key={number} className="min-h-64 border-b border-r border-white/13 p-7">
            <span className="text-[10px] text-white/25">{number}</span>
            <h2 className="mt-12 text-2xl tracking-[-.035em] text-white/82">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-white/43">{description}</p>
          </section>
        ))}
      </div>
      <div className="mt-10 flex flex-wrap gap-2">
        <Link href="/" className="rounded-full bg-[#eee9df] px-5 py-3 text-xs font-medium text-[#171512]">Localizar empresa</Link>
        <Link href="/support" className="rounded-full border border-white/18 px-5 py-3 text-xs text-white/65">Solicitar suporte</Link>
      </div>
    </EditorialPageShell>
  );
}
