import EditorialPageShell, { EditorialSection } from "@/components/EditorialPageShell";

const CONTRACT = "0xd523f92f5f313288cf69ac9ca456b8a7d7a6dba3";

export default function TokenNoticePage() {
  return (
    <EditorialPageShell eyebrow="Aviso público" title="Ativo comunitário não oficial" intro="Informações de transparência sobre um token criado por terceiros e sem vínculo societário, financeiro ou operacional com o Grupo Maia.">
      <div className="border-b border-white/13">
        <EditorialSection index={1} title="Sem emissão pelo grupo">
          <p>O Grupo Maia e o Mapa Vivo não criaram, solicitaram ou administram esse ativo. Não controlam oferta, preço, liquidez, listagens ou comunidades relacionadas.</p>
        </EditorialSection>
        <EditorialSection index={2} title="Sem recomendação">
          <p>Esta página não constitui oferta, publicidade, promessa de retorno ou aconselhamento financeiro. Ativos digitais podem perder integralmente seu valor.</p>
        </EditorialSection>
        <EditorialSection index={3} title="Risco de terceiros">
          <p>Qualquer interação ocorre por decisão e risco exclusivos do usuário. Nomes semelhantes podem ser usados em fraudes; verifique fontes independentes antes de qualquer operação.</p>
        </EditorialSection>
        <EditorialSection index={4} title="Registro informado">
          <p>Rede declarada: Base.</p>
          <p className="break-all font-mono text-xs text-white/42">Contrato informado por terceiros: {CONTRACT}</p>
        </EditorialSection>
      </div>
    </EditorialPageShell>
  );
}
