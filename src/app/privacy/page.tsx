import type { Metadata } from "next";
import EditorialPageShell, { EditorialSection } from "@/components/EditorialPageShell";

export const metadata: Metadata = {
  title: "Privacidade — Grupo Maia",
  description: "Política de privacidade da plataforma institucional do Grupo Maia.",
};

/* Static content nodes are subsequently keyed by their section title. */
/* eslint-disable react/jsx-key */
const items = [
  ["Dados que coletamos", <p>Podemos receber os dados enviados voluntariamente nos formulários de contato, além de informações técnicas essenciais para segurança e funcionamento da plataforma.</p>],
  ["Como usamos os dados", <p>Usamos essas informações para identificar perfis, apresentar dados públicos no mapa, processar solicitações, enviar comunicações autorizadas e melhorar a plataforma.</p>],
  ["Serviços utilizados", <p>A operação utiliza fornecedores de infraestrutura, armazenamento, métricas e comunicação. Cada fornecedor mantém sua própria política de privacidade.</p>],
  ["Cookies e armazenamento local", <p>Cookies são usados para sessões autenticadas. O armazenamento local preserva preferências da interface. Métricas agregadas de uso podem ser coletadas para avaliar desempenho e estabilidade.</p>],
  ["Retenção", <p>Os dados são mantidos enquanto a conta ou a finalidade operacional permanecer ativa, respeitando obrigações legais e prazos técnicos de segurança.</p>],
  ["Seus direitos", <p>Você pode solicitar acesso, correção, portabilidade ou exclusão dos seus dados, além de retirar consentimentos de comunicação.</p>],
  ["Segurança", <p>Adotamos conexões criptografadas, controle de acesso, políticas de segurança em banco de dados e autenticação por fornecedores especializados. Nenhum sistema conectado à internet é absolutamente imune a riscos.</p>],
  ["Menores de idade", <p>A plataforma não é dirigida a menores de 13 anos e não coleta intencionalmente informações de crianças.</p>],
  ["Atualizações", <p>Esta política poderá ser atualizada para refletir mudanças legais, técnicas ou operacionais. A data de revisão será sempre indicada nesta página.</p>],
  ["Contato", <p>Dúvidas ou solicitações relacionadas a dados pessoais podem ser enviadas para <a className="text-[#c5aa7d] underline decoration-white/20 underline-offset-4" href="mailto:contato@grupomaia.me">contato@grupomaia.me</a>.</p>],
] as const;
/* eslint-enable react/jsx-key */

export default function PrivacyPage() {
  return (
    <EditorialPageShell eyebrow="Governança" title="Política de privacidade" intro="Como a plataforma do Grupo Maia coleta, utiliza e protege informações pessoais. Última revisão: 30 de agosto de 2026.">
      <div className="border-b border-white/13">
        {items.map(([title, content], index) => <EditorialSection key={title} index={index + 1} title={title}>{content}</EditorialSection>)}
      </div>
    </EditorialPageShell>
  );
}
