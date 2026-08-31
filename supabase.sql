-- FNS Supabase schema (run in SQL Editor)
-- Friends-only app: anon key has full access (PIN gates editing in the UI).

create table if not exists public.games (
  id uuid primary key,
  title text not null,
  genres text[] not null default '{}',
  is_open_world boolean not null default false,
  year text not null default '',
  description text not null default '',
  image_url text not null default '',
  platforms jsonb not null default '{}'::jsonb,
  created_at bigint not null default 0
);

create table if not exists public.ratings (
  id uuid primary key,
  game_id text not null,
  user_id text not null,
  user_name text not null default '',
  gameplay real,
  story real,
  graphics real,
  background_music real,
  world_design real,
  exploration real,
  characters real,
  villain real,
  dlc real,
  multiplayer real,
  average real not null default 0,
  created_at bigint not null default 0,
  updated_at bigint not null default 0,
  unique (game_id, user_id)
);

create table if not exists public.settings (
  key text primary key,
  value text not null default ''
);

create table if not exists public.comments (
  id uuid primary key,
  game_id text not null,
  user_id text not null,
  user_name text not null default '',
  body text not null default '',
  parent_id uuid null,
  created_at bigint not null default 0,
  updated_at bigint not null default 0
);

create table if not exists public.critics (
  username text primary key,
  user_id text not null,
  display_name text not null default '',
  game_ids text[] not null default '{}',
  created_at bigint not null default 0,
  updated_at bigint not null default 0
);
create index if not exists critics_user_id_idx on public.critics (user_id);

alter table public.games enable row level security;
alter table public.ratings enable row level security;
alter table public.settings enable row level security;
alter table public.comments enable row level security;
alter table public.critics enable row level security;

drop policy if exists games_anon_all on public.games;
create policy games_anon_all on public.games for all to anon, authenticated using (true) with check (true);
drop policy if exists ratings_anon_all on public.ratings;
create policy ratings_anon_all on public.ratings for all to anon, authenticated using (true) with check (true);
drop policy if exists settings_anon_all on public.settings;
create policy settings_anon_all on public.settings for all to anon, authenticated using (true) with check (true);
drop policy if exists comments_anon_all on public.comments;
create policy comments_anon_all on public.comments for all to anon, authenticated using (true) with check (true);
drop policy if exists critics_anon_all on public.critics;
create policy critics_anon_all on public.critics for all to anon, authenticated using (true) with check (true);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.games to anon, authenticated;
grant select, insert, update, delete on public.ratings to anon, authenticated;
grant select, insert, update, delete on public.settings to anon, authenticated;
grant select, insert, update, delete on public.comments to anon, authenticated;
grant select, insert, update, delete on public.critics to anon, authenticated;

alter publication supabase_realtime add table public.games;
alter publication supabase_realtime add table public.ratings;
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.critics;

insert into public.games (id, title, genres, is_open_world, year, description, image_url, created_at) values
  ('00000000-0000-0000-0000-000000000001', 'Sekiro: Shadows Die Twice', array['Action RPG'], false, 2019, 'A brutal action RPG where you play as a shinobi fighting for revenge in a fractured Japan.', '', 1),
  ('00000000-0000-0000-0000-000000000002', 'Far Cry 3', array['FPS'], true, 2012, 'An open-world FPS set on a tropical island ruled by a charismatic warlord.', '', 2),
  ('00000000-0000-0000-0000-000000000003', 'Far Cry 4', array['FPS'], true, 2014, 'Open-world FPS in the Himalayan region of Kyrat, torn between a dictator and a rebellion.', '', 3),
  ('00000000-0000-0000-0000-000000000004', 'Far Cry 5', array['FPS'], true, 2018, 'Open-world FPS in Hope County, Montana, fighting against a fanatical doomsday cult.', '', 4),
  ('00000000-0000-0000-0000-000000000005', 'Far Cry 6', array['FPS'], true, 2021, 'Open-world FPS on the island nation of Yara, leading a guerrilla revolution.', '', 5),
  ('00000000-0000-0000-0000-000000000006', 'Battlefield 1', array['FPS'], false, 2016, 'A World War I FPS with massive combined-arms warfare.', '', 6),
  ('00000000-0000-0000-0000-000000000007', 'Battlefield 4', array['FPS'], false, 2013, 'Modern military FPS focused on large-scale multiplayer battles.', '', 7),
  ('00000000-0000-0000-0000-000000000008', 'Battlefield V', array['FPS'], false, 2018, 'World War II FPS with squad-focused multiplayer.', '', 8),
  ('00000000-0000-0000-0000-000000000009', 'Battlefield 2042', array['FPS'], false, 2021, 'Near-future FPS with all-out warfare and massive maps.', '', 9),
  ('00000000-0000-0000-0000-000000000010', 'Call of Duty: Modern Warfare', array['FPS'], false, 2019, 'Tactical modern FPS with a gritty campaign and fast multiplayer.', '', 10),
  ('00000000-0000-0000-0000-000000000011', 'Call of Duty: Warzone', array['Battle Royale'], false, 2020, 'Free-to-play battle royale in the Modern Warfare universe.', '', 11),
  ('00000000-0000-0000-0000-000000000012', 'Elden Ring', array['Action RPG'], true, 2022, 'An epic open-world Souls-like in a vast dark fantasy world by FromSoftware.', '', 12),
  ('00000000-0000-0000-0000-000000000013', 'Hollow Knight', array['Metroidvania'], false, 2017, 'A hand-drawn metroidvania through the ruined kingdom of Hallownest.', '', 13),
  ('00000000-0000-0000-0000-000000000014', 'Silksong', array['Metroidvania'], false, '', 'The anticipated sequel to Hollow Knight, following Hornet through the kingdom of Pharloom.', '', 14),
  ('00000000-0000-0000-0000-000000000015', 'Dead Cells', array['Roguelike'], false, 2018, 'A fast-paced roguelike-metroidvania with ever-changing levels.', '', 15)
on conflict (id) do nothing;
