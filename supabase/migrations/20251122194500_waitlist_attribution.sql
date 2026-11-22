-- Optional first-touch attribution on waitlist signups
alter table public.waitlist
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists utm_content text,
  add column if not exists referrer text,
  add column if not exists landing_path text;

create index if not exists waitlist_utm_source_idx
  on public.waitlist (utm_source)
  where utm_source is not null;