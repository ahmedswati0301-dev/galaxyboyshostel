-- Create settings table for global admin settings
create table if not exists settings (
  id int primary key,
  admin_email text,
  contact_phone text,
  late_fee_pct numeric,
  default_notice_days int
);

-- Ensure a default single row exists
insert into settings (id, admin_email, contact_phone, late_fee_pct, default_notice_days)
values (1, null, null, 0, 0)
on conflict (id) do nothing;
