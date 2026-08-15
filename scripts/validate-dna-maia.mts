import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { ALL_MAIA_COMPANIES, COMPANY_IDENTITIES, DNA_MAIA_CUES, getDnaMaiaCue, getStoryDuration } from "../src/lib/dna-maia-theme.ts";

const expected = [
  "Bilheking", "Tosi", "Jack it fit", "Spur", "Volup", "Scoreking", "Instaboost", "Kinkora", "Abroo", "Voluclinic", "Avantyp", "Boase", "Venti Imóveis", "Instead", "Seu Jornaleiro", "Pipex", "SmartRH", "Iris", "Gaslee", "Maia GO", "Minvest", "Habitat X", "Tikal Beach Club", "Sun & Tan", "13 de Maio", "Agrovolup",
];

assert.equal(ALL_MAIA_COMPANIES.length, 26, "A timeline deve conter exatamente 26 empresas");
assert.deepEqual([...new Set(ALL_MAIA_COMPANIES)].sort(), [...expected].sort(), "A lista oficial deve estar integralmente representada");
assert.deepEqual(Object.keys(COMPANY_IDENTITIES).sort(), [...expected].sort(), "Cada empresa deve possuir identidade visual própria");
assert.equal(getStoryDuration("short"), 96, "O corte editorial deve preservar ritmo natural em 1min36");
assert.equal(getStoryDuration("full"), 96, "Não deve existir uma segunda faixa acelerada ou dessincronizada");

const chapters = ["code", "origin", "intelligence", "experience", "future", "universe"];
for (const chapter of chapters) {
  for (const quality of ["480", "720", "1080"]) {
    const path = `public/video/dna-maia/${chapter}-${quality}.mp4`;
    assert.ok(existsSync(path), `Variante adaptativa ausente: ${path}`);
    assert.ok(statSync(path).size > 100_000, `Variante adaptativa inválida: ${path}`);
  }
  for (const extension of ["mp4", "webm"]) {
    const path = `public/video/dna-maia/${chapter}-720.${extension}`;
    assert.ok(existsSync(path), `Mídia local ausente: ${path}`);
    assert.ok(statSync(path).size > 100_000, `Mídia local inválida: ${path}`);
  }
}
const playerSource = readFileSync("src/components/MaiaStoryIntro.tsx", "utf8");
assert.ok(!playerSource.includes("videos.pexels.com"), "O player não deve depender da Pexels em runtime");
assert.ok(!playerSource.includes("ik.imagekit.io"), "O fallback de DNA deve ser local");
assert.ok(playerSource.includes('getStoryAudio("short")'), "O player editorial deve usar a trilha instrumental em tempo natural");
assert.ok(!playerSource.includes('activateMode'), "A apresentação não deve expor escolhas técnicas de duração");
for (const audio of ["dna-maia-instrumental.mp3"]) {
  const path = `public/audio/${audio}`;
  assert.ok(existsSync(path) && statSync(path).size > 50_000, `Entrega de áudio ausente: ${audio}`);
}

for (const mode of ["short"] as const) {
  const key = "shortAt";
  let previous = -1;
  for (const cue of DNA_MAIA_CUES) {
    assert.ok(cue[key] > previous, `${key} deve ser estritamente crescente`);
    assert.equal(getDnaMaiaCue(cue[key], mode).id, cue.id, `O limite de ${cue.id} deve ativar a cena correta`);
    previous = cue[key];
  }
  assert.ok(previous < getStoryDuration(mode), `A última cena deve começar antes do fim em ${mode}`);
}

console.log("DNA Maia: timeline, durações e 26 empresas validadas.");
