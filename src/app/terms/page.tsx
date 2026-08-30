import type { Metadata } from "next";
import EditorialPageShell, { EditorialSection } from "@/components/EditorialPageShell";

export const metadata: Metadata = {
  title: "Termos de uso — Grupo Maia",
  description: "Termos de uso da plataforma institucional do Grupo Maia.",
};

/* Static content nodes are subsequently keyed by their section title. */
/* eslint-disable react/jsx-key */
const terms = [
  ["A plataforma", <p>Esta plataforma apresenta as empresas, áreas de atuação e canais institucionais do Grupo Maia. Ao utilizar o serviço, você concorda com estes termos.</p>],
  ["Informações publicadas", <p>As informações possuem finalidade institucional e podem ser atualizadas conforme a evolução das operações do grupo.</p>],
  ["Uso responsável", <p>Não é permitido tentar interromper o serviço, explorar falhas, automatizar contas falsas, inflar indicadores, coletar dados sem autorização ou se passar por terceiros.</p>],
  ["Propriedade intelectual", <p>Marca, interface, textos e materiais institucionais pertencem aos seus respectivos titulares. Dados públicos de terceiros permanecem sujeitos às licenças e regras das fontes originais.</p>],
  ["Serviços e pagamentos", <p>Contratações opcionais são processadas por fornecedores especializados. Condições, valores, cancelamentos e reembolsos devem ser apresentados antes da confirmação de cada operação e observar a legislação aplicável.</p>],
  ["Disponibilidade", <p>A plataforma é oferecida conforme disponibilidade técnica. Integrações externas, manutenção e incidentes podem afetar temporariamente o acesso ou a atualização dos dados.</p>],
  ["Responsabilidade", <p>Indicadores e informações públicas têm finalidade informativa e não constituem recomendação financeira, jurídica ou comercial. Decisões devem considerar fontes oficiais e análise independente.</p>],
  ["Serviços de terceiros", <p>Links e integrações externas seguem termos próprios. O Grupo Maia não controla alterações, disponibilidade ou práticas adotadas por esses fornecedores.</p>],
  ["Alterações", <p>Estes termos podem ser atualizados em razão de mudanças legais, técnicas ou operacionais. A versão vigente e sua data de revisão permanecerão disponíveis nesta página.</p>],
  ["Contato", <p>Dúvidas podem ser encaminhadas para <a className="text-[#c5aa7d] underline decoration-white/20 underline-offset-4" href="mailto:contato@grupomaia.me">contato@grupomaia.me</a>.</p>],
] as const;
/* eslint-enable react/jsx-key */

export default function TermsPage() {
  return (
    <EditorialPageShell eyebrow="Governança" title="Termos de uso" intro="Condições para utilização da plataforma institucional do Grupo Maia. Última revisão: 30 de agosto de 2026.">
      <div className="border-b border-white/13">
        {terms.map(([title, content], index) => <EditorialSection key={title} index={index + 1} title={title}>{content}</EditorialSection>)}
      </div>
    </EditorialPageShell>
  );
}
