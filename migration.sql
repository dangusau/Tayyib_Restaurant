-- Run this entire file in the Supabase SQL editor for a fresh project.
-- It creates all tables, RLS policies, and the required RPC functions.

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Users (custom profile linked to auth.users)
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text not null,
  role text not null check (role in ('MD', 'Manager', 'NMD')),
  restaurant_id uuid,
  is_active boolean default true,
  avatar_url text,
  phone text,
  created_by uuid references users(id),
  created_at timestamp default now(),
  updated_at timestamp default now(),
  last_login timestamp
);

-- Restaurants
create table restaurants (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  owner_id uuid not null references users(id),
  location text,
  phone text,
  email text,
  established_date date,
  currency text default 'NGN',
  timezone text default 'Africa/Lagos',
  settings jsonb,
  is_active boolean default true,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Transactions
create table transactions (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  transaction_date date not null,
  pos_total decimal(15,2) not null default 0,
  meal_tickets integer not null default 0,
  cash_received decimal(15,2) not null default 0,
  previous_balance decimal(15,2) not null default 0,
  total_spent decimal(15,2) not null default 0,
  cash_balance decimal(15,2) generated always as (cash_received + previous_balance - total_spent) stored,
  notes text,
  created_by uuid not null references users(id),
  created_at timestamp default now(),
  updated_at timestamp default now(),
  unique(restaurant_id, transaction_date, created_by)
);

-- Purchase Items
create table purchase_items (
  id uuid primary key default uuid_generate_v4(),
  transaction_id uuid not null references transactions(id) on delete cascade,
  item_name text not null,
  quantity decimal(10,3) not null,
  unit text not null default 'pieces' check (unit in ('pieces','kg','carton','dozen','pack')),
  unit_price decimal(15,2) not null,
  total_price decimal(15,2) generated always as (quantity * unit_price) stored,
  supplier text,
  category text,
  notes text,
  created_at timestamp default now()
);

-- Expenses
create table expenses (
  id uuid primary key default uuid_generate_v4(),
  transaction_id uuid not null references transactions(id) on delete cascade,
  description text not null,
  amount decimal(15,2) not null,
  category text not null check (category in ('supplies', 'utilities', 'maintenance', 'staff', 'other')),
  payment_method text check (payment_method in ('cash', 'bank_transfer', 'check', 'card', 'other')),
  vendor text,
  receipt_url text,
  notes text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Audit logs
create table audit_logs (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  user_id uuid not null references users(id),
  action text,
  entity_type text,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  changes jsonb,
  created_at timestamp default now()
);

-- Indexes
create index idx_transactions_restaurant_date on transactions(restaurant_id, transaction_date);
create index idx_transactions_created_by on transactions(created_by);
create index idx_purchase_items_transaction on purchase_items(transaction_id);
create index idx_expenses_transaction on expenses(transaction_id);
create index idx_expenses_category on expenses(category);
create index idx_users_restaurant on users(restaurant_id);

-- Row Level Security
alter table users enable row level security;
alter table restaurants enable row level security;
alter table transactions enable row level security;
alter table purchase_items enable row level security;
alter table expenses enable row level security;
alter table audit_logs enable row level security;

-- Helper: get restaurant of current user
create or replace function get_user_restaurant()
returns uuid
language sql
stable
security definer
as $$
  select restaurant_id from users where id = auth.uid();
$$;

-- RLS policies for users
create policy "Users can see own profile"
  on users for select
  using (id = auth.uid() or exists (select 1 from users where id = auth.uid() and role = 'MD'));

create policy "MD can manage users"
  on users for all
  using (exists (select 1 from users where id = auth.uid() and role = 'MD'))
  with check (exists (select 1 from users where id = auth.uid() and role = 'MD'));

-- RLS for restaurants
create policy "Restaurant access"
  on restaurants for select
  using (
    exists (select 1 from users where id = auth.uid() and restaurant_id = restaurants.id)
    or (select role from users where id = auth.uid()) = 'MD'
  );

-- RLS for transactions
create policy "MD full access"
  on transactions for all
  using ((select role from users where id = auth.uid()) = 'MD')
  with check ((select role from users where id = auth.uid()) = 'MD');

create policy "Manager own transactions"
  on transactions for all
  using (
    (select role from users where id = auth.uid()) = 'Manager'
    and created_by = auth.uid()
  )
  with check (
    (select role from users where id = auth.uid()) = 'Manager'
    and created_by = auth.uid()
  );

create policy "NMD read only"
  on transactions for select
  using ((select role from users where id = auth.uid()) = 'NMD');

-- RLS for purchase_items (via transaction ownership)
create policy "Access via transaction"
  on purchase_items for all
  using (
    exists (
      select 1 from transactions t
      where t.id = purchase_items.transaction_id
      and (
        ((select role from users where id = auth.uid()) = 'MD')
        or ((select role from users where id = auth.uid()) = 'Manager' and t.created_by = auth.uid())
        or ((select role from users where id = auth.uid()) = 'NMD')
      )
    )
  );

-- RLS for expenses (via transaction ownership)
create policy "Access via transaction"
  on expenses for all
  using (
    exists (
      select 1 from transactions t
      where t.id = expenses.transaction_id
      and (
        ((select role from users where id = auth.uid()) = 'MD')
        or ((select role from users where id = auth.uid()) = 'Manager' and t.created_by = auth.uid())
        or ((select role from users where id = auth.uid()) = 'NMD')
      )
    )
  );

-- Function for dashboard grouping
create or replace function get_daily_data(
  p_restaurant_id uuid,
  p_start_date date,
  p_end_date date,
  p_group_by text default 'day'
)
returns table(
  period date,
  revenue decimal(15,2),
  expenses decimal(15,2),
  profit decimal(15,2),
  tickets integer
) language plpgsql as $$
begin
  if p_group_by = 'day' then
    return query select
      t.transaction_date,
      coalesce(sum(t.pos_total),0),
      coalesce(sum(t.total_spent),0),
      coalesce(sum(t.pos_total - t.total_spent),0),
      coalesce(sum(t.meal_tickets),0)
    from transactions t
    where t.restaurant_id = p_restaurant_id
      and t.transaction_date between p_start_date and p_end_date
    group by t.transaction_date
    order by t.transaction_date;
  elsif p_group_by = 'month' then
    return query select
      date_trunc('month', t.transaction_date)::date,
      coalesce(sum(t.pos_total),0),
      coalesce(sum(t.total_spent),0),
      coalesce(sum(t.pos_total - t.total_spent),0),
      coalesce(sum(t.meal_tickets),0)
    from transactions t
    where t.restaurant_id = p_restaurant_id
      and t.transaction_date between p_start_date and p_end_date
    group by date_trunc('month', t.transaction_date)
    order by 1;
  elsif p_group_by = 'quarter' then
    return query select
      date_trunc('quarter', t.transaction_date)::date,
      coalesce(sum(t.pos_total),0),
      coalesce(sum(t.total_spent),0),
      coalesce(sum(t.pos_total - t.total_spent),0),
      coalesce(sum(t.meal_tickets),0)
    from transactions t
    where t.restaurant_id = p_restaurant_id
      and t.transaction_date between p_start_date and p_end_date
    group by date_trunc('quarter', t.transaction_date)
    order by 1;
  else -- year
    return query select
      date_trunc('year', t.transaction_date)::date,
      coalesce(sum(t.pos_total),0),
      coalesce(sum(t.total_spent),0),
      coalesce(sum(t.pos_total - t.total_spent),0),
      coalesce(sum(t.meal_tickets),0)
    from transactions t
    where t.restaurant_id = p_restaurant_id
      and t.transaction_date between p_start_date and p_end_date
    group by date_trunc('year', t.transaction_date)
    order by 1;
  end if;
end;
$$;

-- Function for dashboard metrics with change calculations
create or replace function calculate_dashboard_metrics(
  p_restaurant_id uuid,
  p_start_date date,
  p_end_date date
)
returns jsonb language plpgsql as $$
declare
  total_rev decimal;
  total_exp decimal;
  net_prof decimal;
  margin decimal;
  txn_count int;
  avg_daily_rev decimal;
  avg_daily_exp decimal;
  total_tickets int;
  avg_ticket_price decimal;
  cash_bal decimal;
  days_count int;
  result jsonb;
begin
  select
    coalesce(sum(pos_total),0),
    coalesce(sum(total_spent),0),
    coalesce(sum(meal_tickets),0),
    count(*),
    count(distinct transaction_date)
  into total_rev, total_exp, total_tickets, txn_count, days_count
  from transactions
  where restaurant_id = p_restaurant_id
    and transaction_date between p_start_date and p_end_date;

  net_prof := total_rev - total_exp;
  if total_rev > 0 then
    margin := round((net_prof / total_rev) * 100, 2);
  else
    margin := 0;
  end if;

  if days_count > 0 then
    avg_daily_rev := round(total_rev / days_count, 2);
    avg_daily_exp := round(total_exp / days_count, 2);
  else
    avg_daily_rev := 0;
    avg_daily_exp := 0;
  end if;

  if total_tickets > 0 then
    avg_ticket_price := round(total_rev / total_tickets, 2);
  else
    avg_ticket_price := 0;
  end if;

  select cash_balance into cash_bal
  from transactions
  where restaurant_id = p_restaurant_id
    and transaction_date <= p_end_date
  order by transaction_date desc, created_at desc
  limit 1;

  cash_bal := coalesce(cash_bal, 0);

  result := jsonb_build_object(
    'totalrevenue', total_rev,
    'totalexpenses', total_exp,
    'netprofit', net_prof,
    'profitmargin', margin,
    'totaltransactions', txn_count,
    'averagedailyrevenue', avg_daily_rev,
    'averagedailyexpenses', avg_daily_exp,
    'totalmealtickets', total_tickets,
    'averagemealticketprice', avg_ticket_price,
    'currentcashbalance', cash_bal,
    'revenuechange', 0,
    'expensechange', 0,
    'profitchange', 0
  );

  return result;
end;
$$;

-- Enable real-time
alter publication supabase_realtime add table transactions, purchase_items, expenses;
