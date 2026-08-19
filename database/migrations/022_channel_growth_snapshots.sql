-- Historique de croissance de chaîne (vues / abonnés / vidéos), un point réel par jour et
-- par chaîne consultée — jamais de rétro-remplissage inventé, l'historique se construit au
-- fil du temps à chaque fois qu'un abonné Pro/Business consulte une vidéo de cette chaîne.
create table if not exists channel_growth_snapshots (
  id bigint generated always as identity primary key,
  channel_id text not null,
  views bigint not null default 0,
  subscribers bigint not null default 0,
  video_count integer not null default 0,
  captured_on date not null default current_date,
  created_at timestamptz not null default now(),
  unique (channel_id, captured_on)
);

create index if not exists idx_channel_growth_channel
  on channel_growth_snapshots (channel_id, captured_on);

-- Accès exclusivement via le backend (clé service role) : la clé anon ne doit jamais
-- pouvoir lire/écrire cette table (voir l'écart RLS déjà corrigé en migration 016).
alter table channel_growth_snapshots enable row level security;
