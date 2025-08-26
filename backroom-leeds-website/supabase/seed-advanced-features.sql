-- ======================================================================================
-- The Backroom Leeds - Advanced Features Seed Data
-- ======================================================================================
-- Version: 3.4.0
-- Date: 2025-08-27
-- Description: Seed data for testing Phase 3 advanced booking features
-- ======================================================================================

-- ======================================================================================
-- VENUE TABLE LAYOUT DATA
-- ======================================================================================

-- Update venue tables with position and layout data
UPDATE venue_tables SET
    position_x = CASE table_number
        WHEN 1 THEN 100 WHEN 2 THEN 200 WHEN 3 THEN 300 WHEN 4 THEN 400
        WHEN 5 THEN 100 WHEN 6 THEN 200 WHEN 7 THEN 300 WHEN 8 THEN 400
        WHEN 9 THEN 100 WHEN 10 THEN 200 WHEN 11 THEN 300 WHEN 12 THEN 400
        WHEN 13 THEN 100 WHEN 14 THEN 200 WHEN 15 THEN 300 WHEN 16 THEN 400
        ELSE 0
    END,
    position_y = CASE 
        WHEN table_number <= 4 THEN 100
        WHEN table_number <= 8 THEN 200
        WHEN table_number <= 12 THEN 300
        ELSE 400
    END,
    rotation = 0,
    shape = CASE 
        WHEN table_number IN (1, 2, 3, 4) THEN 'rectangle'
        WHEN table_number IN (5, 6, 7, 8) THEN 'square'
        ELSE 'rectangle'
    END,
    width = CASE 
        WHEN capacity_max <= 4 THEN 100
        WHEN capacity_max <= 6 THEN 120
        ELSE 150
    END,
    height = CASE 
        WHEN capacity_max <= 4 THEN 100
        WHEN capacity_max <= 6 THEN 120
        ELSE 150
    END,
    is_combinable = CASE 
        WHEN table_number IN (15, 16) THEN TRUE
        ELSE FALSE
    END,
    combination_group = CASE 
        WHEN table_number IN (15, 16) THEN 'GROUP_A'
        ELSE NULL
    END,
    priority_score = CASE 
        WHEN floor = 'upstairs' THEN 75
        ELSE 50
    END
WHERE table_number BETWEEN 1 AND 16;

-- ======================================================================================
-- TABLE COMBINATIONS
-- ======================================================================================

-- Insert additional table combinations if needed
DO $$
DECLARE
    table_15_id INTEGER;
    table_16_id INTEGER;
BEGIN
    -- Get table IDs
    SELECT id INTO table_15_id FROM venue_tables WHERE table_number = 15;
    SELECT id INTO table_16_id FROM venue_tables WHERE table_number = 16;
    
    -- Insert combination if it doesn't exist
    INSERT INTO table_combinations (
        primary_table_id,
        secondary_table_id,
        combined_capacity_min,
        combined_capacity_max,
        combination_name,
        description,
        auto_combine_threshold,
        requires_approval,
        setup_time_minutes,
        is_active
    ) VALUES (
        table_15_id,
        table_16_id,
        7,
        12,
        'Large Party Combination',
        'Automatic combination of tables 15 & 16 for parties of 7-12 guests',
        7,
        FALSE,
        10,
        TRUE
    ) ON CONFLICT (primary_table_id, secondary_table_id) DO NOTHING;
END $$;

-- ======================================================================================
-- SPECIAL REQUEST TEMPLATES
-- ======================================================================================

INSERT INTO special_request_templates (
    request_type,
    template_name,
    description,
    default_priority,
    estimated_prep_time,
    estimated_cost,
    checklist,
    is_active
) VALUES
    -- Birthday celebrations
    ('birthday', 'Standard Birthday Package', 'Birthday celebration with cake and decorations', 7, 30, 50.00,
     '{"items": [
        {"item": "Order birthday cake", "required": true},
        {"item": "Set up birthday decorations", "required": true},
        {"item": "Prepare sparklers", "required": false},
        {"item": "Queue birthday playlist", "required": true},
        {"item": "Brief wait staff", "required": true}
     ]}', TRUE),
    
    ('birthday', 'VIP Birthday Experience', 'Premium birthday package with champagne and photographer', 9, 45, 150.00,
     '{"items": [
        {"item": "Reserve VIP section", "required": true},
        {"item": "Arrange photographer", "required": true},
        {"item": "Premium cake setup", "required": true},
        {"item": "Champagne on arrival", "required": true},
        {"item": "Custom lighting setup", "required": true}
     ]}', TRUE),
    
    -- Anniversary celebrations
    ('anniversary', 'Romantic Anniversary', 'Intimate anniversary setup', 8, 25, 75.00,
     '{"items": [
        {"item": "Reserve quiet corner table", "required": true},
        {"item": "Rose petals on table", "required": true},
        {"item": "Champagne bucket ready", "required": true},
        {"item": "Dim lighting arrangement", "required": true},
        {"item": "Special dessert prepared", "required": false}
     ]}', TRUE),
    
    -- Hen parties
    ('hen_party', 'Hen Party Package', 'Fun hen party setup with decorations', 8, 35, 100.00,
     '{"items": [
        {"item": "Decorate reserved area", "required": true},
        {"item": "Prepare welcome drinks", "required": true},
        {"item": "Set up photo props", "required": true},
        {"item": "Arrange party playlist", "required": true},
        {"item": "Brief security team", "required": true}
     ]}', TRUE),
    
    -- Corporate events
    ('corporate_event', 'Corporate Booking', 'Professional setup for business groups', 6, 20, 0.00,
     '{"items": [
        {"item": "Reserve appropriate seating", "required": true},
        {"item": "Set up quiet area if needed", "required": false},
        {"item": "Prepare itemized billing", "required": true},
        {"item": "Arrange coat storage", "required": false},
        {"item": "Brief staff on professional service", "required": true}
     ]}', TRUE),
    
    -- Dietary restrictions
    ('dietary_restriction', 'Allergy Alert', 'Severe allergy accommodation', 10, 15, 0.00,
     '{"items": [
        {"item": "Alert kitchen immediately", "required": true},
        {"item": "Review all ingredients", "required": true},
        {"item": "Prepare separate utensils", "required": true},
        {"item": "Brief all wait staff", "required": true},
        {"item": "Have EpiPen location confirmed", "required": true}
     ]}', TRUE),
    
    ('dietary_restriction', 'Vegan/Vegetarian', 'Plant-based dining requirements', 7, 10, 0.00,
     '{"items": [
        {"item": "Confirm menu options", "required": true},
        {"item": "Inform kitchen", "required": true},
        {"item": "Check drink ingredients", "required": false},
        {"item": "Brief wait staff", "required": true}
     ]}', TRUE),
    
    -- Accessibility needs
    ('accessibility_need', 'Wheelchair Access', 'Full wheelchair accessibility', 10, 10, 0.00,
     '{"items": [
        {"item": "Ensure elevator is operational", "required": true},
        {"item": "Reserve accessible table", "required": true},
        {"item": "Clear pathway to table", "required": true},
        {"item": "Confirm accessible restroom available", "required": true},
        {"item": "Brief door and wait staff", "required": true}
     ]}', TRUE),
    
    ('accessibility_need', 'Visual Impairment', 'Assistance for visually impaired guests', 9, 5, 0.00,
     '{"items": [
        {"item": "Assign dedicated staff member", "required": true},
        {"item": "Provide large print or braille menu", "required": false},
        {"item": "Ensure clear pathways", "required": true},
        {"item": "Offer menu reading assistance", "required": true}
     ]}', TRUE),
    
    -- VIP service
    ('vip_service', 'Celebrity Guest', 'Discrete VIP service for high-profile guests', 10, 30, 200.00,
     '{"items": [
        {"item": "Arrange private entrance if possible", "required": true},
        {"item": "Reserve secluded seating", "required": true},
        {"item": "Brief security team", "required": true},
        {"item": "Assign dedicated server", "required": true},
        {"item": "Ensure privacy from other guests", "required": true}
     ]}', TRUE)
ON CONFLICT DO NOTHING;

-- ======================================================================================
-- SAMPLE CUSTOMER PROFILES
-- ======================================================================================

INSERT INTO customer_profiles (
    email,
    name,
    phone,
    total_bookings,
    total_cancellations,
    total_no_shows,
    total_spend,
    average_party_size,
    preferred_tables,
    dietary_preferences,
    favorite_drinks,
    is_vip,
    vip_tier,
    loyalty_points,
    reliability_score,
    marketing_consent
) VALUES
    ('sarah.johnson@email.com', 'Sarah Johnson', '07700900001', 
     15, 1, 0, 2500.00, 4.5, ARRAY[1, 2, 3], 
     '[{"type": "vegetarian", "severity": "preference"}]'::jsonb,
     '[{"category": "cocktails", "brands": ["Grey Goose", "Hendricks"]}]'::jsonb,
     TRUE, 'gold', 2500, 95, TRUE),
    
    ('james.smith@email.com', 'James Smith', '07700900002',
     8, 0, 0, 1200.00, 6.0, ARRAY[15, 16],
     NULL,
     '[{"category": "whiskey", "brands": ["Macallan", "Glenfiddich"]}]'::jsonb,
     FALSE, NULL, 800, 100, TRUE),
    
    ('emma.williams@email.com', 'Emma Williams', '07700900003',
     5, 2, 1, 600.00, 3.0, ARRAY[5, 6],
     '[{"type": "gluten-free", "severity": "intolerance"}]'::jsonb,
     '[{"category": "wine", "brands": ["Moet", "Veuve Clicquot"]}]'::jsonb,
     FALSE, NULL, 300, 75, FALSE),
    
    ('corporate@bigcorp.com', 'Big Corp Events', '07700900004',
     25, 3, 0, 8500.00, 12.0, ARRAY[15, 16],
     '[{"type": "various", "severity": "preference", "notes": "Always check with organizer"}]'::jsonb,
     NULL,
     TRUE, 'platinum', 8500, 90, TRUE)
ON CONFLICT (email) DO UPDATE SET
    total_bookings = EXCLUDED.total_bookings,
    total_spend = EXCLUDED.total_spend,
    loyalty_points = EXCLUDED.loyalty_points;

-- ======================================================================================
-- SAMPLE BOOKINGS WITH ADVANCED FEATURES
-- ======================================================================================

DO $$
DECLARE
    booking_id UUID;
    tomorrow DATE := CURRENT_DATE + INTERVAL '1 day';
    next_week DATE := CURRENT_DATE + INTERVAL '7 days';
    next_month DATE := CURRENT_DATE + INTERVAL '30 days';
BEGIN
    -- Booking 1: Birthday celebration with special requests
    INSERT INTO bookings (
        booking_ref,
        customer_email,
        customer_name,
        customer_phone,
        party_size,
        booking_date,
        arrival_time,
        table_ids,
        deposit_amount,
        package_amount,
        status,
        special_requests,
        is_combined_booking,
        booking_source,
        marketing_consent,
        check_in_code,
        tags,
        priority_level
    ) VALUES (
        generate_unique_booking_ref(),
        'sarah.johnson@email.com',
        'Sarah Johnson',
        '07700900001',
        4,
        tomorrow,
        '19:00',
        ARRAY[1],
        50.00,
        200.00,
        'confirmed',
        '{"notes": "30th birthday celebration"}'::jsonb,
        FALSE,
        'website',
        TRUE,
        generate_check_in_code(),
        ARRAY['birthday', 'vip', 'regular'],
        8
    ) RETURNING id INTO booking_id;
    
    -- Add special request for birthday
    INSERT INTO special_requests (
        booking_id,
        request_type,
        status,
        title,
        description,
        priority,
        celebration_details,
        customer_notes,
        requires_kitchen_prep,
        requires_bar_prep,
        requires_decoration,
        estimated_cost
    ) VALUES (
        booking_id,
        'birthday',
        'acknowledged',
        '30th Birthday Celebration',
        'Customer celebrating 30th birthday, requested cake and decorations',
        8,
        '{
            "occasionType": "30th Birthday",
            "celebrantName": "Sarah Johnson",
            "ageOrYears": 30,
            "requiresCake": true,
            "cakeDetails": "Chocolate cake with sparklers",
            "decorationPreferences": "Gold and black theme",
            "photographyAllowed": true,
            "surpriseElement": false
        }'::jsonb,
        'Please make it special - it''s a milestone birthday!',
        TRUE,
        TRUE,
        TRUE,
        75.00
    );
    
    -- Booking 2: Large party with table combination
    INSERT INTO bookings (
        booking_ref,
        customer_email,
        customer_name,
        customer_phone,
        party_size,
        booking_date,
        arrival_time,
        table_ids,
        deposit_amount,
        package_amount,
        status,
        is_combined_booking,
        booking_source,
        check_in_code,
        tags
    ) VALUES (
        generate_unique_booking_ref(),
        'james.smith@email.com',
        'James Smith',
        '07700900002',
        10,
        next_week,
        '20:00',
        ARRAY[15, 16],
        50.00,
        580.00,
        'confirmed',
        TRUE,
        'phone',
        generate_check_in_code(),
        ARRAY['large_party', 'combined_tables']
    );
    
    -- Booking 3: Corporate event with dietary requirements
    INSERT INTO bookings (
        booking_ref,
        customer_email,
        customer_name,
        customer_phone,
        party_size,
        booking_date,
        arrival_time,
        table_ids,
        deposit_amount,
        package_amount,
        status,
        booking_source,
        accessibility_requirements,
        check_in_code,
        tags,
        internal_notes
    ) VALUES (
        generate_unique_booking_ref(),
        'corporate@bigcorp.com',
        'Big Corp Events',
        '07700900004',
        12,
        next_month,
        '18:30',
        ARRAY[15, 16],
        50.00,
        850.00,
        'pending',
        'admin',
        'One wheelchair user in party, requires accessible seating',
        generate_check_in_code(),
        ARRAY['corporate', 'accessibility', 'dietary'],
        'Important client - ensure flawless service'
    ) RETURNING id INTO booking_id;
    
    -- Add dietary special request
    INSERT INTO special_requests (
        booking_id,
        request_type,
        status,
        title,
        description,
        priority,
        dietary_details,
        requires_kitchen_prep
    ) VALUES (
        booking_id,
        'dietary_restriction',
        'pending',
        'Multiple Dietary Requirements',
        'Corporate group with various dietary needs',
        9,
        '{
            "restrictions": ["vegetarian", "vegan", "gluten-free"],
            "allergies": ["nuts", "shellfish"],
            "preferences": ["no pork"],
            "numberOfPeople": 12,
            "severity": "severe",
            "notes": "2 vegetarians, 1 vegan, 1 gluten-free, 2 nut allergies"
        }'::jsonb,
        TRUE
    );
    
    -- Add accessibility special request
    INSERT INTO special_requests (
        booking_id,
        request_type,
        status,
        title,
        description,
        priority,
        accessibility_details
    ) VALUES (
        booking_id,
        'accessibility_need',
        'pending',
        'Wheelchair Access Required',
        'One guest requires wheelchair accessibility',
        10,
        '{
            "requiresWheelchairAccess": true,
            "requiresElevator": true,
            "requiresAccessibleRestroom": true,
            "requiresAssistance": false,
            "mobilityAids": ["wheelchair"],
            "notes": "Guest can transfer to regular seating if needed"
        }'::jsonb
    );
END $$;

-- ======================================================================================
-- SAMPLE WAITLIST ENTRIES
-- ======================================================================================

INSERT INTO waitlist (
    customer_email,
    customer_name,
    customer_phone,
    booking_date,
    preferred_arrival_time,
    alternative_arrival_times,
    party_size,
    flexible_party_size,
    min_party_size,
    max_party_size,
    table_preferences,
    floor_preference,
    accepts_any_table,
    accepts_combination,
    status,
    priority_score,
    position_in_queue,
    notification_methods,
    notification_lead_time,
    max_notifications,
    source,
    special_occasion,
    notes,
    expires_at
) VALUES
    ('waiting1@email.com', 'Alice Cooper', '07700900101',
     CURRENT_DATE + INTERVAL '2 days', '19:30', ARRAY['19:00', '20:00']::time[],
     6, TRUE, 5, 7, ARRAY[5, 6, 7], 'upstairs', FALSE, TRUE,
     'active', 75, 1, ARRAY['email', 'sms'], 120, 3,
     'website', 'Anniversary', 'Flexible on timing', NOW() + INTERVAL '48 hours'),
    
    ('waiting2@email.com', 'Bob Dylan', '07700900102',
     CURRENT_DATE + INTERVAL '3 days', '20:00', ARRAY['19:30', '20:30']::time[],
     4, FALSE, NULL, NULL, ARRAY[1, 2, 3, 4], NULL, TRUE, FALSE,
     'active', 60, 2, ARRAY['email'], 60, 3,
     'website', NULL, 'Any table is fine', NOW() + INTERVAL '72 hours'),
    
    ('waiting3@email.com', 'Charlie Brown', '07700900103',
     CURRENT_DATE + INTERVAL '1 day', '18:00', NULL,
     8, TRUE, 6, 10, NULL, 'downstairs', FALSE, TRUE,
     'active', 85, 1, ARRAY['email', 'phone'], 180, 5,
     'phone', 'Birthday', 'VIP customer - high priority', NOW() + INTERVAL '24 hours')
ON CONFLICT DO NOTHING;

-- ======================================================================================
-- SAMPLE BOOKING HOLDS (ACTIVE)
-- ======================================================================================

INSERT INTO booking_holds (
    session_id,
    table_ids,
    booking_date,
    arrival_time,
    party_size,
    status,
    expires_at,
    client_ip,
    user_agent
) VALUES
    ('session_abc123', ARRAY[3], CURRENT_DATE + INTERVAL '1 day', '19:00', 2,
     'active', NOW() + INTERVAL '15 minutes', '192.168.1.1'::inet, 'Mozilla/5.0'),
    
    ('session_def456', ARRAY[7, 8], CURRENT_DATE + INTERVAL '2 days', '20:30', 6,
     'active', NOW() + INTERVAL '10 minutes', '192.168.1.2'::inet, 'Chrome/91.0')
ON CONFLICT DO NOTHING;

-- ======================================================================================
-- UPDATE CUSTOMER BOOKING LIMITS
-- ======================================================================================

-- Update booking limits for existing bookings
INSERT INTO customer_booking_limits (customer_email, booking_date, bookings_count, tables_reserved, total_guests)
SELECT 
    customer_email,
    booking_date,
    COUNT(*)::integer as bookings_count,
    array_agg(DISTINCT table_id) as tables_reserved,
    SUM(party_size)::integer as total_guests
FROM bookings b
CROSS JOIN LATERAL unnest(b.table_ids) as table_id
WHERE status IN ('confirmed', 'pending')
GROUP BY customer_email, booking_date
ON CONFLICT (customer_email, booking_date) DO UPDATE SET
    bookings_count = EXCLUDED.bookings_count,
    tables_reserved = EXCLUDED.tables_reserved,
    total_guests = EXCLUDED.total_guests;

-- ======================================================================================
-- INITIALIZE AVAILABILITY CACHE
-- ======================================================================================

-- Create sample cache entries for performance testing
INSERT INTO availability_cache (
    cache_key,
    booking_date,
    time_slot,
    available_tables,
    available_combinations,
    total_capacity,
    calculated_at,
    expires_at,
    is_stale,
    calculation_time_ms,
    hit_count
)
SELECT
    booking_date::text || '_' || time_slot::text as cache_key,
    booking_date,
    time_slot,
    ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14] as available_tables,
    ARRAY[]::uuid[] as available_combinations,
    60 as total_capacity,
    NOW() as calculated_at,
    NOW() + INTERVAL '1 hour' as expires_at,
    FALSE as is_stale,
    25 as calculation_time_ms,
    0 as hit_count
FROM (
    SELECT generate_series(
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '7 days',
        INTERVAL '1 day'
    )::date as booking_date
) dates
CROSS JOIN (
    SELECT generate_series(
        '17:00'::time,
        '22:00'::time,
        INTERVAL '30 minutes'
    )::time as time_slot
) times
ON CONFLICT (cache_key) DO NOTHING;

-- ======================================================================================
-- SAMPLE BOOKING STATE CHANGES (AUDIT TRAIL)
-- ======================================================================================

-- Add state changes for existing bookings
INSERT INTO booking_state_changes (booking_id, sequence_number, from_status, to_status, change_reason)
SELECT 
    id as booking_id,
    1 as sequence_number,
    NULL as from_status,
    'pending' as to_status,
    'Initial booking creation' as change_reason
FROM bookings
WHERE status != 'pending'
ON CONFLICT DO NOTHING;

INSERT INTO booking_state_changes (booking_id, sequence_number, from_status, to_status, change_reason)
SELECT 
    id as booking_id,
    2 as sequence_number,
    'pending' as from_status,
    'confirmed' as to_status,
    'Payment confirmed' as change_reason
FROM bookings
WHERE status = 'confirmed'
ON CONFLICT DO NOTHING;

-- ======================================================================================
-- ANALYTICS DATA POPULATION
-- ======================================================================================

-- Refresh materialized views if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'daily_booking_summary') THEN
        REFRESH MATERIALIZED VIEW daily_booking_summary;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'table_utilization') THEN
        REFRESH MATERIALIZED VIEW table_utilization;
    END IF;
END $$;

-- ======================================================================================
-- VERIFICATION QUERIES
-- ======================================================================================

-- Verify data insertion
DO $$
DECLARE
    bookings_count INTEGER;
    requests_count INTEGER;
    waitlist_count INTEGER;
    profiles_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO bookings_count FROM bookings WHERE booking_date >= CURRENT_DATE;
    SELECT COUNT(*) INTO requests_count FROM special_requests;
    SELECT COUNT(*) INTO waitlist_count FROM waitlist WHERE status = 'active';
    SELECT COUNT(*) INTO profiles_count FROM customer_profiles;
    
    RAISE NOTICE 'Seed data inserted successfully:';
    RAISE NOTICE '  - Active bookings: %', bookings_count;
    RAISE NOTICE '  - Special requests: %', requests_count;
    RAISE NOTICE '  - Waitlist entries: %', waitlist_count;
    RAISE NOTICE '  - Customer profiles: %', profiles_count;
END $$;

-- ======================================================================================
-- END OF SEED DATA
-- ======================================================================================