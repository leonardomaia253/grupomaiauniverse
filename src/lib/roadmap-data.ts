export type ItemStatus = "done" | "active" | "planned";

export interface RoadmapItem {
  id: string;
  name: string;
  description?: string;
  status: ItemStatus;
}

export interface RoadmapPhase {
  id: string;
  title: string;
  quarter: string;
  status: ItemStatus;
  items: RoadmapItem[];
}

export const ROADMAP_PHASES: RoadmapPhase[] = [
  {
    id: "foundation",
    title: "Fundação institucional",
    quarter: "2026 · ciclo 1",
    status: "done",
    items: [
      { id: "portfolio-index", name: "Índice público de empresas", description: "Leitura clara do portfólio por empresa e área de atuação.", status: "done" },
      { id: "company-profiles", name: "Perfis institucionais", description: "Informações públicas, estrutura e indicadores reunidos em um só lugar.", status: "done" },
      { id: "editorial-system", name: "Sistema editorial MAIA", description: "Linguagem visual, navegação e conteúdo consistentes em toda a plataforma.", status: "done" },
      { id: "institutional-film", name: "Apresentação audiovisual", description: "Manifesto do grupo com trilha, capítulos e mídia adaptativa.", status: "done" },
    ],
  },
  {
    id: "governance",
    title: "Dados e governança",
    quarter: "2026 · ciclo 2",
    status: "active",
    items: [
      { id: "data-sources", name: "Fontes e atualização de dados", description: "Maior rastreabilidade sobre origem, data e escopo dos indicadores.", status: "active" },
      { id: "portfolio-taxonomy", name: "Taxonomia do portfólio", description: "Critérios consistentes para setores, estágios e relações entre empresas.", status: "active" },
      { id: "accessibility", name: "Acessibilidade e desempenho", description: "Aprimoramento contínuo de contraste, teclado, mídia e carregamento.", status: "active" },
    ],
  },
  {
    id: "narrative",
    title: "Conteúdo e presença",
    quarter: "2026 · ciclo 3",
    status: "planned",
    items: [
      { id: "company-stories", name: "Histórias das empresas", description: "Casos, marcos e contexto operacional apresentados com linguagem documental.", status: "planned" },
      { id: "leadership", name: "Visão e liderança", description: "Princípios, decisões e horizonte estratégico do Grupo Maia.", status: "planned" },
      { id: "media-library", name: "Biblioteca de mídia", description: "Fotografia, filmes e ativos de marca organizados por empresa.", status: "planned" },
    ],
  },
  {
    id: "relationships",
    title: "Relações institucionais",
    quarter: "2027",
    status: "planned",
    items: [
      { id: "partnerships", name: "Canal de parcerias", description: "Fluxo qualificado para oportunidades comerciais e institucionais.", status: "planned" },
      { id: "press-room", name: "Sala de imprensa", description: "Informações verificadas, contatos e materiais oficiais do grupo.", status: "planned" },
      { id: "portfolio-reports", name: "Relatórios do portfólio", description: "Sínteses periódicas de evolução, iniciativas e indicadores públicos.", status: "planned" },
    ],
  },
];

export const VALID_ITEM_IDS = new Set(ROADMAP_PHASES.flatMap((phase) => phase.items.map((item) => item.id)));
export const VOTABLE_ITEM_IDS = new Set<string>();

