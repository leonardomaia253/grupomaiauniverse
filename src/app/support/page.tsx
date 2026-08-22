import Link from "next/link";
import EditorialPageShell from "@/components/EditorialPageShell";

const channels = [
  {
    title: "Parcerias e novos negócios",
    description: "Propostas comerciais, integrações, distribuição e oportunidades entre empresas.",
    subject: "Parcerias e novos negócios",
  },
  {
    title: "Imprensa e institucional",
    description: "Informações sobre o grupo, posicionamentos institucionais e materiais de comunicação.",
    subject: "Imprensa e institucional",
  },
  {
    title: "Tecnologia e plataforma",
    description: "Questões sobre o Mapa Vivo, dados públicos, integrações ou funcionamento da plataforma.",
    subject: "Tecnologia e plataforma",
  },
  {
    title: "Privacidade",
    description: "Solicitações de acesso, correção ou exclusão de dados e dúvidas sobre tratamento de informações.",
    subject: "Privacidade e dados",
  },
] as const;

export default function SupportPage() {
  return (
    <EditorialPageShell
      eyebrow="Contato"
      title="Vamos conversar."
      intro="Escolha o assunto para que sua mensagem chegue à frente adequada. O Grupo Maia responde por ordem de recebimento e prioridade."
      wide
    >
      <div className="grid border-l border-t border-white/13 md:grid-cols-2">
        {channels.map((channel, index) => (
          <a
            key={channel.title}
            href={`mailto:contato@grupomaia.me?subject=${encodeURIComponent(channel.subject)}`}
            className="group min-h-52 border-b border-r border-white/13 p-6 transition-colors hover:bg-white/[.035] sm:p-8"
          >
            <span className="text-[10px] tabular-nums text-white/25">{String(index + 1).padStart(2, "0")}</span>
            <h2 className="mt-8 text-2xl font-normal tracking-[-.035em] text-white/85">{channel.title}</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-white/45">{channel.description}</p>
            <span className="mt-7 inline-flex text-xs text-[#c5aa7d] transition-transform group-hover:translate-x-1">Escrever mensagem →</span>
          </a>
        ))}
      </div>

      <div className="mt-14 grid gap-8 border-t border-white/13 pt-8 sm:grid-cols-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#bda57e]">Canal geral</p>
          <a className="mt-3 block text-xl text-white/80" href="mailto:contato@grupomaia.me">contato@grupomaia.me</a>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#bda57e]">Antes de escrever</p>
          <p className="mt-3 text-sm leading-6 text-white/45">Você também pode consultar o <Link className="text-white/72 underline decoration-white/20 underline-offset-4" href="/">índice das empresas</Link> ou assistir à <Link className="text-white/72 underline decoration-white/20 underline-offset-4" href="/intro">apresentação institucional</Link>.</p>
        </div>
      </div>
    </EditorialPageShell>
  );
}
