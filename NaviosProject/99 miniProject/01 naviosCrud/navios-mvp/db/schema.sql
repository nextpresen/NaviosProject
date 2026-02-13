create extension if not exists "pgcrypto";

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  image_url text,
  latitude double precision not null,
  longitude double precision not null,
  event_date date not null,
  author_name text not null,
  expire_date date not null,
  status text not null check (status in ('draft', 'published', 'expired')),
  created_at timestamptz not null default now()
);

create index if not exists posts_created_at_idx on public.posts (created_at desc);

alter table if exists public.posts
  add column if not exists image_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-images',
  'post-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;
