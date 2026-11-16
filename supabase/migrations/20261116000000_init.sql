-- Xmas Tree Wrap-Up: registrations, trees, waitlist and the pickup-spot counter.
-- All tables have row level security on with no policies, so only the server
-- (using the Supabase secret key) can read or write them. The one thing the
-- public can call is spots_left(), which returns a single number.

create table public.settings (
  id boolean primary key default true check (id),
  capacity integer not null default 500 check (capacity >= 0),
  registration_open boolean not null default true,
  hold_minutes integer not null default 20 check (hold_minutes > 0)
);
insert into public.settings (id) values (true);

create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'expired', 'cancelled')),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  sms_opt_in boolean not null default false,
  amount_per_tree_cents integer not null check (amount_per_tree_cents >= 1500),
  tree_count integer not null check (tree_count between 1 and 10),
  total_cents integer not null check (total_cents >= 1500),
  stripe_payment_intent_id text unique,
  hold_expires_at timestamptz not null,
  paid_at timestamptz,
  cancelled_at timestamptz
);
create index registrations_status_idx on public.registrations (status);
create index registrations_email_idx on public.registrations (lower(email));

create table public.trees (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.registrations (id) on delete cascade,
  position integer not null default 1,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'cancelled', 'collected', 'missed')),
  address text not null,
  unit text,
  city text,
  postal_code text,
  note text,
  lat double precision,
  lng double precision,
  place_id text,
  address_verified boolean not null default false
);
create index trees_registration_idx on public.trees (registration_id);

create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text not null,
  address text
);
create unique index waitlist_email_idx on public.waitlist (lower(email));

alter table public.settings enable row level security;
alter table public.registrations enable row level security;
alter table public.trees enable row level security;
alter table public.waitlist enable row level security;

-- Trees that currently hold a pickup spot: paid ones, plus unpaid ones whose
-- checkout hold has not run out yet.
create or replace function public.spots_taken()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from public.trees t
  join public.registrations r on r.id = t.registration_id
  where t.status <> 'cancelled'
    and (
      r.status = 'paid'
      or (r.status = 'pending' and r.hold_expires_at > now())
    );
$$;

create or replace function public.spots_left()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when s.registration_open then greatest(s.capacity - public.spots_taken(), 0)
    else 0
  end
  from public.settings s
  where s.id;
$$;

-- Creates a pending registration and its trees in one step, but only if there
-- are enough spots left. The advisory lock makes two people checking out at
-- the same moment queue up, so the last spot cannot be sold twice.
create or replace function public.reserve_registration(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_trees jsonb := payload -> 'trees';
  v_count integer := jsonb_array_length(coalesce(payload -> 'trees', '[]'::jsonb));
  v_amount integer := (payload ->> 'amount_per_tree_cents')::integer;
  v_hold integer;
  v_id uuid;
  v_tree jsonb;
  v_pos integer := 0;
begin
  if v_count < 1 then
    raise exception 'NO_TREES';
  end if;

  perform pg_advisory_xact_lock(hashtext('xmas-wrapup-reserve'));

  if public.spots_left() < v_count then
    raise exception 'SOLD_OUT';
  end if;

  select hold_minutes into v_hold from public.settings where id;

  insert into public.registrations (
    first_name, last_name, email, phone, sms_opt_in,
    amount_per_tree_cents, tree_count, total_cents, hold_expires_at
  ) values (
    payload ->> 'first_name',
    payload ->> 'last_name',
    payload ->> 'email',
    payload ->> 'phone',
    coalesce((payload ->> 'sms_opt_in')::boolean, false),
    v_amount,
    v_count,
    v_amount * v_count,
    now() + make_interval(mins => v_hold)
  )
  returning id into v_id;

  for v_tree in select * from jsonb_array_elements(v_trees) loop
    v_pos := v_pos + 1;
    insert into public.trees (
      registration_id, position, address, unit, city, postal_code, note,
      lat, lng, place_id, address_verified
    ) values (
      v_id,
      v_pos,
      v_tree ->> 'address',
      nullif(v_tree ->> 'unit', ''),
      nullif(v_tree ->> 'city', ''),
      nullif(v_tree ->> 'postal_code', ''),
      nullif(v_tree ->> 'note', ''),
      (v_tree ->> 'lat')::double precision,
      (v_tree ->> 'lng')::double precision,
      nullif(v_tree ->> 'place_id', ''),
      coalesce((v_tree ->> 'address_verified')::boolean, false)
    );
  end loop;

  return v_id;
end;
$$;

revoke all on function public.spots_taken() from public, anon, authenticated;
revoke all on function public.reserve_registration(jsonb) from public, anon, authenticated;
revoke all on function public.spots_left() from public;
grant execute on function public.spots_left() to anon, authenticated, service_role;
grant execute on function public.spots_taken() to service_role;
grant execute on function public.reserve_registration(jsonb) to service_role;
