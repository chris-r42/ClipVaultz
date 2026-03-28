-- Profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text,
  avatar_url text,
  is_approved boolean not null default false,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Clips table
create table public.clips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  game text,
  cloudflare_video_id text not null,
  thumbnail_url text,
  duration integer, -- seconds
  views integer not null default 0,
  created_at timestamptz not null default now()
);

-- Auto-create profile on signup, pulling name + avatar from OAuth provider
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.clips enable row level security;

-- Profiles: users can read all approved profiles, update their own
create policy "Approved users can view profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_approved = true
    )
  );

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Admins can update any profile (for approval)
create policy "Admins can update any profile"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );

-- Clips: approved users can read all, users can insert/delete their own
create policy "Approved users can view clips"
  on public.clips for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_approved = true
    )
  );

create policy "Approved users can insert clips"
  on public.clips for insert
  with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_approved = true
    )
  );

create policy "Users can update own clips"
  on public.clips for update
  using (auth.uid() = user_id);

create policy "Users can delete own clips"
  on public.clips for delete
  using (auth.uid() = user_id);
