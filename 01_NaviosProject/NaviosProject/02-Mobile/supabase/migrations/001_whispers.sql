-- Whispers table (24h ephemeral messages)
create table if not exists whispers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null check (char_length(content) between 1 and 500),
  latitude double precision not null,
  longitude double precision not null,
  area_name text not null default '',
  location geography(Point, 4326),
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '24 hours')
);

-- Auto-populate location column
create or replace function set_whisper_location()
returns trigger as $$
begin
  new.location := st_point(new.longitude, new.latitude)::geography;
  return new;
end;
$$ language plpgsql;

create trigger whisper_location_trigger
  before insert or update on whispers
  for each row execute function set_whisper_location();

-- Whisper replies
create table if not exists whisper_replies (
  id uuid primary key default gen_random_uuid(),
  whisper_id uuid references whispers(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null check (char_length(content) between 1 and 500),
  created_at timestamptz default now()
);

-- Whisper reactions (one per user per type per whisper)
create table if not exists whisper_reactions (
  id uuid primary key default gen_random_uuid(),
  whisper_id uuid references whispers(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  reaction_type text not null check (reaction_type in ('thanks','useful','wantToGo','funny','agree')),
  created_at timestamptz default now(),
  unique(whisper_id, user_id, reaction_type)
);

-- RPC to get nearby whispers (only non-expired)
create or replace function get_nearby_whispers(
  user_lat double precision,
  user_lng double precision,
  radius_meters double precision default 500
)
returns table (
  id uuid,
  distance_meters double precision
)
language sql stable
as $$
  select
    w.id,
    st_distance(w.location, st_point(user_lng, user_lat)::geography) as distance_meters
  from whispers w
  where w.expires_at > now()
    and st_dwithin(w.location, st_point(user_lng, user_lat)::geography, radius_meters)
  order by distance_meters asc;
$$;

-- RLS
alter table whispers enable row level security;
alter table whisper_replies enable row level security;
alter table whisper_reactions enable row level security;

-- Everyone can read non-expired whispers
create policy "read_whispers" on whispers for select using (expires_at > now());
create policy "insert_whispers" on whispers for insert with check (auth.uid() = user_id);
create policy "delete_own_whispers" on whispers for delete using (auth.uid() = user_id);

create policy "read_replies" on whisper_replies for select using (true);
create policy "insert_replies" on whisper_replies for insert with check (auth.uid() = user_id);

create policy "read_reactions" on whisper_reactions for select using (true);
create policy "insert_reactions" on whisper_reactions for insert with check (auth.uid() = user_id);
create policy "delete_own_reactions" on whisper_reactions for delete using (auth.uid() = user_id);

-- Indexes
create index if not exists idx_whispers_location on whispers using gist (location);
create index if not exists idx_whispers_expires on whispers (expires_at);
create index if not exists idx_whisper_replies_whisper on whisper_replies (whisper_id);
create index if not exists idx_whisper_reactions_whisper on whisper_reactions (whisper_id);
