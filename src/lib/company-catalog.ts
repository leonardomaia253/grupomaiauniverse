export type InstitutionalCompany = {
  slug: string;
  name: string;
  sector: string;
  description: string;
  repository?: string;
};

export const INSTITUTIONAL_COMPANIES: InstitutionalCompany[] = [
  { slug: "13-de-maio", name: "13 de Maio", sector: "Imóveis", description: "Ativo patrimonial imobiliário do Grupo Maia.", repository: "https://github.com/leonardomaia253/brewmaster-flux-" },
  { slug: "abroo", name: "Abroo", sector: "Plataforma Digital", description: "Plataforma digital para lançar e operar produtos e serviços.", repository: "https://github.com/leonardomaia253/volup-plateforme-gastronomique" },
  { slug: "agrovolup", name: "Agrovolup", sector: "Agro & IA", description: "Tecnologia e inteligência aplicadas ao agronegócio.", repository: "https://github.com/leonardomaia253/farmflow" },
  { slug: "avantyp", name: "Avantyp", sector: "Estratégia & Tech", description: "Estratégia e tecnologia aplicadas à evolução de negócios.", repository: "https://github.com/leonardomaia253/series-learn-pro-" },
  { slug: "bilheking", name: "Bilheking", sector: "Entretenimento", description: "Tecnologia comercial para eventos, vendas e relacionamento com públicos.", repository: "https://github.com/leonardomaia253/bilheking-5c310afa" },
  { slug: "boase", name: "Boase", sector: "Operação & Serv.", description: "Serviços de apoio e execução para operações empresariais.", repository: "https://github.com/leonardomaia253/boase-" },
  { slug: "gaslee", name: "Gaslee", sector: "Energia", description: "Serviços cotidianos de energia com eficiência comercial.", repository: "https://github.com/leonardomaia253/volup-flow-control-" },
  { slug: "grupo-maia", name: "Grupo Maia", sector: "Holding", description: "Holding responsável pelo planejamento, capital e serviços compartilhados das 29 empresas.", repository: "https://github.com/leonardomaia253/holding-insight-hub" },
  { slug: "habitat-x", name: "Habitat X", sector: "Imóveis", description: "Espaços, moradia e produto imobiliário com identidade própria.", repository: "https://github.com/leonardomaia253/habitat-x-module-dream-" },
  { slug: "influarc", name: "Influarc", sector: "Mídia", description: "Influência, conteúdo e distribuição digital.", repository: "https://github.com/leonardomaia253/Influarc" },
  { slug: "instaboost", name: "Instaboost", sector: "Crescimento Social", description: "Operação de alcance e crescimento em canais sociais.", repository: "https://github.com/leonardomaia253/insta-glow-boost-" },
  { slug: "iris", name: "Iris", sector: "IA & Automação", description: "Automação e análise de dados para rotinas operacionais.", repository: "https://github.com/leonardomaia253/auto-law-orchestra-" },
  { slug: "jack-it-fit", name: "Jack it fit", sector: "Performance", description: "Operação dedicada à performance, ao cuidado e ao bem-estar." },
  { slug: "kinkora", name: "Kinkora", sector: "Comunidade", description: "Marca, relacionamento e construção de comunidade.", repository: "https://github.com/leonardomaia253/hotjob-creator-hub-" },
  { slug: "lmaia", name: "LMAIA", sector: "Holding", description: "Estrutura de capital e governança patrimonial da família Maia.", repository: "https://github.com/leonardomaia253/leonardomaia-" },
  { slug: "maia-go", name: "Maia Go", sector: "Mobilidade", description: "Serviços digitais para deslocamento e logística urbana.", repository: "https://github.com/leonardomaia253/maia-smart-market" },
  { slug: "minvest", name: "Minvest", sector: "Investimentos", description: "Análise e gestão de investimentos e patrimônio.", repository: "https://github.com/leonardomaia253/minvest-accelerate" },
  { slug: "pipex", name: "Pipex", sector: "Automação", description: "Fluxos, integrações e cadência entre áreas de negócio.", repository: "https://github.com/leonardomaia253/leadsmaia" },
  { slug: "proto-rh", name: "PROTO.RH", sector: "RH & People", description: "Gente, processos e inteligência de contratação em uma plataforma.", repository: "https://github.com/leonardomaia253/smartrh" },
  { slug: "scoreking", name: "Scoreking", sector: "IA & Automação", description: "Dados para leitura de performance, risco e tomada de decisão.", repository: "https://github.com/leonardomaia253/scoreking-playmaker" },
  { slug: "seu-jornaleiro", name: "Seu Jornaleiro", sector: "Mídia", description: "Conteúdo, distribuição e presença local em uma operação integrada.", repository: "https://github.com/leonardomaia253/seujornaleiro-" },
  { slug: "spur", name: "Spur", sector: "Performance", description: "Execução, produção e estratégia comercial para negócios em expansão.", repository: "https://github.com/leonardomaia253/spur-" },
  { slug: "sun-and-tan", name: "Sun & Tan", sector: "Saúde", description: "Beleza e bem-estar conectando presença física e canais digitais." },
  { slug: "the-maia", name: "The Maia", sector: "Holding", description: "Gestão da marca e da comunicação institucional do Grupo Maia.", repository: "https://github.com/leonardomaia253/themaiax" },
  { slug: "tikal-beach-club", name: "Tikal Beach Club", sector: "Hospitalidade", description: "Experiência, lazer e hospitalidade com posicionamento premium.", repository: "https://github.com/leonardomaia253/tikal-beach-paradise" },
  { slug: "tosi", name: "Tosi", sector: "Produto Digital", description: "Produto e tecnologia orientados à eficiência e à construção de margem.", repository: "https://github.com/leonardomaia253/tech-style-match" },
  { slug: "venti", name: "Venti", sector: "Imóveis", description: "Atuação imobiliária com leitura patrimonial, territorial e comercial.", repository: "https://github.com/leonardomaia253/imoveisventi" },
  { slug: "voluclinic", name: "Voluclinic", sector: "Saúde", description: "Tecnologia aplicada a atendimento, agenda e operação clínica.", repository: "https://github.com/leonardomaia253/volup-clinic-suite-" },
  { slug: "volup-ai", name: "Volup AI", sector: "IA & Automação", description: "Desenvolvimento de agentes, automações e produtos com inteligência artificial.", repository: "https://github.com/leonardomaia253/volup-ai-solutions" },
];

export function getInstitutionalCompany(slug: string) {
  const normalized = decodeURIComponent(slug).trim().toLowerCase();
  return INSTITUTIONAL_COMPANIES.find((company) => company.slug === normalized);
}
