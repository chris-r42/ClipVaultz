-- Comments table
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  clip_id uuid references public.clips(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.comments enable row level security;

create policy "Approved users can view comments"
  on public.comments for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_approved = true
    )
  );

create policy "Approved users can insert comments"
  on public.comments for insert
  with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_approved = true
    )
  );

create policy "Users can delete own comments"
  on public.comments for delete
  using (auth.uid() = user_id);

create policy "Admins can delete any comment"
  on public.comments for delete
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_admin = true
    )
  );
