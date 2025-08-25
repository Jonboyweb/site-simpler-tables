-- Seed data for The Backroom Leeds booking system
-- Based on venue specifications from backroom-tech-spec.md

-- Insert venue tables configuration
insert into venue_tables (table_number, floor, capacity_min, capacity_max, can_combine_with, description, features) values
-- Upstairs tables
(1, 'upstairs', 4, 12, null, 'Dance floor premium booth', array['premium', 'dance_floor_view']),
(2, 'upstairs', 4, 8, null, 'Dance floor side high table', array['high_table', 'dance_floor_view']),
(3, 'upstairs', 4, 8, null, 'Dance floor side high table', array['high_table', 'dance_floor_view']),
(4, 'upstairs', 4, 8, null, 'Dance floor front high table', array['high_table', 'front_view']),
(5, 'upstairs', 4, 10, null, 'Dance floor front large high table', array['high_table', 'large', 'front_view']),
(6, 'upstairs', 2, 4, null, 'Barrel bar area', array['bar_area', 'intimate']),
(7, 'upstairs', 2, 4, null, 'Barrel bar area', array['bar_area', 'intimate']),
(8, 'upstairs', 2, 4, null, 'Barrel bar area', array['bar_area', 'intimate']),
(9, 'upstairs', 4, 10, null, 'Large booth', array['booth', 'spacious']),
(10, 'upstairs', 4, 12, null, 'Premium Ciroc booth', array['premium', 'booth', 'vip']),

-- Downstairs tables
(11, 'downstairs', 2, 8, null, 'Intimate booth', array['booth', 'intimate']),
(12, 'downstairs', 2, 8, null, 'Intimate booth', array['booth', 'intimate']),
(13, 'downstairs', 2, 8, null, 'Dancefloor booth', array['booth', 'dance_floor_view']),
(14, 'downstairs', 2, 8, null, 'Dance floor booth', array['booth', 'dance_floor_view']),
(15, 'downstairs', 2, 6, array[16], 'Curved seating', array['curved', 'combinable']),
(16, 'downstairs', 2, 6, array[15], 'Curved seating', array['curved', 'combinable']);

-- Insert weekly events
insert into events (name, slug, description, start_time, end_time, day_of_week, image_url, ticket_url, dj_lineup, music_genres) values
('LA FIESTA', 'la-fiesta', 'Leeds'' hottest Latin night with the best reggaeton, Latin pop, and salsa beats', '23:00:00', '06:00:00', 5, null, 'https://www.fatsoma.com/p/backroomleeds', array['DJ Carlos', 'DJ Maria'], array['reggaeton', 'latin_pop', 'salsa']),
('SHHH!', 'shhh', 'The ultimate Saturday night experience with house, techno, and electronic beats', '23:00:00', '06:00:00', 6, null, 'https://www.fatsoma.com/p/backroomleeds', array['DJ Mike', 'DJ Sarah'], array['house', 'techno', 'electronic']),
('NOSTALGIA', 'nostalgia', 'Sunday night throwbacks with classic hits, R&B, and hip-hop', '23:00:00', '05:00:00', 0, null, 'https://www.fatsoma.com/p/backroomleeds', array['DJ James', 'DJ Lisa'], array['classic_hits', 'rnb', 'hip_hop']);

-- Insert default admin user (password should be changed in production)
-- Password: admin123! (hashed with bcrypt)
insert into admin_users (email, password_hash, role, is_active) values
('admin@backroomleeds.co.uk', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBVJ/g3S2fZi5e', 'super_admin', true);

-- Insert sample bookings for testing (future dates)
insert into bookings (
    customer_email, 
    customer_name, 
    customer_phone, 
    party_size, 
    booking_date, 
    arrival_time, 
    table_ids, 
    status,
    deposit_amount,
    package_amount,
    drinks_package
) values
('john.doe@example.com', 'John Doe', '+44 7700 900123', 4, current_date + interval '7 days', '23:30:00', array[1], 'confirmed', 50.00, 170.00, '{"package_name": "HUSH & SHUSH", "price": 170, "includes": ["Bottle of Smirnoff", "2 jugs mixer", "Bottle of Prosecco", "8 Tequila Rose shots"]}'::jsonb),
('sarah.smith@example.com', 'Sarah Smith', '+44 7700 900456', 6, current_date + interval '14 days', '23:00:00', array[5], 'confirmed', 50.00, 280.00, '{"package_name": "SPEAK WHISKEY TO ME", "price": 280, "includes": ["Bottle of Jack Daniels", "Bottle of Bacardi Spiced", "4 jugs mixer"]}'::jsonb),
('mike.jones@example.com', 'Mike Jones', '+44 7700 900789', 8, current_date + interval '21 days', '00:00:00', array[10], 'pending', 50.00, 400.00, '{"package_name": "AFTER HOURS", "price": 400, "includes": ["8 Grey Goose Espresso Martinis", "Bottle of Ciroc", "Bottle of Ciroc Flavours", "4 jugs mixer"]}'::jsonb);

-- Create a view for available tables on a given date/time
create or replace view available_tables as
select 
    vt.*,
    case 
        when exists (
            select 1 from bookings b 
            where b.booking_date = current_date 
            and b.status in ('confirmed', 'pending')
            and vt.table_number = any(b.table_ids)
        ) then false 
        else true 
    end as is_available
from venue_tables vt
where vt.is_active = true;

-- Create a function to check table availability for a specific date
create or replace function check_table_availability(
    check_date date,
    party_size_param integer
)
returns table (
    table_number integer,
    floor floor_type,
    capacity_min integer,
    capacity_max integer,
    description text,
    features text[],
    is_available boolean,
    can_accommodate boolean
) as $$
begin
    return query
    select 
        vt.table_number,
        vt.floor,
        vt.capacity_min,
        vt.capacity_max,
        vt.description,
        vt.features,
        not exists (
            select 1 from bookings b 
            where b.booking_date = check_date
            and b.status in ('confirmed', 'pending')
            and vt.table_number = any(b.table_ids)
        ) as is_available,
        (party_size_param >= vt.capacity_min and party_size_param <= vt.capacity_max) as can_accommodate
    from venue_tables vt
    where vt.is_active = true
    order by vt.floor, vt.table_number;
end;
$$ language plpgsql;

-- Create a function to get booking statistics
create or replace function get_booking_stats(
    start_date date default current_date,
    end_date date default current_date + interval '30 days'
)
returns table (
    total_bookings bigint,
    confirmed_bookings bigint,
    pending_bookings bigint,
    cancelled_bookings bigint,
    total_revenue numeric,
    average_party_size numeric
) as $$
begin
    return query
    select 
        count(*) as total_bookings,
        count(*) filter (where status = 'confirmed') as confirmed_bookings,
        count(*) filter (where status = 'pending') as pending_bookings,
        count(*) filter (where status = 'cancelled') as cancelled_bookings,
        sum(coalesce(package_amount, 0) + coalesce(deposit_amount, 0)) as total_revenue,
        avg(party_size) as average_party_size
    from bookings
    where booking_date between start_date and end_date;
end;
$$ language plpgsql;

-- Grant necessary permissions for API access
grant usage on schema public to anon, authenticated;
grant all privileges on all tables in schema public to anon, authenticated;
grant all privileges on all sequences in schema public to anon, authenticated;
grant execute on all functions in schema public to anon, authenticated;