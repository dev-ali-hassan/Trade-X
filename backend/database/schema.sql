create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  pair text not null,
  type text not null check (type in ('BUY', 'SELL')),
  entry_price numeric not null,
  exit_price numeric not null,
  stop_loss numeric not null,
  take_profit numeric not null,
  lot_size numeric not null,
  profit numeric not null,
  strategy text not null,
  notes text,
  image_url text,
  ai_analysis jsonb,
  emotion text,
  created_at timestamptz not null default now()
);

create table if not exists ai_analysis (
  id uuid primary key default gen_random_uuid(),
  trade_id uuid references trades(id) on delete cascade,
  trend text,
  support text,
  resistance text,
  pattern text,
  score numeric,
  recommendation text,
  created_at timestamptz not null default now()
);
