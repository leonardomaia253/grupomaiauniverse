export const DNA_MAIA_AUDIO = {
  instrumental: "/audio/dna-maia-instrumental.mp3",
  editorialDuration: 96,
  shortDuration: 96,
} as const;

export type StoryMode = "short" | "full";
export type StoryChapter = "code" | "origin" | "intelligence" | "experience" | "future" | "universe";

export type DnaMaiaCue = {
  id: string;
  chapter: StoryChapter;
  shortAt: number;
  title: string;
  line: string;
  accent: string;
  visual: string;
  companies: readonly string[];
};

export const DNA_MAIA_CUES: readonly DnaMaiaCue[] = [
  { id: "pulse", chapter: "code", shortAt: 0, title: "Princípio", line: "Uma origem. Diferentes maneiras de construir.", accent: "#b59a70", visual: "O Grupo Maia começa onde visão e execução se encontram.", companies: [] },
  { id: "origin", chapter: "origin", shortAt: 12, title: "Trajetória", line: "Ideias ganham forma quando encontram direção.", accent: "#c3aa82", visual: "Cada negócio responde a uma necessidade real — com autonomia e propósito comum.", companies: [] },
  { id: "intelligence-a", chapter: "intelligence", shortAt: 25, title: "Tecnologia e inteligência", line: "Decisões melhores começam por compreender melhor.", accent: "#af9c7d", visual: "Dados, software e estratégia a serviço de relações mais inteligentes.", companies: ["Tosi", "Volup", "Scoreking", "Instaboost", "Abroo"] },
  { id: "intelligence-b", chapter: "intelligence", shortAt: 38, title: "Operação e crescimento", line: "Clareza para operar. Estrutura para avançar.", accent: "#ad9670", visual: "Negócios diferentes, conectados pela capacidade de transformar complexidade em movimento.", companies: ["Avantyp", "Pipex", "SmartRH", "Iris", "Instead"] },
  { id: "experience-a", chapter: "experience", shortAt: 51, title: "Saúde e experiência", line: "O valor de uma empresa aparece na vida das pessoas.", accent: "#b28e72", visual: "Cuidado, bem-estar, cultura e experiências pensadas para permanecer.", companies: ["Bilheking", "Jack it fit", "Spur", "Kinkora", "Voluclinic", "Boase"] },
  { id: "experience-b", chapter: "experience", shortAt: 64, title: "Território e hospitalidade", line: "Presença também se constrói em lugares.", accent: "#b29a73", visual: "Cidade, mobilidade, energia e hospitalidade reunidas em uma mesma visão de futuro.", companies: ["Seu Jornaleiro", "Venti Imóveis", "Maia GO", "Gaslee", "Tikal Beach Club", "Sun & Tan"] },
  { id: "future", chapter: "future", shortAt: 77, title: "Capital e futuro", line: "Construir hoje é ampliar o que amanhã poderá existir.", accent: "#baa073", visual: "Patrimônio, agro e novos espaços para o próximo ciclo do grupo.", companies: ["Minvest", "Habitat X", "13 de Maio", "Agrovolup"] },
  { id: "universe", chapter: "universe", shortAt: 89, title: "Grupo Maia", line: "Um grupo. Vinte e seis empresas. Uma visão de longo prazo.", accent: "#d8c29d", visual: "Conheça o mapa vivo de um ecossistema em construção.", companies: [] },
] as const;

export const ALL_MAIA_COMPANIES = DNA_MAIA_CUES.flatMap((cue) => cue.companies);

export const COMPANY_IDENTITIES: Record<string, { color: string; symbol: string }> = {
  Tosi: { color: "#4f8cff", symbol: "◈" }, Volup: { color: "#a78bfa", symbol: "●" }, Scoreking: { color: "#f6c85f", symbol: "◆" }, Instaboost: { color: "#ff6b9d", symbol: "✦" }, Abroo: { color: "#55d6be", symbol: "○" },
  Avantyp: { color: "#7dd3fc", symbol: "△" }, Pipex: { color: "#fb923c", symbol: "⌁" }, SmartRH: { color: "#86efac", symbol: "◇" }, Iris: { color: "#c4b5fd", symbol: "◉" }, Instead: { color: "#fda4af", symbol: "□" },
  Bilheking: { color: "#8b5cf6", symbol: "✧" }, "Jack it fit": { color: "#ef4444", symbol: "▲" }, Spur: { color: "#38bdf8", symbol: "➜" }, Kinkora: { color: "#f472b6", symbol: "∞" }, Voluclinic: { color: "#2dd4bf", symbol: "✚" }, Boase: { color: "#fbbf24", symbol: "◎" },
  "Seu Jornaleiro": { color: "#e879f9", symbol: "▤" }, "Venti Imóveis": { color: "#60a5fa", symbol: "⌂" }, "Maia GO": { color: "#34d399", symbol: "➤" }, Gaslee: { color: "#f97316", symbol: "◐" }, "Tikal Beach Club": { color: "#22d3ee", symbol: "≈" }, "Sun & Tan": { color: "#fde047", symbol: "☼" },
  Minvest: { color: "#cbd5e1", symbol: "⬡" }, "Habitat X": { color: "#93c5fd", symbol: "⌗" }, "13 de Maio": { color: "#fca5a5", symbol: "XIII" }, Agrovolup: { color: "#84cc16", symbol: "❖" },
};

export function getStoryDuration(mode: StoryMode) {
  void mode;
  return DNA_MAIA_AUDIO.editorialDuration;
}

export function getStoryAudio(mode: StoryMode) {
  void mode;
  return DNA_MAIA_AUDIO.instrumental;
}

export function getDnaMaiaCue(seconds: number, mode: StoryMode = "full") {
  void mode;
  for (let index = DNA_MAIA_CUES.length - 1; index >= 0; index -= 1) {
    if (seconds >= DNA_MAIA_CUES[index].shortAt) return DNA_MAIA_CUES[index];
  }
  return DNA_MAIA_CUES[0];
}
