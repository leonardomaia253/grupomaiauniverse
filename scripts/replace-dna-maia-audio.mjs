import { readFileSync, writeFileSync } from "node:fs";

const projects = [
  "projects/dna-maia-cinematic-youtube/index.html",
  "projects/dna-maia-cinematic-reels/index.html",
];

const music = '<audio data-hf-id="hf-ul7e" id="music-bed" src="assets/grupo-maia-anthem.m4a" data-start="0" data-duration="75" data-track-index="20" data-volume="0.82"></audio>';
const voice = '<audio data-hf-id="hf-z27i" id="narration" src="assets/grupo-maia-rhythmic-voice.wav" data-start="1.4" data-duration="53.176" data-track-index="21" data-volume="1" data-audio-group="voiceover" data-fx-chain="{&quot;version&quot;:1,&quot;nodes&quot;:[{&quot;type&quot;:&quot;highpass&quot;,&quot;id&quot;:&quot;vo-hp&quot;,&quot;params&quot;:{&quot;frequency&quot;:80,&quot;q&quot;:0.7}},{&quot;type&quot;:&quot;peaking&quot;,&quot;id&quot;:&quot;vo-clarity&quot;,&quot;label&quot;:&quot;Add Clarity&quot;,&quot;params&quot;:{&quot;frequency&quot;:3000,&quot;gain&quot;:2.5,&quot;q&quot;:1}},{&quot;type&quot;:&quot;compressor&quot;,&quot;id&quot;:&quot;vo-comp&quot;,&quot;params&quot;:{&quot;threshold&quot;:-20,&quot;ratio&quot;:3.5,&quot;attack&quot;:0.008,&quot;release&quot;:0.16}},{&quot;type&quot;:&quot;limiter&quot;,&quot;id&quot;:&quot;vo-limit&quot;,&quot;params&quot;:{&quot;threshold&quot;:-1}}]}"></audio>';

for (const file of projects) {
  let html = readFileSync(file, "utf8");
  html = html.replace(/<audio\b[^>]*\bid="music-bed"[^>]*><\/audio>/s, music);
  html = html.replace(/<audio\b[^>]*\bid="narration"[^>]*><\/audio>/s, voice);
  writeFileSync(file, html);
}
