create extension if not exists pgcrypto;

create table if not exists users (
    id uuid primary key default gen_random_uuid(),
    email text not null unique,
    password_hash text not null,
    role text not null check (role in ('cutting_supervisor', 'cutting_verifier', 'sewing_supervisor')),
    full_name text not null,
    created_at timestamptz not null default now()
);

create table if not exists recipes (
    id uuid primary key default gen_random_uuid(), recipe_code text not null unique,
    name text not null, category text not null, std_fabric_yards numeric(10, 2) not null check (std_fabric_yards > 0),
    wastage_cap numeric(5, 2) not null check (wastage_cap >= 0), created_at timestamptz not null default now()
);

create table if not exists recipe_components (
    id uuid primary key default gen_random_uuid(), recipe_id uuid not null references recipes(id) on delete cascade,
    component_name text not null, pieces_per_garment integer not null check (pieces_per_garment > 0), image_url text,
    unique (recipe_id, component_name)
);

create table if not exists cutting_orders (
    id uuid primary key default gen_random_uuid(), order_no text not null unique, recipe_id uuid not null references recipes(id),
    target_qty integer not null check (target_qty > 0), fabric_roll_id text not null,
    actual_fabric_yds numeric(10, 2) not null check (actual_fabric_yds > 0), expected_fabric_yds numeric(10, 2) not null check (expected_fabric_yds > 0),
    status text not null default 'PENDING_VERIFICATION' check (status in ('CUTTING_IN_PROGRESS', 'PENDING_VERIFICATION', 'REJECTED', 'VERIFIED')),
    created_by uuid not null references users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

alter table public.cutting_orders
    add column if not exists expected_fabric_yds numeric(10, 2);

insert into users (id, email, password_hash, role, full_name)
select seed.id, seed.email, seed.password_hash, seed.role::user_role, seed.full_name
from (values
    ('00000000-0000-0000-0000-000000000001'::uuid, 'maya@apparelflow.demo', 'demo', 'cutting_supervisor', 'Maya Fernando'),
    ('00000000-0000-0000-0000-000000000002'::uuid, 'nadia@apparelflow.demo', 'demo', 'cutting_verifier', 'Nadia Perera'),
    ('00000000-0000-0000-0000-000000000003'::uuid, 'ravi@apparelflow.demo', 'demo', 'sewing_supervisor', 'Ravi Silva')
) as seed(id, email, password_hash, role, full_name)
where not exists (select 1 from users existing where existing.id = seed.id or existing.email = seed.email);

insert into recipes (recipe_code, name, category, std_fabric_yards, wastage_cap)
select seed.recipe_code, seed.name, seed.category, seed.std_fabric_yards, seed.wastage_cap
from (values
    ('REC-BL01', 'Casual Blouse', 'Blouse', 1.80::numeric, 5.00::numeric),
    ('REC-CT02', 'Crop Top', 'Crop Top', 1.10::numeric, 8.00::numeric)
) as seed(recipe_code, name, category, std_fabric_yards, wastage_cap)
where not exists (select 1 from recipes existing where existing.recipe_code = seed.recipe_code);

insert into recipe_components (recipe_id, component_name, pieces_per_garment)
select r.id, c.component_name, c.pieces_per_garment
from (values
    ('REC-BL01', 'Front Body Panel', 1), ('REC-BL01', 'Back Body Panel', 1), ('REC-BL01', 'Sleeves (Left & Right)', 2),
    ('REC-BL01', 'Collar & Stand', 1), ('REC-BL01', 'Sleeve Cuffs', 2), ('REC-CT02', 'Front Chest Panel', 1),
    ('REC-CT02', 'Back Support Panel', 1), ('REC-CT02', 'Neck Binding Strip', 1), ('REC-CT02', 'Hem Elastic Casing', 1),
    ('REC-CT02', 'Side Strap Accents', 2)
) as c(recipe_code, component_name, pieces_per_garment)
join recipes r on r.recipe_code = c.recipe_code
where not exists (
        select 1
        from recipe_components existing
        where existing.recipe_id = r.id
            and existing.component_name = c.component_name
);

-- Demo access for the publishable Supabase key used by the local app.
-- Replace these policies with authenticated, role-aware policies before production.
grant usage on schema public to anon, authenticated;
grant select on public.recipes, public.recipe_components to anon, authenticated;
grant select, insert, update on public.cutting_orders to anon, authenticated;
grant select on public.users to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

alter table public.recipes enable row level security;
alter table public.recipe_components enable row level security;
alter table public.cutting_orders enable row level security;
alter table public.users enable row level security;

drop policy if exists "demo read recipes" on public.recipes;
create policy "demo read recipes" on public.recipes
    for select to anon, authenticated using (true);

drop policy if exists "demo read recipe components" on public.recipe_components;
create policy "demo read recipe components" on public.recipe_components
    for select to anon, authenticated using (true);

drop policy if exists "demo read users" on public.users;
create policy "demo read users" on public.users
    for select to anon, authenticated using (true);

drop policy if exists "demo read and create orders" on public.cutting_orders;
create policy "demo read and create orders" on public.cutting_orders
    for all to anon, authenticated using (true) with check (true);