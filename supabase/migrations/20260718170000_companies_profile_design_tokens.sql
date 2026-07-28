-- ============================================================
-- Maia Universe - Company profile/design tokens
-- ============================================================

create table if not exists public.companies_profile (
  username text primary key,
  display_name text not null,
  sector text not null default 'Ecossistema Maia',
  description text not null default 'Empresa conectada ao campo orbital do Grupo Maia.',
  brand_color text not null,
  texture text not null default 'ice',
  planet_scale numeric(5,2) not null default 1.00,
  priority integer not null default 0,
  health_score integer not null default 100 check (health_score between 0 and 100),
  website_url text,
  repository_url text,
  updated_at timestamptz not null default now()
);

alter table public.companies_profile enable row level security;

drop policy if exists "companies_profile_read_public" on public.companies_profile;
create policy "companies_profile_read_public"
  on public.companies_profile
  for select
  using (true);

create index if not exists idx_companies_profile_priority
  on public.companies_profile (priority desc, display_name asc);

insert into public.companies_profile
  (username, display_name, sector, description, brand_color, texture, planet_scale, priority, health_score, repository_url)
values
  ('bilheking', 'Bilheking', 'Entretenimento e bilheteria', 'Motor comercial do ecossistema, conectado a vendas, eventos e crescimento.', '#7c3aed', 'aurora', 1.42, 100, 100, 'https://github.com/bilheking'),
  ('volup-ai', 'Volup AI', 'Inteligencia artificial', 'Camada de IA aplicada a produtos, operacao e automacao do Grupo Maia.', '#10b981', 'forest', 1.42, 98, 100, 'https://github.com/volup-ai'),
  ('spur', 'Spur', 'Performance e crescimento', 'Planeta de energia vermelha, orientado a tracao e execucao.', '#ef233c', 'ember', 1.10, 90, 100, 'https://github.com/spur'),
  ('tosi', 'Tosi', 'Produto digital', 'Operacao azul, focada em produto, tecnologia e confiabilidade.', '#2563eb', 'ocean', 1.06, 88, 100, 'https://github.com/tosi'),
  ('jack-it-fit', 'Jack it fit', 'Saude e fitness', 'Planeta obsidiana, denso e disciplinado, ligado a saude e recorrencia.', '#111111', 'obsidian', 1.03, 86, 100, 'https://github.com/jack-it-fit'),
  ('seu-jornaleiro', 'Seu Jornaleiro', 'Midia e distribuicao', 'Orbita laranja para conteudo, distribuicao e presenca local.', '#f97316', 'solar', 1.00, 84, 100, 'https://github.com/seu-jornaleiro'),
  ('cattlecontrol', 'CattleControl', 'Agro e gestao', 'Planeta verde de controle, campo, dados e operacao produtiva.', '#16a34a', 'forest', 1.00, 82, 100, 'https://github.com/cattlecontrol'),
  ('iris', 'Iris', 'Visao e inteligencia', 'Planeta amarelo, ligado a leitura, percepcao e clareza operacional.', '#facc15', 'solar', 1.00, 80, 100, 'https://github.com/iris'),
  ('kinkora', 'Kinkora', 'Experiencia e comunidade', 'Planeta rosa de relacao, marca e experiencia.', '#ec4899', 'rose', 1.00, 78, 100, 'https://github.com/kinkora'),
  ('avantyp', 'Avantyp', 'Estrategia e tecnologia', 'Planeta vermelho escuro, compacto e estrategico.', '#7f1d1d', 'ember', 1.00, 76, 100, 'https://github.com/avantyp'),
  ('boase', 'Boase', 'Operacao e servicos', 'Planeta azul claro, leve, orientado a servicos e conexoes.', '#38bdf8', 'ice', 1.00, 74, 100, 'https://github.com/boase')
on conflict (username) do update set
  display_name = excluded.display_name,
  sector = excluded.sector,
  description = excluded.description,
  brand_color = excluded.brand_color,
  texture = excluded.texture,
  planet_scale = excluded.planet_scale,
  priority = excluded.priority,
  health_score = excluded.health_score,
  repository_url = excluded.repository_url,
  updated_at = now();
