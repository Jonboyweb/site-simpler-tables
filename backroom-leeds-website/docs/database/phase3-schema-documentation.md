# Phase 3 Advanced Booking Features - Database Schema Documentation

## Version: 3.4.0
## Date: 2025-08-27
## Author: Architecture Agent

---

## Executive Summary

This document provides comprehensive documentation for The Backroom Leeds' Phase 3 advanced booking system database schema. The schema implements sophisticated features including automatic table combinations, waitlist management with priority scoring, special request handling, and real-time conflict resolution with optimistic locking.

---

## Table of Contents

1. [Schema Overview](#schema-overview)
2. [Core Tables](#core-tables)
3. [Business Logic Functions](#business-logic-functions)
4. [Triggers and Automation](#triggers-and-automation)
5. [Performance Optimization](#performance-optimization)
6. [Security and RLS Policies](#security-and-rls-policies)
7. [Migration Strategy](#migration-strategy)
8. [API Integration Points](#api-integration-points)

---

## Schema Overview

### Key Features Implemented

1. **Table Combination System**
   - Automatic combination of tables 15 & 16 for parties of 7-12
   - Combination rules and capacity management
   - Active combination tracking

2. **Enhanced Bookings**
   - Version control for optimistic locking
   - Unique booking reference generation (BRL-YYYY-XXXXX)
   - QR code and check-in code support
   - Source tracking and marketing consent

3. **Waitlist Management**
   - Priority scoring algorithm
   - Flexible party size and timing preferences
   - Automatic matching to available tables
   - Multi-channel notification support

4. **Special Requests**
   - Categorized request types with templates
   - Staff assignment and workflow tracking
   - Cost estimation and department coordination
   - Completion checklist management

5. **Customer Management**
   - Profile tracking with preferences
   - VIP tier system with loyalty points
   - Reliability scoring
   - Booking limit enforcement (2 tables per night)

6. **Real-time Operations**
   - Booking holds with automatic expiry
   - Event sourcing for state changes
   - Availability caching for performance
   - Conflict detection and resolution

---

## Core Tables

### Table Combinations

#### `table_combinations`
Stores rules for combining adjacent tables.

```sql
CREATE TABLE table_combinations (
    id UUID PRIMARY KEY,
    primary_table_id INTEGER REFERENCES venue_tables(id),
    secondary_table_id INTEGER REFERENCES venue_tables(id),
    combined_capacity_min INTEGER,
    combined_capacity_max INTEGER,
    combination_name VARCHAR(100),
    auto_combine_threshold INTEGER DEFAULT 7,
    requires_approval BOOLEAN DEFAULT FALSE,
    setup_time_minutes INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT TRUE
);
```

**Key Business Rules:**
- Tables 15 & 16 auto-combine for parties ≥ 7
- Combination capacity: 7-12 guests
- 10-minute setup time required
- No approval needed for auto-combination

#### `active_table_combinations`
Tracks currently active table combinations.

```sql
CREATE TABLE active_table_combinations (
    id UUID PRIMARY KEY,
    combination_id UUID REFERENCES table_combinations(id),
    booking_id UUID REFERENCES bookings(id),
    status combination_status,
    combined_at TIMESTAMPTZ,
    separated_at TIMESTAMPTZ,
    combined_by UUID REFERENCES admin_users(id)
);
```

### Enhanced Bookings

#### Extended `bookings` Table
New columns added to existing bookings table:

```sql
ALTER TABLE bookings ADD COLUMN
    version INTEGER DEFAULT 1,
    is_combined_booking BOOLEAN DEFAULT FALSE,
    combination_id UUID,
    booking_source VARCHAR(50),
    check_in_code VARCHAR(6),
    qr_code_data JSONB,
    tags TEXT[],
    priority_level INTEGER DEFAULT 0;
```

**Version Control:**
- Implements optimistic locking
- Prevents concurrent updates
- Version increments on each update

### Special Requests

#### `special_requests`
Comprehensive special request tracking system.

```sql
CREATE TABLE special_requests (
    id UUID PRIMARY KEY,
    booking_id UUID REFERENCES bookings(id),
    request_type special_request_type,
    status special_request_status,
    title VARCHAR(255),
    priority INTEGER CHECK (priority BETWEEN 1 AND 10),
    
    -- Detailed request data
    dietary_details JSONB,
    accessibility_details JSONB,
    celebration_details JSONB,
    
    -- Workflow tracking
    assigned_to UUID REFERENCES admin_users(id),
    acknowledged_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Department coordination
    requires_kitchen_prep BOOLEAN,
    requires_bar_prep BOOLEAN,
    requires_decoration BOOLEAN
);
```

**Request Types:**
- Birthday celebrations
- Anniversaries
- Hen/Stag parties
- Corporate events
- Dietary restrictions
- Accessibility needs
- VIP service

### Waitlist Management

#### `waitlist`
Advanced waitlist with priority scoring and preferences.

```sql
CREATE TABLE waitlist (
    id UUID PRIMARY KEY,
    customer_email VARCHAR(255),
    booking_date DATE,
    preferred_arrival_time TIME,
    party_size INTEGER,
    
    -- Flexibility options
    flexible_party_size BOOLEAN,
    min_party_size INTEGER,
    max_party_size INTEGER,
    accepts_any_table BOOLEAN,
    
    -- Priority management
    status waitlist_status,
    priority_score INTEGER,
    position_in_queue INTEGER,
    
    -- Notifications
    notification_methods TEXT[],
    max_notifications INTEGER DEFAULT 3,
    notifications_sent INTEGER DEFAULT 0
);
```

**Priority Scoring Factors:**
- Queue position (earlier = higher)
- VIP status (+50 points)
- Reliability score (+20 points if ≥90)
- Flexibility bonuses (+10-15 points)
- Special occasions (+10 points)

### Customer Management

#### `customer_profiles`
Comprehensive customer preference and behavior tracking.

```sql
CREATE TABLE customer_profiles (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    
    -- Statistics
    total_bookings INTEGER,
    total_cancellations INTEGER,
    total_no_shows INTEGER,
    total_spend DECIMAL(10,2),
    average_party_size DECIMAL(4,2),
    
    -- VIP status
    is_vip BOOLEAN,
    vip_tier VARCHAR(20),
    loyalty_points INTEGER,
    reliability_score INTEGER,
    
    -- Preferences
    preferred_tables INTEGER[],
    dietary_preferences JSONB,
    favorite_drinks JSONB
);
```

#### `customer_booking_limits`
Enforces 2-table maximum per customer per night.

```sql
CREATE TABLE customer_booking_limits (
    id UUID PRIMARY KEY,
    customer_email VARCHAR(255),
    booking_date DATE,
    bookings_count INTEGER CHECK (bookings_count <= 2),
    tables_reserved INTEGER[],
    UNIQUE(customer_email, booking_date)
);
```

### Real-time Operations

#### `booking_holds`
Temporary table reservations during booking process.

```sql
CREATE TABLE booking_holds (
    id UUID PRIMARY KEY,
    session_id VARCHAR(255),
    table_ids INTEGER[],
    booking_date DATE,
    arrival_time TIME,
    status booking_hold_status,
    expires_at TIMESTAMPTZ,
    
    -- Exclusion constraint prevents overlapping holds
    CONSTRAINT no_overlapping_holds EXCLUDE USING gist (
        table_ids WITH &&,
        booking_date WITH =,
        arrival_time WITH =
    ) WHERE (status = 'active')
);
```

**Hold Duration:** 15 minutes default

#### `booking_state_changes`
Event sourcing for booking status transitions.

```sql
CREATE TABLE booking_state_changes (
    id UUID PRIMARY KEY,
    booking_id UUID REFERENCES bookings(id),
    sequence_number INTEGER,
    from_status booking_status,
    to_status booking_status,
    change_reason TEXT,
    occurred_at TIMESTAMPTZ,
    UNIQUE(booking_id, sequence_number)
);
```

#### `availability_cache`
Performance optimization for availability queries.

```sql
CREATE TABLE availability_cache (
    id UUID PRIMARY KEY,
    cache_key VARCHAR(255) UNIQUE,
    booking_date DATE,
    time_slot TIME,
    available_tables INTEGER[],
    calculated_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_stale BOOLEAN,
    hit_count INTEGER
);
```

---

## Business Logic Functions

### Booking Reference Generation

```sql
CREATE FUNCTION generate_unique_booking_ref()
RETURNS VARCHAR(20) AS $$
    -- Generates BRL-YYYY-XXXXX format
    -- Uses sequence for uniqueness
    -- Example: BRL-2025-10001
$$
```

### Table Combination Logic

```sql
CREATE FUNCTION check_table_combination(
    p_party_size INTEGER,
    p_booking_date DATE,
    p_arrival_time TIME
) RETURNS TABLE (
    should_combine BOOLEAN,
    combination_id UUID,
    tables INTEGER[],
    total_capacity INTEGER
)
```

**Logic:**
- If party_size between 7-12
- Check tables 15 & 16 availability
- Return combination recommendation

### Customer Booking Limit Enforcement

```sql
CREATE FUNCTION enforce_customer_booking_limit()
RETURNS TRIGGER AS $$
    -- Maximum 2 bookings per customer per night
    -- Tracks tables reserved
    -- Raises exception if limit exceeded
$$
```

### Waitlist Priority Calculation

```sql
CREATE FUNCTION calculate_waitlist_priority(
    p_waitlist_id UUID
) RETURNS INTEGER
```

**Scoring Algorithm:**
```
Base Score: 50
+ Queue Position Bonus: (100 - position)
+ VIP Bonus: 50 (if VIP)
+ Reliability Bonus: 20 (if score ≥ 90)
+ Flexibility Bonus: 15 (accepts any table)
+ Special Occasion: 10
- Time Proximity Penalty
= Final Score (0-1000)
```

### Optimistic Locking Implementation

```sql
CREATE FUNCTION update_booking_with_version_check(
    p_booking_id UUID,
    p_expected_version INTEGER,
    p_updates JSONB
) RETURNS BOOLEAN
```

**Process:**
1. Lock record with `FOR UPDATE NOWAIT`
2. Check version matches expected
3. Update with version increment
4. Return success/failure

### Real-time Availability Query

```sql
CREATE FUNCTION get_real_time_availability(
    p_date DATE,
    p_time TIME,
    p_party_size INTEGER
) RETURNS TABLE (
    table_number INTEGER,
    is_available BOOLEAN,
    can_accommodate BOOLEAN,
    combination_possible BOOLEAN
)
```

---

## Triggers and Automation

### Booking Triggers

1. **`enforce_booking_limit_trigger`**
   - Before INSERT/UPDATE
   - Enforces 2-table limit per customer

2. **`set_booking_ref_trigger`**
   - Before INSERT
   - Auto-generates unique booking reference

3. **`set_check_in_code_trigger`**
   - Before INSERT
   - Generates 6-character check-in code

4. **`track_booking_state_trigger`**
   - After UPDATE
   - Records state changes for audit

### Customer Management Triggers

1. **`update_customer_profile_trigger`**
   - After INSERT on bookings
   - Creates/updates customer profile
   - Tracks booking statistics

### Waitlist Triggers

1. **`update_waitlist_positions_trigger`**
   - After INSERT/UPDATE/DELETE
   - Recalculates queue positions
   - Updates priority scores

### Cache Management Triggers

1. **`invalidate_cache_on_booking_change`**
   - After INSERT/UPDATE/DELETE on bookings
   - Marks cache entries as stale
   - Forces recalculation on next query

---

## Performance Optimization

### Strategic Indexes

```sql
-- Booking performance
CREATE INDEX idx_bookings_date_time ON bookings (booking_date, arrival_time);
CREATE INDEX idx_bookings_customer ON bookings (customer_email, booking_date);
CREATE INDEX idx_bookings_tables ON bookings USING gin(table_ids);
CREATE INDEX idx_bookings_version ON bookings (id, version);

-- Waitlist performance
CREATE INDEX idx_waitlist_active ON waitlist (status, booking_date, priority_score DESC) 
    WHERE status = 'active';

-- Special requests tracking
CREATE INDEX idx_special_requests_status ON special_requests (status) 
    WHERE status != 'completed';

-- Real-time operations
CREATE INDEX idx_booking_holds_active ON booking_holds (status, expires_at) 
    WHERE status = 'active';
```

### Materialized Views

#### `daily_booking_summary`
Pre-calculated daily statistics for dashboard.

```sql
CREATE MATERIALIZED VIEW daily_booking_summary AS
SELECT 
    booking_date,
    COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_count,
    SUM(party_size) as total_guests,
    SUM(package_amount) as total_revenue
FROM bookings
GROUP BY booking_date;
```

#### `table_utilization`
Table usage analytics.

```sql
CREATE MATERIALIZED VIEW table_utilization AS
SELECT 
    table_number,
    COUNT(booking_id) as total_bookings,
    AVG(party_size) as avg_party_size,
    SUM(revenue) as total_revenue
FROM venue_tables
JOIN bookings ON table_number = ANY(table_ids);
```

### Cache Strategy

1. **Availability Cache**
   - TTL: 1 hour
   - Invalidation on booking changes
   - Hit tracking for optimization

2. **Query Optimization**
   - Use cached results when fresh
   - Background refresh for stale entries
   - Parallel calculation for multiple slots

---

## Security and RLS Policies

### Row Level Security Implementation

```sql
-- Enable RLS on all tables
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;

-- Admin access policies
CREATE POLICY "Admins can manage bookings"
    ON bookings FOR ALL
    USING (EXISTS (
        SELECT 1 FROM admin_users
        WHERE id = auth.uid()
        AND role IN ('super_admin', 'manager')
    ));

-- Read-only policies for door staff
CREATE POLICY "Door staff can view bookings"
    ON bookings FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM admin_users
        WHERE id = auth.uid()
        AND role = 'door_staff'
    ));
```

### Data Encryption

- TOTP secrets: AES-256-GCM encrypted
- Password hashes: Argon2id
- Sensitive customer data: Column-level encryption planned

### Audit Trail

All critical operations logged in `admin_activity_log`:
- Booking modifications
- Special request updates
- Waitlist conversions
- Customer profile changes

---

## Migration Strategy

### Zero-Downtime Deployment

1. **Pre-deployment Checks**
   ```sql
   -- Verify existing schema
   SELECT * FROM information_schema.tables 
   WHERE table_schema = 'public';
   
   -- Check for conflicts
   SELECT * FROM pg_locks WHERE granted = false;
   ```

2. **Migration Execution**
   ```bash
   # Run migration with transaction
   psql -1 -f 20250827_phase3_advanced_booking_features.sql
   
   # Verify migration
   psql -c "SELECT * FROM migration_history"
   ```

3. **Post-deployment Validation**
   ```sql
   -- Test core functions
   SELECT generate_unique_booking_ref();
   SELECT check_table_combination(8, CURRENT_DATE, '19:00');
   
   -- Verify triggers
   INSERT INTO bookings (...) -- Test limit enforcement
   ```

### Rollback Procedures

```sql
-- Rollback script (if needed)
BEGIN;
    -- Remove new columns
    ALTER TABLE bookings DROP COLUMN IF EXISTS version CASCADE;
    -- Remove new tables
    DROP TABLE IF EXISTS table_combinations CASCADE;
    -- Restore original state
COMMIT;
```

### Data Migration

```sql
-- Migrate existing bookings
UPDATE bookings SET
    version = 1,
    check_in_code = generate_check_in_code(),
    booking_source = 'legacy'
WHERE version IS NULL;

-- Create customer profiles from bookings
INSERT INTO customer_profiles (email, name, total_bookings)
SELECT customer_email, customer_name, COUNT(*)
FROM bookings
GROUP BY customer_email, customer_name;
```

---

## API Integration Points

### Booking Creation Flow

```typescript
// 1. Check availability
const availability = await getAvailability(date, time, partySize);

// 2. Create hold
const hold = await createBookingHold(tables, duration: 15);

// 3. Process payment
const payment = await processPayment(amount);

// 4. Create booking with version control
const booking = await createBooking({
    ...bookingData,
    version: 1,
    checkInCode: generateCode()
});

// 5. Release hold
await releaseHold(hold.id);
```

### Waitlist Management Flow

```typescript
// 1. Add to waitlist
const entry = await addToWaitlist({
    partySize,
    flexiblePartySize: true,
    acceptsAnyTable: true
});

// 2. Calculate priority
const priority = await calculatePriority(entry.id);

// 3. Match to availability
const matches = await matchWaitlistToAvailability();

// 4. Send notifications
await sendWaitlistNotification(matches);
```

### Real-time Updates

```typescript
// Subscribe to booking changes
supabase
    .from('bookings')
    .on('*', payload => {
        // Handle real-time updates
        invalidateCache(payload.new.booking_date);
        updateDashboard(payload);
    })
    .subscribe();
```

---

## Testing Checklist

### Unit Tests
- [ ] Booking reference generation uniqueness
- [ ] Table combination logic for parties 7-12
- [ ] Customer limit enforcement (2 tables max)
- [ ] Waitlist priority calculation
- [ ] Version control conflict detection

### Integration Tests
- [ ] End-to-end booking creation
- [ ] Waitlist to booking conversion
- [ ] Special request workflow
- [ ] Hold expiry and cleanup
- [ ] Cache invalidation

### Performance Tests
- [ ] Availability query response time (<100ms)
- [ ] Concurrent booking creation (100 simultaneous)
- [ ] Waitlist matching with 1000+ entries
- [ ] Cache hit ratio (>80%)

### Security Tests
- [ ] RLS policy enforcement
- [ ] SQL injection prevention
- [ ] Rate limiting on holds
- [ ] Audit trail completeness

---

## Monitoring and Maintenance

### Key Metrics to Track

1. **Performance Metrics**
   - Average query time
   - Cache hit ratio
   - Index usage statistics
   - Lock contention frequency

2. **Business Metrics**
   - Booking conversion rate
   - Waitlist conversion rate
   - Special request completion rate
   - Table utilization percentage

3. **System Health**
   - Database size growth
   - Connection pool usage
   - Transaction rollback rate
   - Trigger execution time

### Maintenance Tasks

**Daily:**
- Clean expired holds
- Update waitlist positions
- Refresh materialized views

**Weekly:**
- Analyze query performance
- Review slow query log
- Check index bloat

**Monthly:**
- Full database vacuum
- Statistics update
- Archive old booking data

---

## Appendix: Quick Reference

### Common Queries

```sql
-- Get today's bookings with special requests
SELECT b.*, sr.* 
FROM bookings b
LEFT JOIN special_requests sr ON sr.booking_id = b.id
WHERE b.booking_date = CURRENT_DATE
ORDER BY b.arrival_time;

-- Find available tables for party of 8
SELECT * FROM get_real_time_availability(
    CURRENT_DATE, '19:00'::time, 8
);

-- Check customer booking limit
SELECT * FROM customer_booking_limits
WHERE customer_email = 'customer@email.com'
AND booking_date = CURRENT_DATE;

-- Get waitlist with priority scores
SELECT *, calculate_waitlist_priority(id) as score
FROM waitlist
WHERE status = 'active'
ORDER BY score DESC;
```

### Troubleshooting

**Issue: Optimistic lock failures**
```sql
-- Check for high-contention bookings
SELECT id, version, updated_at 
FROM bookings 
WHERE updated_at > NOW() - INTERVAL '1 minute'
ORDER BY updated_at DESC;
```

**Issue: Slow availability queries**
```sql
-- Check cache effectiveness
SELECT cache_key, hit_count, is_stale, calculation_time_ms
FROM availability_cache
ORDER BY hit_count DESC;
```

**Issue: Waitlist not matching**
```sql
-- Debug waitlist matching
SELECT * FROM match_waitlist_to_availability()
WHERE waitlist_id = '[UUID]';
```

---

## Contact and Support

- **Technical Lead**: Architecture Agent
- **Database Administrator**: DBA Team
- **API Support**: Development Team
- **Business Logic**: Product Team

---

*End of Phase 3 Advanced Booking Features Database Schema Documentation*