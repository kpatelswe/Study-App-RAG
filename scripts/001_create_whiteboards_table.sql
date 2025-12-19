-- Create whiteboards table to store user whiteboard data
create table if not exists public.whiteboards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled Whiteboard',
  excalidraw_data jsonb not null default '{"elements": [], "appState": {}, "files": {}}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.whiteboards enable row level security;

-- Drop existing policies if they exist (safe re-run)
drop policy if exists "Users can view their own whiteboards" on public.whiteboards;
drop policy if exists "Users can insert their own whiteboards" on public.whiteboards;
drop policy if exists "Users can update their own whiteboards" on public.whiteboards;
drop policy if exists "Users can delete their own whiteboards" on public.whiteboards;

-- RLS Policies: Users can only access their own whiteboards
create policy "Users can view their own whiteboards"
  on public.whiteboards for select
  using (auth.uid() = user_id);

create policy "Users can insert their own whiteboards"
  on public.whiteboards for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own whiteboards"
  on public.whiteboards for update
  using (auth.uid() = user_id);

create policy "Users can delete their own whiteboards"
  on public.whiteboards for delete
  using (auth.uid() = user_id);

-- Create updated_at trigger
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

-- Drop existing trigger if exists (safe re-run)
drop trigger if exists on_whiteboard_updated on public.whiteboards;

create trigger on_whiteboard_updated
  before update on public.whiteboards
  for each row
  execute function public.handle_updated_at();
