export const DNA_MAIA_AUDIO = { instrumental: "/audio/dna-maia-instrumental.mp3", editorialDuration: 150 } as const;

export type StoryMode = "short" | "full";
export type StoryChapter = "code" | "origin" | "intelligence" | "experience" | "future" | "universe";
export type DnaMaiaCue = { id: string; chapter: StoryChapter; shortAt: number; title: string; line: string; accent: string; visual: string; companies: readonly string[] };

// Editorial truth for the 150-second film. Higgsfield footage can replace each
// chapter asset without changing the player, captions or timing contract.
export const DNA_MAIA_CUES: readonly DnaMaiaCue[] = [
  { id: "before", chapter: "code", shortAt: 0, title: "Antes do grupo", line: "Todo grande ecossistema começa com uma ideia.", accent: "#d2b27b", visual: "Uma ideia de construir.", companies: [] },
  { id: "first-link", chapter: "origin", shortAt: 8, title: "A primeira conexão", line: "Da visão nasce o movimento.", accent: "#d6b77e", visual: "Comércio, tecnologia e performance entram no mesmo fluxo.", companies: ["Tosi", "Jack it fit"] },
  { id: "experiences", chapter: "experience", shortAt: 15, title: "Experiências", line: "Pessoas transformam acesso em experiência.", accent: "#c59d74", visual: "Eventos e finanças digitais ampliam novas formas de conexão.", companies: ["Bilheking", "Instead"] },
  { id: "information", chapter: "origin", shortAt: 25, title: "A informação", line: "O que era físico aprende a operar em rede.", accent: "#cdb083", visual: "Informação, imóveis e inteligência cotidiana.", companies: ["Seu Jornaleiro", "Venti Imóveis"] },
  { id: "ventures", chapter: "future", shortAt: 34, title: "Ideias viram empresas", line: "Talento encontra estrutura. Ideias encontram escala.", accent: "#d0ad77", visual: "Novos negócios conectam inovação, educação e liberdade.", companies: ["Minvest", "Boase", "Avantyp"] },
  { id: "performance", chapter: "intelligence", shortAt: 43, title: "Dados, processos e performance", line: "Dados deixam de ser ruído e passam a orientar movimento.", accent: "#bfa779", visual: "Software, esporte e varejo operando em tempo real.", companies: ["Scoreking", "Volup", "Maia GO"] },
  { id: "cities", chapter: "future", shortAt: 55, title: "Cidades do futuro", line: "Infraestrutura inteligente começa por compreender pessoas e lugares.", accent: "#aeb58c", visual: "Habitação, gestão pública e trabalho conectados.", companies: ["Habitat X", "Iris", "SmartRH"] },
  { id: "commercial", chapter: "intelligence", shortAt: 65, title: "A máquina comercial", line: "Quando o fluxo ganha clareza, crescimento vira processo.", accent: "#d09c66", visual: "Leads, equipes e conversões em uma estrutura contínua.", companies: ["Pipex"] },
  { id: "lifestyle", chapter: "experience", shortAt: 74, title: "Lifestyle", line: "Tecnologia também cria presença, prazer e pertencimento.", accent: "#d6b06e", visual: "Hospitalidade, beleza e gastronomia em novas experiências.", companies: ["Tikal Beach Club", "Sun & Tan", "Abroo"] },
  { id: "health", chapter: "intelligence", shortAt: 82, title: "Saúde e infraestrutura", line: "Operações críticas pedem precisão, cuidado e continuidade.", accent: "#91b7aa", visual: "Saúde e energia traduzidas em sistemas confiáveis.", companies: ["Voluclinic", "Gaslee"] },
  { id: "tradition", chapter: "origin", shortAt: 92, title: "Tradição e nova economia", line: "O futuro não apaga a origem. Ele amplia sua voz.", accent: "#c89168", visual: "Da matéria artesanal à presença digital.", companies: ["13 de Maio", "Instaboost"] },
  { id: "content", chapter: "experience", shortAt: 101, title: "Conteúdo e destinos", line: "Histórias movem pessoas. Experiências movem territórios.", accent: "#b69d89", visual: "Criação e turismo conectando o Brasil ao mundo.", companies: ["Kinkora", "Spur"] },
  { id: "agro", chapter: "future", shortAt: 109, title: "Agronegócio", line: "No campo, inteligência também se mede em produtividade e permanência.", accent: "#9daf72", visual: "Tecnologia e dados cultivando o próximo ciclo.", companies: ["Agrovolup"] },
  { id: "the-maia", chapter: "intelligence", shortAt: 116, title: "Automação", line: "Algoritmos organizam velocidade, risco e decisão.", accent: "#c9aa72", visual: "Infraestrutura de negociação com tecnologia no centro.", companies: ["The Maia"] },
  { id: "connection", chapter: "universe", shortAt: 122, title: "Tudo se conecta", line: "Vinte e sete pontos. Uma estrutura em expansão.", accent: "#d8bd8e", visual: "Cada empresa mantém sua identidade. A visão cria o vínculo.", companies: [] },
  { id: "group", chapter: "universe", shortAt: 132, title: "O grupo", line: "São negócios diferentes. Mercados diferentes. Desafios diferentes.", accent: "#e2c99e", visual: "Mas uma mesma mentalidade.", companies: [] },
  { id: "future", chapter: "future", shortAt: 142, title: "O futuro", line: "Construir. Conectar. Transformar.", accent: "#e5ceaa", visual: "E continuar avançando.", companies: [] },
] as const;

export const ALL_MAIA_COMPANIES = DNA_MAIA_CUES.flatMap((cue) => cue.companies);
export const COMPANY_IDENTITIES: Record<string, { color: string; symbol: string }> = Object.fromEntries(ALL_MAIA_COMPANIES.map((company, index) => [company, { color: ["#d2b27b", "#80aeb5", "#b59bcb", "#a8b878"][index % 4], symbol: ["◈", "●", "◆", "✦", "○"][index % 5] }]));
export function getStoryDuration(_mode: StoryMode) { return DNA_MAIA_AUDIO.editorialDuration; }
export function getStoryAudio(_mode: StoryMode) { return DNA_MAIA_AUDIO.instrumental; }
export function getDnaMaiaCue(seconds: number, _mode: StoryMode = "full") { for (let index = DNA_MAIA_CUES.length - 1; index >= 0; index -= 1) if (seconds >= DNA_MAIA_CUES[index].shortAt) return DNA_MAIA_CUES[index]; return DNA_MAIA_CUES[0]; }
