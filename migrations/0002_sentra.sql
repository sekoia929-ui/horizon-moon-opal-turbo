create table if not exists market_snapshots (
  id serial primary key,
  asset text not null,
  ts timestamptz not null default now(),
  price double precision not null,
  volume double precision not null,
  change_24h double precision not null
);
create index if not exists market_snapshots_asset_ts_idx
  on market_snapshots (asset, ts desc);

create table if not exists sentiment_snapshots (
  id serial primary key,
  asset text not null,
  window_key text not null,
  ts timestamptz not null default now(),
  score double precision not null,
  ma15 double precision not null,
  ma1h double precision not null,
  ma24h double precision not null,
  social_volume integer not null,
  bullish_share double precision not null
);
create index if not exists sentiment_snapshots_asset_ts_idx
  on sentiment_snapshots (asset, ts desc);

create table if not exists social_posts (
  id text primary key,
  asset text not null,
  author text not null,
  handle text not null,
  body text not null,
  score double precision not null,
  label text not null,
  reach integer not null,
  source text not null,
  ts timestamptz not null
);
create index if not exists social_posts_asset_ts_idx
  on social_posts (asset, ts desc);

create table if not exists alert_events (
  id text primary key,
  asset text not null,
  kind text not null,
  message text not null,
  severity text not null,
  ts timestamptz not null default now()
);
create index if not exists alert_events_ts_idx
  on alert_events (ts desc);
