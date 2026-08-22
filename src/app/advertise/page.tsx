import type { Metadata } from "next";
import EditorialPageShell from "@/components/EditorialPageShell";

export const metadata: Metadata = {
  title: "Parcerias de mídia — Grupo Maia",
  description: "Projetos de mídia e presença institucional no ecossistema do Grupo Maia.",
};

const formats = [
  ["Conteúdo institucional", "Narrativas editoriais sobre negócios, tecnologia, território e inovação, com identificação clara de parceria."],
  ["Presença no diretório", "Destaques contextuais em áreas adequadas da plataforma, sem interromper a navegação ou simular conteúdo orgânico."],
  ["Projetos especiais", "Experiências, estudos e ativações desenvolvidos sob medida para objetivos e públicos definidos."],
] as const;

export default function MediaPartnershipsPage() {
  return (
    <EditorialPageShell
      eyebrow="Parcerias"
      title="Mídia com contexto."
      intro="O Grupo Maia avalia projetos que façam sentido para sua audiência e para a integridade da plataforma. Não comercializamos tráfego artificial, formatos intrusivos ou promessas de desempenho sem evidência."
      wide
    >
      <div className="grid border-l border-t border-white/13 md:grid-cols-3">
        {formats.map(([title, description], index) => (
          <section key={title} className="min-h-72 border-b border-r border-white/13 p-7">
            <span className="text-[10px] tabular-nums text-white/25">{String(index + 1).padStart(2, "0")}</span>
            <h2 className="mt-12 text-2xl tracking-[-.035em] text-white/82">{title}</h2>
            <p className="mt-4 text-sm leading-6 text-white/43">{description}</p>
          </section>
        ))}
      </div>

      <div className="mt-14 grid gap-10 border-t border-white/13 pt-9 lg:grid-cols-[1fr_1fr]">
        <section>
          <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#bda57e]">Princípios</p>
          <ul className="mt-5 space-y-3 text-sm leading-6 text-white/48">
            <li>Identificação explícita de conteúdo patrocinado.</li>
            <li>Adequação editorial e reputacional.</li>
            <li>Métricas definidas antes da contratação.</li>
            <li>Proteção da experiência e dos dados da audiência.</li>
          </ul>
        </section>
        <section>
          <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#bda57e]">Enviar proposta</p>
          <p className="mt-5 max-w-lg text-sm leading-6 text-white/48">Informe marca, objetivo, público, período e formato pretendido. A equipe avaliará aderência, disponibilidade e condições comerciais.</p>
          <a href="mailto:contato@grupomaia.me?subject=Parceria%20de%20m%C3%ADdia" className="mt-6 inline-flex rounded-full bg-[#eee9df] px-5 py-3 text-xs font-medium text-[#171512]">Falar com a equipe</a>
        </section>
      </div>
    </EditorialPageShell>
  );
}
