export type InstitutionalCompany = {
  slug: string;
  name: string;
  sector: string;
  description: string;
  repository?: string;
};

export const INSTITUTIONAL_COMPANIES: InstitutionalCompany[] = [
  { slug: "13-de-maio", name: "13 de Maio", sector: "Bebidas Artesanais", description: "Marca de cachaça artesanal produzida em pequenos lotes.", repository: "https://github.com/leonardomaia253/brewmaster-flux-" },
  { slug: "abroo", name: "Abroo", sector: "Food Service", description: "Plataforma de gestão e delivery para restaurantes.", repository: "https://github.com/leonardomaia253/volup-plateforme-gastronomique" },
  { slug: "agrovolup", name: "Agrovolup", sector: "Agro & IA", description: "Tecnologia e inteligência aplicadas ao agronegócio.", repository: "https://github.com/leonardomaia253/farmflow" },
  { slug: "avantyp", name: "Avantyp", sector: "Educação", description: "Plataforma de cursos digitais organizados em formato de séries.", repository: "https://github.com/leonardomaia253/series-learn-pro-" },
  { slug: "bilheking", name: "Bilheking", sector: "Entretenimento", description: "Tecnologia comercial para eventos, vendas e relacionamento com públicos.", repository: "https://github.com/leonardomaia253/bilheking-5c310afa" },
  { slug: "boase", name: "Boase", sector: "Náutica", description: "Aluguel de embarcações para passeios e experiências náuticas.", repository: "https://github.com/leonardomaia253/boase-" },
  { slug: "gaslee", name: "Gaslee", sector: "Energia & SaaS", description: "Software de gestão para postos e distribuidores de combustíveis.", repository: "https://github.com/leonardomaia253/volup-flow-control-" },
  { slug: "grupo-maia", name: "Grupo Maia", sector: "Holding", description: "Holding responsável pelo planejamento, capital e serviços compartilhados das 29 empresas.", repository: "https://github.com/leonardomaia253/holding-insight-hub" },
  { slug: "habitat-x", name: "Habitat X", sector: "Imóveis", description: "Espaços, moradia e produto imobiliário com identidade própria.", repository: "https://github.com/leonardomaia253/habitat-x-module-dream-" },
  { slug: "influarc", name: "Influarc", sector: "Jogos", description: "Empresa dedicada ao desenvolvimento e à operação de jogos digitais.", repository: "https://github.com/leonardomaia253/Influarc" },
  { slug: "instaboost", name: "Instaboost", sector: "Crescimento Social", description: "Operação de alcance e crescimento em canais sociais.", repository: "https://github.com/leonardomaia253/insta-glow-boost-" },
  { slug: "iris", name: "Iris", sector: "Mobilidade Urbana", description: "Plataforma de gestão de tráfego para órgãos governamentais.", repository: "https://github.com/leonardomaia253/auto-law-orchestra-" },
  { slug: "jack-it-fit", name: "Jack it fit", sector: "Vestuário Esportivo", description: "Marca de vestuário esportivo para treino e atividades físicas." },
  { slug: "kinkora", name: "Kinkora", sector: "Creator Economy", description: "Plataforma de conteúdo, monetização e relacionamento para criadores adultos.", repository: "https://github.com/leonardomaia253/hotjob-creator-hub-" },
  { slug: "lmaia", name: "LMAIA", sector: "Holding", description: "Estrutura de capital e governança patrimonial da família Maia.", repository: "https://github.com/leonardomaia253/leonardomaia-" },
  { slug: "maia-go", name: "Maia Go", sector: "Varejo Autônomo", description: "Supermercados inteligentes e autônomos para compras sem caixa tradicional.", repository: "https://github.com/leonardomaia253/maia-smart-market" },
  { slug: "minvest", name: "Minvest", sector: "Investimentos", description: "Análise e gestão de investimentos e patrimônio.", repository: "https://github.com/leonardomaia253/minvest-accelerate" },
  { slug: "pipex", name: "Pipex", sector: "Automação", description: "Fluxos, integrações e cadência entre áreas de negócio.", repository: "https://github.com/leonardomaia253/leadsmaia" },
  { slug: "proto-rh", name: "PROTO.RH", sector: "RH & People", description: "Gente, processos e inteligência de contratação em uma plataforma.", repository: "https://github.com/leonardomaia253/smartrh" },
  { slug: "scoreking", name: "Scoreking", sector: "Jogos & Esportes", description: "Plataforma gamificada de palpites sobre partidas e competições esportivas.", repository: "https://github.com/leonardomaia253/scoreking-playmaker" },
  { slug: "seu-jornaleiro", name: "Seu Jornaleiro", sector: "Mídia & Assinaturas", description: "Plataforma para gestão de assinaturas de jornais e revistas.", repository: "https://github.com/leonardomaia253/seujornaleiro-" },
  { slug: "spur", name: "Spur", sector: "Turismo", description: "Agência de viagens excêntricas para turistas que desejam conhecer o Brasil.", repository: "https://github.com/leonardomaia253/spur-" },
  { slug: "sun-and-tan", name: "Sun & Tan", sector: "Beleza & Tecnologia", description: "Câmaras inteligentes de bronzeamento com controle digital da experiência." },
  { slug: "the-maia", name: "The Maia", sector: "Fintech & Trading", description: "Plataforma de automação de operações de trading em múltiplos mercados.", repository: "https://github.com/leonardomaia253/themaiax" },
  { slug: "tikal-beach-club", name: "Tikal Beach Club", sector: "Hospitalidade", description: "Experiência, lazer e hospitalidade com posicionamento premium.", repository: "https://github.com/leonardomaia253/tikal-beach-paradise" },
  { slug: "tosi", name: "Tosi", sector: "Produto Digital", description: "Produto e tecnologia orientados à eficiência e à construção de margem.", repository: "https://github.com/leonardomaia253/tech-style-match" },
  { slug: "venti", name: "Venti", sector: "Imóveis", description: "Atuação imobiliária com leitura patrimonial, territorial e comercial.", repository: "https://github.com/leonardomaia253/imoveisventi" },
  { slug: "voluclinic", name: "Voluclinic", sector: "Saúde & SaaS", description: "Plataforma de gestão para clínicas e hospitais.", repository: "https://github.com/leonardomaia253/volup-clinic-suite-" },
  { slug: "volup-ai", name: "Volup AI", sector: "IA & Automação", description: "Desenvolvimento de agentes, automações e produtos com inteligência artificial.", repository: "https://github.com/leonardomaia253/volup-ai-solutions" },
];

export function getInstitutionalCompany(slug: string) {
  const normalized = decodeURIComponent(slug).trim().toLowerCase();
  return INSTITUTIONAL_COMPANIES.find((company) => company.slug === normalized);
}
