export const DNA_MAIA_AUDIO = {
  master: "/audio/dna-maia-theme.mp3",
  shortMaster: "/audio/dna-maia-theme-75s.mp3",
  mobileMaster: "/audio/dna-maia-theme-mobile.mp3",
  mobileShortMaster: "/audio/dna-maia-theme-75s-mobile.mp3",
  instrumental: "/audio/dna-maia-instrumental.mp3",
  sonicLogo: "/audio/dna-maia-sonic-logo.mp3",
  fallbackVoice: "/audio/grupo-lmf-intro.mp3",
  fallbackBed: "/audio/midnight-commit.mp3",
  fullDuration: 195.82,
  shortDuration: 75,
} as const;

export type StoryMode = "short" | "full";
export type StoryChapter = "code" | "origin" | "intelligence" | "experience" | "future" | "universe";

export type DnaMaiaCue = {
  id: string;
  chapter: StoryChapter;
  shortAt: number;
  fullAt: number;
  title: string;
  line: string;
  accent: string;
  visual: string;
  companies: readonly string[];
};

export const DNA_MAIA_CUES: readonly DnaMaiaCue[] = [
  { id: "pulse", chapter: "code", shortAt: 0, fullAt: 0, title: "O código", line: "Todo grupo nasce de um DNA.", accent: "#8ee7ff", visual: "Pulso, matéria e uma origem comum.", companies: [] },
  { id: "origin", chapter: "origin", shortAt: 8, fullAt: 15.4, title: "A origem", line: "Uma visão transforma ideia em movimento.", accent: "#a9f3d1", visual: "Da célula à cidade, intenção vira construção.", companies: [] },
  { id: "intelligence-a", chapter: "intelligence", shortAt: 19, fullAt: 49.52, title: "Inteligência", line: "Dados que enxergam. Tecnologia que aproxima.", accent: "#70b7ff", visual: "Circuitos, pessoas e decisões conectadas.", companies: ["Tosi", "Volup", "Scoreking", "Instaboost", "Abroo"] },
  { id: "intelligence-b", chapter: "intelligence", shortAt: 25, fullAt: 65.64, title: "Crescimento", line: "Ideias ganham fluxo, clareza e escala.", accent: "#9b8cff", visual: "Sinais tornam-se caminhos e caminhos tornam-se rede.", companies: ["Avantyp", "Pipex", "SmartRH", "Iris", "Instead"] },
  { id: "experience-a", chapter: "experience", shortAt: 44, fullAt: 115.28, title: "Experiência", line: "Movimento que atravessa produtos, pessoas e lugares.", accent: "#ff9c80", visual: "Corpo, saúde, cultura e encontros em movimento.", companies: ["Bilheking", "Jack it fit", "Spur", "Kinkora", "Voluclinic", "Boase"] },
  { id: "experience-b", chapter: "experience", shortAt: 53, fullAt: 137.44, title: "Território", line: "Onde cada encontro abre uma nova possibilidade.", accent: "#f1cf78", visual: "Cidade, mobilidade, energia e hospitalidade.", companies: ["Seu Jornaleiro", "Venti Imóveis", "Maia GO", "Gaslee", "Tikal Beach Club", "Sun & Tan"] },
  { id: "future", chapter: "future", shortAt: 60, fullAt: 156.96, title: "O futuro", line: "Capital, território e imaginação para o próximo ciclo.", accent: "#ffd66e", visual: "Patrimônio, agro e espaço desenham o amanhã.", companies: ["Minvest", "Habitat X", "13 de Maio", "Agrovolup"] },
  { id: "universe", chapter: "universe", shortAt: 67, fullAt: 175.48, title: "O universo", line: "Grupo Maia — um DNA, muitos mundos.", accent: "#ffffff", visual: "Todas as órbitas tornam-se um mapa vivo.", companies: [] },
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
  return mode === "short" ? DNA_MAIA_AUDIO.shortDuration : DNA_MAIA_AUDIO.fullDuration;
}

export function getStoryAudio(mode: StoryMode, mobile = false) {
  if (mobile) return mode === "short" ? DNA_MAIA_AUDIO.mobileShortMaster : DNA_MAIA_AUDIO.mobileMaster;
  return mode === "short" ? DNA_MAIA_AUDIO.shortMaster : DNA_MAIA_AUDIO.master;
}

export function getDnaMaiaCue(seconds: number, mode: StoryMode = "full") {
  const key = mode === "short" ? "shortAt" : "fullAt";
  for (let index = DNA_MAIA_CUES.length - 1; index >= 0; index -= 1) {
    if (seconds >= DNA_MAIA_CUES[index][key]) return DNA_MAIA_CUES[index];
  }
  return DNA_MAIA_CUES[0];
}
