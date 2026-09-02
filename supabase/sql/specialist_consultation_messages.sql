create extension if not exists pgcrypto;

create table if not exists public.specialist_consultation_messages (
  id uuid primary key default gen_random_uuid(),
  patient_user_id uuid not null references auth.users(id) on delete cascade,
  specialist_connection_id text not null,
  direction text not null check (
    direction in ('patient_to_specialist', 'specialist_to_patient')
  ),
  message text not null check (length(trim(message)) > 0),
  telegram_message_id text,
  reply_to_telegram_message_id text,
  created_at timestamptz not null default now()
);

create index if not exists specialist_consultation_messages_patient_idx
  on public.specialist_consultation_messages (patient_user_id, created_at);

create index if not exists specialist_consultation_messages_telegram_idx
  on public.specialist_consultation_messages (
    specialist_connection_id,
    telegram_message_id
  )
  where telegram_message_id is not null;

alter table public.specialist_consultation_messages enable row level security;

grant select on public.specialist_consultation_messages to authenticated;

drop policy if exists "Patients can read their specialist consultation messages"
  on public.specialist_consultation_messages;

create policy "Patients can read their specialist consultation messages"
  on public.specialist_consultation_messages
  for select
  using (auth.uid() = patient_user_id);

do $$
begin
  alter publication supabase_realtime
    add table public.specialist_consultation_messages;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;

notify pgrst, 'reload schema';
