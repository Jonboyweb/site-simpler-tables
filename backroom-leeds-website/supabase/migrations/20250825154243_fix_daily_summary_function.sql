-- Fix daily summary function to handle table_ids array properly

-- Replace the generate_daily_summary function with fixed version
CREATE OR REPLACE FUNCTION generate_daily_summary(report_date DATE DEFAULT CURRENT_DATE)
RETURNS JSONB AS $$
DECLARE
    summary_data JSONB;
    tonight_bookings JSONB;
    occupied_tables INTEGER;
BEGIN
    -- Calculate occupied tables separately to avoid unnest in aggregate
    SELECT COUNT(DISTINCT table_id)
    INTO occupied_tables
    FROM bookings b
    CROSS JOIN unnest(b.table_ids) as table_id
    WHERE b.booking_date = report_date
    AND b.status IN ('confirmed', 'arrived');
    
    -- Get overall metrics without problematic aggregates
    SELECT jsonb_build_object(
        'report_date', report_date,
        'total_bookings', COUNT(*),
        'confirmed_bookings', COUNT(*) FILTER (WHERE status = 'confirmed'),
        'pending_bookings', COUNT(*) FILTER (WHERE status = 'pending'),
        'cancelled_bookings', COUNT(*) FILTER (WHERE status = 'cancelled'),
        'arrived_bookings', COUNT(*) FILTER (WHERE status = 'arrived'),
        'no_show_bookings', COUNT(*) FILTER (WHERE status = 'no_show'),
        'total_revenue', COALESCE(SUM(COALESCE(deposit_amount, 0) + COALESCE(package_amount, 0)), 0),
        'total_guests', COALESCE(SUM(party_size) FILTER (WHERE status IN ('confirmed', 'arrived')), 0),
        'average_party_size', COALESCE(AVG(party_size) FILTER (WHERE status IN ('confirmed', 'pending')), 0),
        'tables_occupied', occupied_tables
    ) INTO summary_data
    FROM bookings
    WHERE booking_date = report_date;
    
    -- Get tonight's bookings details
    SELECT jsonb_agg(
        jsonb_build_object(
            'booking_ref', booking_ref,
            'customer_name', customer_name,
            'party_size', party_size,
            'arrival_time', arrival_time,
            'table_ids', table_ids,
            'status', status,
            'special_requests', special_requests,
            'checked_in_at', checked_in_at
        ) ORDER BY arrival_time
    ) INTO tonight_bookings
    FROM bookings
    WHERE booking_date = report_date
    AND status IN ('confirmed', 'pending', 'arrived');
    
    -- Combine data
    summary_data := summary_data || jsonb_build_object('tonight_bookings', COALESCE(tonight_bookings, '[]'::jsonb));
    
    RETURN summary_data;
END;
$$ LANGUAGE plpgsql;