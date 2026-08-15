# DNA Maia — guia de produção

## Experiência publicada

- A primeira visita abre uma escolha explícita entre a experiência de 75 segundos e o filme completo de 3:14. Esse gesto satisfaz as políticas de autoplay com som.
- O áudio é o relógio mestre. Texto, capítulos, empresas, progresso e encerramento derivam de `currentTime`.
- A versão curta apresenta as mesmas 26 empresas em oito cenas compactas; a completa usa os marcos da locução original.
- “Entrar no universo” encerra com fade, e “Rever experiência” permanece acessível no Mapa Vivo.
- A rota `/intro` abre o manifesto diretamente para campanhas, apresentações e QA.

## Linguagem audiovisual

O arco é: código → origem → inteligência → crescimento → experiência → território → futuro → universo. O vídeo trabalha em três profundidades: imagem, órbitas/partículas e tipografia. Versos usam movimentos lentos; entradas de ecossistema ganham expansão; o frame final entrega o usuário diretamente ao mapa.

As empresas são tratadas como ecossistemas, nunca como uma lista corrida:

1. Inteligência: Tosi, Volup, Scoreking, Instaboost e Abroo.
2. Crescimento: Avantyp, Pipex, SmartRH, Iris e Instead.
3. Experiência: Bilheking, Jack it fit, Spur, Kinkora, Voluclinic e Boase.
4. Território: Seu Jornaleiro, Venti Imóveis, Maia GO, Gaslee, Tikal Beach Club e Sun & Tan.
5. Futuro: Minvest, Habitat X, 13 de Maio e Agrovolup.

## Mídia e substituição editorial

Os seis capítulos estão congelados localmente em MP4/H.264 nas variantes 480p, 720p e 1080p, além de WebM/VP9 em 720p, todos a 25 fps, com pôster local e tratamento visual unificado. O player escolhe a resolução pela largura, densidade da tela, `saveData` e qualidade efetiva da conexão. Cada arquivo mantém área negativa para os títulos.

O player mantém apenas um vídeo ativo e pré-carrega o capítulo seguinte. Em erro, volta ao DNA procedural. A master `dna-maia-theme.mp3` contém voz, cama musical, fades, normalização e assinatura sonora; `dna-maia-theme-75s.mp3` é a edição curta sincronizada. Mixes mono e leves atendem celulares, `dna-maia-instrumental.mp3` permite usos sem locução, `dna-maia-sonic-logo.mp3` preserva a assinatura isolada e `dna-maia-voice-only.mp3` preserva a locução para futuras mixagens.

## Operação e acessibilidade

- Teclas: espaço pausa/continua, Escape entra no universo e setas navegam cinco segundos no filme completo.
- A aba oculta pausa a reprodução. `prefers-reduced-motion` elimina parallax e animações decorativas.
- Texto pode ser ocultado, o som pode ser silenciado e a experiência funciona com fallback visual.
- Eventos `maia_intro_started` e `maia_intro_finished` medem modo, conclusão, abandono e progresso.

## Checklist de publicação

1. Rodar `npm test`, `npm run lint` e `npm run build`.
2. Verificar 360×800, 390×844, 1366×768 e 1920×1080.
3. Testar bloqueio de áudio, falha de CDN, aba em segundo plano e redução de movimento.
4. Confirmar os 26 nomes e a pronúncia antes de substituir a master.
5. Publicar novos vídeos por feature flag/CDN, mantendo o fallback procedural.
