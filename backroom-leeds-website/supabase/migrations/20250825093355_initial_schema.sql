-- Initial schema for The Backroom Leeds booking system
-- Based on technical specifications in backroom-tech-spec.md

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- Create custom types
create type booking_status as enum ('pending', 'confirmed', 'cancelled', 'arrived', 'no_show');
create type user_role as enum ('super_admin', 'manager', 'door_staff');
create type floor_type as enum ('upstairs', 'downstairs');

-- Admin users table
create table admin_users (
    id uuid primary key default uuid_generate_v4(),
    email varchar(255) unique not null,
    password_hash varchar(255) not null,
    role user_role not null default 'door_staff',
    totp_secret varchar(255),
    totp_enabled boolean default false,
    is_active boolean default true,
    failed_login_attempts integer default 0,
    locked_until timestamptz,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Venue tables configuration
create table venue_tables (
    id serial primary key,
    table_number integer not null unique,
    floor floor_type not null,
    capacity_min integer not null,
    capacity_max integer not null,
    can_combine_with integer[],
    description text,
    features text[],
    is_active boolean default true,
    created_at timestamptz default now()
);

-- Bookings table
create table bookings (
    id uuid primary key default uuid_generate_v4(),
    booking_ref varchar(20) unique not null,
    customer_email varchar(255) not null,
    customer_name varchar(255) not null,
    customer_phone varchar(20) not null,
    party_size integer not null check (party_size between 1 and 20),
    booking_date date not null,
    arrival_time time not null,
    table_ids integer[] not null,
    drinks_package jsonb,
    special_requests jsonb,
    deposit_amount decimal(10,2) not null default 50.00,
    package_amount decimal(10,2),
    remaining_balance decimal(10,2),
    status booking_status default 'pending',
    stripe_payment_intent_id varchar(255),
    checked_in_at timestamptz,
    cancelled_at timestamptz,
    refund_eligible boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Events table
create table events (
    id uuid primary key default uuid_generate_v4(),
    name varchar(255) not null,
    slug varchar(255) unique not null,
    description text,
    start_time time not null,
    end_time time not null,
    day_of_week integer not null check (day_of_week between 0 and 6), -- 0 = Sunday, 6 = Saturday
    is_recurring boolean default true,
    image_url text,
    ticket_url text,
    dj_lineup text[],
    music_genres text[],
    is_active boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Waitlist table
create table waitlist (
    id uuid primary key default uuid_generate_v4(),
    customer_email varchar(255) not null,
    customer_name varchar(255) not null,
    customer_phone varchar(20),
    booking_date date not null,
    arrival_time time not null,
    party_size integer not null,
    table_preferences integer[],
    expires_at timestamptz not null,
    notified_at timestamptz,
    created_at timestamptz default now()
);

-- Audit log table for admin actions
create table audit_log (
    id uuid primary key default uuid_generate_v4(),
    admin_user_id uuid references admin_users(id),
    action varchar(100) not null,
    table_name varchar(50),
    record_id varchar(100),
    old_values jsonb,
    new_values jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamptz default now()
);

-- Create indexes for better performance
create index idx_bookings_date on bookings (booking_date);
create index idx_bookings_status on bookings (status);
create index idx_bookings_customer_email on bookings (customer_email);
create index idx_bookings_ref on bookings (booking_ref);
create index idx_waitlist_date on waitlist (booking_date);
create index idx_admin_users_email on admin_users (email);
create index idx_venue_tables_floor on venue_tables (floor);

-- Create updated_at trigger function
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

-- Add updated_at triggers
create trigger update_admin_users_updated_at before update on admin_users for each row execute procedure update_updated_at_column();
create trigger update_bookings_updated_at before update on bookings for each row execute procedure update_updated_at_column();
create trigger update_events_updated_at before update on events for each row execute procedure update_updated_at_column();

-- Function to generate booking reference
create or replace function generate_booking_ref()
returns varchar(20) as $$
declare
    ref varchar(20);
    exists_count integer;
begin
    loop
        ref := 'BRL-' || to_char(now(), 'YYYY') || '-' || upper(substring(md5(random()::text) from 1 for 5));
        select count(*) into exists_count from bookings where booking_ref = ref;
        exit when exists_count = 0;
    end loop;
    return ref;
end;
$$ language plpgsql;

-- Trigger to auto-generate booking reference
create or replace function set_booking_ref()
returns trigger as $$
begin
    if new.booking_ref is null or new.booking_ref = '' then
        new.booking_ref = generate_booking_ref();
    end if;
    return new;
end;
$$ language plpgsql;

create trigger set_booking_ref_trigger before insert on bookings for each row execute procedure set_booking_ref();

-- Function to calculate remaining balance
create or replace function calculate_remaining_balance()
returns trigger as $$
begin
    new.remaining_balance = coalesce(new.package_amount, 0) - coalesce(new.deposit_amount, 0);
    return new;
end;
$$ language plpgsql;

create trigger calculate_remaining_balance_trigger before insert or update on bookings for each row execute procedure calculate_remaining_balance();

-- Function to check table booking limits (max 2 tables per customer per night)
create or replace function check_booking_limit()
returns trigger as $$
declare
    booking_count integer;
begin
    select count(*) into booking_count 
    from bookings 
    where customer_email = new.customer_email 
        and booking_date = new.booking_date 
        and status in ('confirmed', 'pending')
        and id != coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid);
    
    if booking_count >= 2 then
        raise exception 'Customer can have maximum 2 bookings per night';
    end if;
    
    return new;
end;
$$ language plpgsql;

create trigger check_booking_limit_trigger before insert or update on bookings for each row execute procedure check_booking_limit();

-- Function to check refund eligibility (48-hour rule)
create or replace function update_refund_eligibility()
returns trigger as $$
begin
    if new.status = 'cancelled' and new.cancelled_at is not null then
        new.refund_eligible = (extract(epoch from (new.booking_date + new.arrival_time - new.cancelled_at)) / 3600) >= 48;
    end if;
    return new;
end;
$$ language plpgsql;

create trigger update_refund_eligibility_trigger before update on bookings for each row execute procedure update_refund_eligibility();

-- Row Level Security (RLS) policies
alter table admin_users enable row level security;
alter table bookings enable row level security;
alter table venue_tables enable row level security;
alter table events enable row level security;
alter table waitlist enable row level security;
alter table audit_log enable row level security;

-- Policy: Admin users can only see their own data (except super_admin)
create policy "Admin users can view own data" on admin_users for select using (
    auth.uid() = id or 
    exists (select 1 from admin_users where id = auth.uid() and role = 'super_admin')
);

-- Policy: Only authenticated admin users can view bookings
create policy "Admin users can view all bookings" on bookings for select using (
    exists (select 1 from admin_users where id = auth.uid() and is_active = true)
);

-- Policy: Admin users can modify bookings based on role
create policy "Admin users can modify bookings" on bookings for all using (
    exists (
        select 1 from admin_users 
        where id = auth.uid() 
        and is_active = true 
        and role in ('super_admin', 'manager')
    )
);

-- Policy: All authenticated users can view venue tables
create policy "Anyone can view venue tables" on venue_tables for select using (true);

-- Policy: All authenticated users can view events
create policy "Anyone can view events" on events for select using (true);

-- Enable realtime for specific tables
alter publication supabase_realtime add table bookings;
alter publication supabase_realtime add table venue_tables;
alter publication supabase_realtime add table waitlist;