-- NaviOs Phase1 Database Schema
-- Run this in Supabase SQL Editor

create extension if not exists "pgcrypto";

-- ============================================================
-- Posts table
-- ============================================================
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
  status text not null default 'draft' check (status in ('draft', 'published', 'expired')),
  user_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists posts_status_idx on public.posts (status);
create index if not exists posts_user_id_idx on public.posts (user_id);
create index if not exists posts_expire_date_idx on public.posts (expire_date);

-- ============================================================
-- User profiles table (for role management)
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    'user'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ============================================================
-- Storage bucket for post images
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-images',
  'post-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.posts enable row level security;
alter table public.profiles enable row level security;

-- Posts: anyone can read published, non-expired posts
create policy "Published posts are viewable by everyone"
  on public.posts for select
  using (status = 'published' and expire_date >= current_date);

-- Posts: authenticated users can create their own posts
create policy "Authenticated users can create posts"
  on public.posts for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Posts: users can update their own posts
create policy "Users can update own posts"
  on public.posts for update
  to authenticated
  using (auth.uid() = user_id);

-- Posts: users can delete their own posts
create policy "Users can delete own posts"
  on public.posts for delete
  to authenticated
  using (auth.uid() = user_id);

-- Posts: admins can do everything
create policy "Admins have full access to posts"
  on public.posts for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Profiles: users can read their own profile
create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

-- Profiles: admins can view all profiles
create policy "Admins can view all profiles"
  on public.profiles for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Storage: anyone can view post images
create policy "Anyone can view post images"
  on storage.objects for select
  using (bucket_id = 'post-images');

-- Storage: authenticated users can upload post images
create policy "Authenticated users can upload post images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'post-images');
