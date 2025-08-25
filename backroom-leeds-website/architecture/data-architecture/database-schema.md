# Database Schema & Row Level Security Architecture

**Version**: 1.0  
**Date**: August 2025  
**Database**: PostgreSQL 15 via Supabase

## Schema Overview

The Backroom Leeds database implements a normalized schema with Row Level Security (RLS) policies, optimized for real-time booking operations and multi-tenant access control.

## Core Design Principles

1. **Data Integrity**: Foreign key constraints and check constraints
2. **Performance**: Strategic indexing and partitioning
3. **Security**: Row Level Security with role-based policies
4. **Auditability**: Comprehensive audit trails and soft deletion
5. **Scalability**: Partitioned tables for high-volume data

## Complete Database Schema

### User Management Tables

```sql
-- Users table with role hierarchy
CREATE TYPE user_role AS ENUM (
  'SUPER_ADMIN',
  'MANAGER', 
  'DOOR_STAFF',
  'CUSTOMER'
);

CREATE TYPE user_status AS ENUM (
  'ACTIVE',
  'SUSPENDED',
  'DELETED'
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE,
  role user_role DEFAULT 'CUSTOMER',
  status user_status DEFAULT 'ACTIVE',
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  
  -- 2FA Configuration
  totp_secret VARCHAR(255),
  totp_enabled BOOLEAN DEFAULT FALSE,
  backup_codes JSONB,
  
  -- Metadata
  preferences JSONB DEFAULT '{}',
  tags VARCHAR(50)[] DEFAULT '{}',
  loyalty_tier VARCHAR(20) DEFAULT 'BRONZE',
  total_spent DECIMAL(10, 2) DEFAULT 0,
  booking_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_phone CHECK (phone ~ '^\+?[0-9]{10,15}$'),
  CONSTRAINT adult_only CHECK (date_of_birth <= CURRENT_DATE - INTERVAL '18 years')
);

-- User authentication sessions
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  device_id VARCHAR(255),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_sessions_user (user_id),
  INDEX idx_sessions_token (token_hash),
  INDEX idx_sessions_expires (expires_at)
);

-- Password reset tokens
CREATE TABLE password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_password_resets_token (token_hash),
  INDEX idx_password_resets_user (user_id)
);
```

### Venue & Table Management

```sql
-- Venue floors configuration
CREATE TABLE venue_floors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  level INTEGER NOT NULL,
  capacity INTEGER NOT NULL,
  layout_config JSONB NOT NULL,
  features VARCHAR(100)[] DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'OPEN',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tables configuration
CREATE TABLE tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_id UUID NOT NULL REFERENCES venue_floors(id),
  table_number INTEGER NOT NULL,
  internal_name VARCHAR(50),
  
  -- Capacity configuration
  capacity_min INTEGER NOT NULL CHECK (capacity_min > 0),
  capacity_max INTEGER NOT NULL CHECK (capacity_max >= capacity_min),
  capacity_optimal INTEGER NOT NULL CHECK (
    capacity_optimal >= capacity_min AND 
    capacity_optimal <= capacity_max
  ),
  
  -- Physical attributes
  shape VARCHAR(20) DEFAULT 'ROUND',
  width_cm INTEGER,
  length_cm INTEGER,
  
  -- Location and features
  position JSONB NOT NULL, -- {x, y, rotation, zone}
  features VARCHAR(50)[] DEFAULT '{}', -- ['window_view', 'corner', 'vip']
  accessibility_features VARCHAR(50)[] DEFAULT '{}',
  
  -- Booking rules
  min_spend DECIMAL(10, 2),
  requires_deposit BOOLEAN DEFAULT TRUE,
  advance_booking_days INTEGER DEFAULT 30,
  
  -- Status management
  status VARCHAR(20) DEFAULT 'AVAILABLE',
  maintenance_notes TEXT,
  
  -- Metadata
  images JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(floor_id, table_number),
  INDEX idx_tables_floor (floor_id),
  INDEX idx_tables_status (status)
);

-- Table availability windows
CREATE TABLE table_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time_slot TSTZRANGE NOT NULL,
  status VARCHAR(20) DEFAULT 'AVAILABLE',
  override_reason TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  EXCLUDE USING gist (table_id WITH =, time_slot WITH &&),
  INDEX idx_availability_date (date),
  INDEX idx_availability_table (table_id)
);
```

### Booking System Tables

```sql
-- Booking statuses
CREATE TYPE booking_status AS ENUM (
  'PENDING',
  'CONFIRMED',
  'CHECKED_IN',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW'
);

-- Main bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_reference VARCHAR(20) UNIQUE NOT NULL,
  customer_id UUID NOT NULL REFERENCES users(id),
  
  -- Booking details
  event_date DATE NOT NULL,
  arrival_time TIME NOT NULL,
  departure_time TIME NOT NULL,
  party_size INTEGER NOT NULL CHECK (party_size > 0),
  
  -- Status tracking
  status booking_status DEFAULT 'PENDING',
  confirmation_sent_at TIMESTAMPTZ,
  reminder_sent_at TIMESTAMPTZ,
  
  -- Financial
  deposit_amount DECIMAL(10, 2) DEFAULT 50.00,
  total_estimated DECIMAL(10, 2),
  total_actual DECIMAL(10, 2),
  
  -- Package selection
  drinks_package_id UUID REFERENCES drinks_packages(id),
  special_requests TEXT,
  dietary_requirements JSONB DEFAULT '[]',
  celebration_type VARCHAR(50),
  
  -- Check-in details
  qr_code VARCHAR(255) UNIQUE,
  checked_in_at TIMESTAMPTZ,
  checked_in_by UUID REFERENCES users(id),
  check_in_notes TEXT,
  
  -- Guest information
  guest_names JSONB DEFAULT '[]',
  guest_contact_consent BOOLEAN DEFAULT FALSE,
  
  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES users(id),
  cancellation_reason TEXT,
  refund_amount DECIMAL(10, 2),
  
  -- Source tracking
  booking_source VARCHAR(50) DEFAULT 'WEBSITE',
  referral_code VARCHAR(50),
  utm_params JSONB DEFAULT '{}',
  
  -- Metadata
  tags VARCHAR(50)[] DEFAULT '{}',
  internal_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_booking_times CHECK (arrival_time < departure_time),
  CONSTRAINT valid_party_size CHECK (party_size <= 50),
  CONSTRAINT future_booking CHECK (event_date >= CURRENT_DATE),
  
  -- Indexes
  INDEX idx_bookings_customer (customer_id),
  INDEX idx_bookings_date (event_date),
  INDEX idx_bookings_status (status),
  INDEX idx_bookings_reference (booking_reference),
  INDEX idx_bookings_qr (qr_code)
);

-- Booking-table associations
CREATE TABLE booking_tables (
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  table_id UUID NOT NULL REFERENCES tables(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),
  
  PRIMARY KEY (booking_id, table_id),
  INDEX idx_booking_tables_booking (booking_id),
  INDEX idx_booking_tables_table (table_id)
);

-- Booking status history
CREATE TABLE booking_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  from_status booking_status,
  to_status booking_status NOT NULL,
  changed_by UUID REFERENCES users(id),
  change_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_history_booking (booking_id),
  INDEX idx_history_created (created_at)
);

-- Waitlist for fully booked dates
CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES users(id),
  event_date DATE NOT NULL,
  party_size INTEGER NOT NULL,
  preferred_time TIME,
  flexibility_hours INTEGER DEFAULT 2,
  contact_preference VARCHAR(20) DEFAULT 'EMAIL',
  status VARCHAR(20) DEFAULT 'WAITING',
  notified_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,
  converted_booking_id UUID REFERENCES bookings(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_waitlist_date (event_date),
  INDEX idx_waitlist_customer (customer_id),
  INDEX idx_waitlist_status (status)
);
```

### Payment & Financial Tables

```sql
-- Payment methods
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES users(id),
  stripe_payment_method_id VARCHAR(255) UNIQUE NOT NULL,
  type VARCHAR(20) NOT NULL,
  last_four VARCHAR(4),
  brand VARCHAR(20),
  exp_month INTEGER,
  exp_year INTEGER,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_payment_methods_customer (customer_id)
);

-- Payment transactions
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  stripe_charge_id VARCHAR(255),
  
  -- Amount details
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'GBP',
  fee_amount DECIMAL(10, 2),
  net_amount DECIMAL(10, 2),
  
  -- Payment details
  type VARCHAR(20) NOT NULL, -- DEPOSIT, FINAL, REFUND
  status VARCHAR(20) NOT NULL,
  payment_method_id UUID REFERENCES payment_methods(id),
  
  -- Processing details
  processed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,
  
  -- Refund details
  refunded_amount DECIMAL(10, 2) DEFAULT 0,
  refund_reason TEXT,
  refunded_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_payments_booking (booking_id),
  INDEX idx_payments_intent (stripe_payment_intent_id),
  INDEX idx_payments_status (status)
);

-- Drinks packages
CREATE TABLE drinks_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  min_people INTEGER DEFAULT 1,
  max_people INTEGER,
  includes JSONB NOT NULL,
  terms TEXT,
  available_days VARCHAR(10)[] DEFAULT '{MON,TUE,WED,THU,FRI,SAT,SUN}',
  valid_from DATE,
  valid_until DATE,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_packages_active (is_active),
  INDEX idx_packages_price (price)
);
```

### Event Management Tables

```sql
-- Events and special nights
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  type VARCHAR(50) NOT NULL,
  
  -- Event timing
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  doors_open TIME,
  last_entry TIME,
  
  -- Details
  description TEXT,
  lineup JSONB DEFAULT '[]',
  images JSONB DEFAULT '[]',
  
  -- Ticketing
  ticket_link VARCHAR(500),
  ticket_price DECIMAL(10, 2),
  capacity_override INTEGER,
  
  -- Status
  status VARCHAR(20) DEFAULT 'SCHEDULED',
  published BOOLEAN DEFAULT FALSE,
  featured BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  tags VARCHAR(50)[] DEFAULT '{}',
  seo_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_events_date (event_date),
  INDEX idx_events_slug (slug),
  INDEX idx_events_status (status)
);

-- Artist/DJ profiles
CREATE TABLE artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  bio TEXT,
  genres VARCHAR(50)[] DEFAULT '{}',
  social_links JSONB DEFAULT '{}',
  images JSONB DEFAULT '[]',
  rider_requirements TEXT,
  fee_range_min DECIMAL(10, 2),
  fee_range_max DECIMAL(10, 2),
  is_resident BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_artists_slug (slug),
  INDEX idx_artists_active (is_active)
);

-- Event artist associations
CREATE TABLE event_artists (
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES artists(id),
  performance_time TIME,
  set_duration_minutes INTEGER,
  fee_agreed DECIMAL(10, 2),
  
  PRIMARY KEY (event_id, artist_id)
);
```

### Audit & Compliance Tables

```sql
-- Comprehensive audit log
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  
  -- Change tracking
  old_values JSONB,
  new_values JSONB,
  
  -- Context
  ip_address INET,
  user_agent TEXT,
  session_id UUID,
  
  -- Compliance
  requires_review BOOLEAN DEFAULT FALSE,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_audit_user (user_id),
  INDEX idx_audit_entity (entity_type, entity_id),
  INDEX idx_audit_created (created_at),
  INDEX idx_audit_action (action)
) PARTITION BY RANGE (created_at);

-- Create monthly partitions for audit log
CREATE TABLE audit_log_2025_08 PARTITION OF audit_log
  FOR VALUES FROM ('2025-08-01') TO ('2025-09-01');

-- GDPR consent tracking
CREATE TABLE consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  consent_type VARCHAR(50) NOT NULL,
  granted BOOLEAN NOT NULL,
  version VARCHAR(20) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  withdrawn_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_consent_user (user_id),
  INDEX idx_consent_type (consent_type)
);

-- Data retention policies
CREATE TABLE data_retention (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL UNIQUE,
  retention_days INTEGER NOT NULL,
  deletion_strategy VARCHAR(50) NOT NULL, -- HARD_DELETE, ANONYMIZE, ARCHIVE
  last_cleanup_at TIMESTAMPTZ,
  next_cleanup_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Row Level Security (RLS) Policies

### User Table Policies

```sql
-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "users_select_own" ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Staff can view all users
CREATE POLICY "users_select_staff" ON users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('SUPER_ADMIN', 'MANAGER', 'DOOR_STAFF')
    )
  );

-- Users can update their own profile
CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    -- Cannot change role or status
    role = (SELECT role FROM users WHERE id = auth.uid()) AND
    status = (SELECT status FROM users WHERE id = auth.uid())
  );

-- Only super admins can update other users
CREATE POLICY "users_update_admin" ON users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'SUPER_ADMIN'
    )
  );
```

### Booking Table Policies

```sql
-- Enable RLS on bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Customers can view their own bookings
CREATE POLICY "bookings_select_own" ON bookings
  FOR SELECT
  USING (customer_id = auth.uid());

-- Staff can view all bookings
CREATE POLICY "bookings_select_staff" ON bookings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'MANAGER', 'DOOR_STAFF')
    )
  );

-- Customers can insert their own bookings
CREATE POLICY "bookings_insert_customer" ON bookings
  FOR INSERT
  WITH CHECK (
    customer_id = auth.uid() AND
    status = 'PENDING'
  );

-- Customers can update their own pending bookings
CREATE POLICY "bookings_update_own" ON bookings
  FOR UPDATE
  USING (
    customer_id = auth.uid() AND
    status = 'PENDING'
  )
  WITH CHECK (
    customer_id = auth.uid() AND
    status IN ('PENDING', 'CANCELLED')
  );

-- Managers can update any booking
CREATE POLICY "bookings_update_manager" ON bookings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'MANAGER')
    )
  );

-- Door staff can only check in bookings
CREATE POLICY "bookings_checkin_door" ON bookings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'DOOR_STAFF'
    )
  )
  WITH CHECK (
    -- Can only change status to checked_in
    status = 'CHECKED_IN' AND
    (SELECT status FROM bookings WHERE id = bookings.id) = 'CONFIRMED'
  );
```

### Payment Table Policies

```sql
-- Enable RLS on payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Users can view payments for their bookings
CREATE POLICY "payments_select_own" ON payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = payments.booking_id
      AND bookings.customer_id = auth.uid()
    )
  );

-- Staff can view all payments
CREATE POLICY "payments_select_staff" ON payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'MANAGER')
    )
  );

-- Only system can insert payments (via service role)
CREATE POLICY "payments_insert_system" ON payments
  FOR INSERT
  WITH CHECK (FALSE);

-- Only managers can update payments
CREATE POLICY "payments_update_manager" ON payments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'MANAGER')
    )
  );
```

## Performance Optimization

### Strategic Indexes

```sql
-- Composite indexes for common queries
CREATE INDEX idx_bookings_lookup 
  ON bookings(event_date, status) 
  WHERE status IN ('CONFIRMED', 'CHECKED_IN');

CREATE INDEX idx_bookings_customer_history 
  ON bookings(customer_id, event_date DESC);

CREATE INDEX idx_availability_lookup 
  ON table_availability(date, status) 
  WHERE status = 'AVAILABLE';

-- Partial indexes for performance
CREATE INDEX idx_active_users 
  ON users(email) 
  WHERE status = 'ACTIVE';

CREATE INDEX idx_upcoming_bookings 
  ON bookings(event_date) 
  WHERE status = 'CONFIRMED' 
  AND event_date >= CURRENT_DATE;

-- BRIN indexes for time-series data
CREATE INDEX idx_audit_log_time_brin 
  ON audit_log 
  USING BRIN(created_at);

-- GIN indexes for JSONB columns
CREATE INDEX idx_users_preferences_gin 
  ON users 
  USING GIN(preferences);

CREATE INDEX idx_bookings_metadata_gin 
  ON bookings 
  USING GIN(utm_params);
```

### Materialized Views

```sql
-- Daily booking summary
CREATE MATERIALIZED VIEW daily_booking_summary AS
SELECT 
  event_date,
  COUNT(*) as total_bookings,
  COUNT(*) FILTER (WHERE status = 'CONFIRMED') as confirmed_count,
  COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled_count,
  SUM(party_size) as total_guests,
  AVG(party_size) as avg_party_size,
  SUM(deposit_amount) as total_deposits,
  COUNT(DISTINCT customer_id) as unique_customers
FROM bookings
GROUP BY event_date
WITH DATA;

CREATE UNIQUE INDEX ON daily_booking_summary(event_date);

-- Table utilization view
CREATE MATERIALIZED VIEW table_utilization AS
SELECT 
  t.id as table_id,
  t.table_number,
  t.floor_id,
  DATE(b.event_date) as date,
  COUNT(bt.booking_id) as bookings_count,
  SUM(b.party_size) as total_guests,
  ROUND(
    COUNT(bt.booking_id)::numeric / 
    NULLIF(COUNT(*) OVER (PARTITION BY DATE(b.event_date)), 0) * 100, 
    2
  ) as utilization_percentage
FROM tables t
LEFT JOIN booking_tables bt ON t.id = bt.table_id
LEFT JOIN bookings b ON bt.booking_id = b.id
WHERE b.status IN ('CONFIRMED', 'CHECKED_IN', 'COMPLETED')
GROUP BY t.id, t.table_number, t.floor_id, DATE(b.event_date)
WITH DATA;

CREATE INDEX ON table_utilization(date, table_id);

-- Customer lifetime value
CREATE MATERIALIZED VIEW customer_lifetime_value AS
SELECT 
  u.id as customer_id,
  u.email,
  COUNT(DISTINCT b.id) as total_bookings,
  SUM(p.amount) as lifetime_spent,
  AVG(p.amount) as avg_spend,
  MAX(b.event_date) as last_booking_date,
  MIN(b.event_date) as first_booking_date,
  CASE 
    WHEN SUM(p.amount) > 1000 THEN 'VIP'
    WHEN SUM(p.amount) > 500 THEN 'GOLD'
    WHEN SUM(p.amount) > 200 THEN 'SILVER'
    ELSE 'BRONZE'
  END as loyalty_tier
FROM users u
LEFT JOIN bookings b ON u.id = b.customer_id
LEFT JOIN payments p ON b.id = p.booking_id
WHERE b.status IN ('COMPLETED', 'CHECKED_IN')
GROUP BY u.id, u.email
WITH DATA;

CREATE UNIQUE INDEX ON customer_lifetime_value(customer_id);
```

### Database Functions & Triggers

```sql
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_bookings_updated_at 
  BEFORE UPDATE ON bookings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Generate unique booking reference
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS TRIGGER AS $$
DECLARE
  reference VARCHAR(20);
BEGIN
  LOOP
    reference := 'BR' || LPAD(
      FLOOR(RANDOM() * 100000000)::text, 
      8, 
      '0'
    );
    
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM bookings WHERE booking_reference = reference
    );
  END LOOP;
  
  NEW.booking_reference := reference;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_booking_ref 
  BEFORE INSERT ON bookings 
  FOR EACH ROW 
  WHEN (NEW.booking_reference IS NULL)
  EXECUTE FUNCTION generate_booking_reference();

-- Audit trail function
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (
    user_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values,
    ip_address,
    session_id
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
    current_setting('request.headers')::json->>'x-forwarded-for',
    current_setting('request.jwt.claims')::json->>'session_id'
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to sensitive tables
CREATE TRIGGER audit_bookings 
  AFTER INSERT OR UPDATE OR DELETE ON bookings 
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_payments 
  AFTER INSERT OR UPDATE OR DELETE ON payments 
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- Real-time notification function
CREATE OR REPLACE FUNCTION notify_booking_change()
RETURNS TRIGGER AS $$
DECLARE
  payload JSON;
BEGIN
  payload := json_build_object(
    'operation', TG_OP,
    'booking_id', NEW.id,
    'customer_id', NEW.customer_id,
    'event_date', NEW.event_date,
    'status', NEW.status,
    'tables', (
      SELECT array_agg(table_id) 
      FROM booking_tables 
      WHERE booking_id = NEW.id
    )
  );
  
  PERFORM pg_notify('booking_updates', payload::text);
  
  -- Send to specific channel for the date
  PERFORM pg_notify(
    'bookings_' || NEW.event_date::text, 
    payload::text
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_change_notify 
  AFTER INSERT OR UPDATE ON bookings 
  FOR EACH ROW EXECUTE FUNCTION notify_booking_change();

-- Capacity management function
CREATE OR REPLACE FUNCTION check_table_capacity()
RETURNS TRIGGER AS $$
DECLARE
  table_capacity RECORD;
BEGIN
  SELECT capacity_min, capacity_max 
  INTO table_capacity
  FROM tables 
  WHERE id = NEW.table_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Table not found';
  END IF;
  
  -- Check if party size fits table capacity
  IF EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.id = NEW.booking_id
    AND (
      b.party_size < table_capacity.capacity_min OR
      b.party_size > table_capacity.capacity_max
    )
  ) THEN
    RAISE EXCEPTION 'Party size does not fit table capacity';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_capacity 
  BEFORE INSERT ON booking_tables 
  FOR EACH ROW EXECUTE FUNCTION check_table_capacity();
```

## Migration Strategy

### Initial Setup

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS public;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS analytics;

-- Set default permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT SELECT ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT INSERT, UPDATE, DELETE ON TABLES TO service_role;
```

### Data Seeding

```sql
-- Insert venue floors
INSERT INTO venue_floors (name, level, capacity, layout_config) VALUES
('Upstairs', 1, 120, '{"zones": ["main", "bar", "lounge"]}'),
('Downstairs', 0, 80, '{"zones": ["dance_floor", "vip", "bar"]}');

-- Insert tables (16 total)
INSERT INTO tables (
  floor_id, 
  table_number, 
  capacity_min, 
  capacity_max, 
  capacity_optimal,
  position,
  features
) 
SELECT 
  f.id,
  t.number,
  t.min_cap,
  t.max_cap,
  t.optimal_cap,
  jsonb_build_object('x', t.x, 'y', t.y, 'zone', t.zone),
  t.features
FROM venue_floors f
CROSS JOIN LATERAL (
  VALUES 
    -- Upstairs tables (10)
    (1, 2, 6, 4, 100, 200, 'main', ARRAY['window_view']),
    (2, 2, 6, 4, 150, 200, 'main', ARRAY['window_view']),
    (3, 4, 8, 6, 200, 200, 'main', ARRAY['corner']),
    (4, 4, 10, 6, 100, 300, 'main', ARRAY['central']),
    (5, 6, 12, 8, 150, 300, 'main', ARRAY['central']),
    (6, 2, 4, 3, 250, 100, 'bar', ARRAY['bar_view']),
    (7, 2, 4, 3, 250, 150, 'bar', ARRAY['bar_view']),
    (8, 4, 8, 6, 300, 250, 'lounge', ARRAY['sofa', 'private']),
    (9, 6, 10, 8, 350, 250, 'lounge', ARRAY['sofa', 'vip']),
    (10, 8, 12, 10, 400, 250, 'lounge', ARRAY['sofa', 'vip'])
) AS t(number, min_cap, max_cap, optimal_cap, x, y, zone, features)
WHERE f.name = 'Upstairs'

UNION ALL

SELECT 
  f.id,
  t.number,
  t.min_cap,
  t.max_cap,
  t.optimal_cap,
  jsonb_build_object('x', t.x, 'y', t.y, 'zone', t.zone),
  t.features
FROM venue_floors f
CROSS JOIN LATERAL (
  VALUES 
    -- Downstairs tables (6)
    (11, 4, 8, 6, 100, 100, 'dance_floor', ARRAY['dj_view']),
    (12, 4, 8, 6, 150, 100, 'dance_floor', ARRAY['dj_view']),
    (13, 6, 10, 8, 200, 150, 'vip', ARRAY['vip', 'bottle_service']),
    (14, 8, 12, 10, 250, 150, 'vip', ARRAY['vip', 'bottle_service']),
    (15, 2, 6, 4, 300, 100, 'bar', ARRAY['bar_view', 'high_table']),
    (16, 4, 8, 6, 350, 100, 'bar', ARRAY['bar_view'])
) AS t(number, min_cap, max_cap, optimal_cap, x, y, zone, features)
WHERE f.name = 'Downstairs';

-- Insert drinks packages
INSERT INTO drinks_packages (name, description, price, includes) VALUES
('Bronze Package', 'Entry level package with house spirits', 170.00, 
  '{"spirits": ["vodka", "gin", "rum"], "mixers": ["unlimited"], "shots": 10}'),
('Silver Package', 'Premium spirits and champagne', 280.00,
  '{"spirits": ["grey_goose", "hendricks", "bacardi"], "champagne": 1, "mixers": ["unlimited"], "shots": 20}'),
('Gold Package', 'Luxury experience with premium bottles', 450.00,
  '{"bottles": ["grey_goose", "hennessy", "dom_perignon"], "mixers": ["unlimited"], "service": "dedicated_host"}'),
('Platinum Package', 'Ultimate VIP experience', 580.00,
  '{"bottles": ["cristal", "hennessy_paradis", "grey_goose_magnum"], "service": "vip_host", "perks": ["skip_queue", "vip_area"]}');

-- Create data retention policies
INSERT INTO data_retention (entity_type, retention_days, deletion_strategy) VALUES
('audit_log', 2555, 'ARCHIVE'),        -- 7 years for financial
('bookings', 2555, 'ANONYMIZE'),       -- 7 years 
('payments', 2555, 'ARCHIVE'),         -- 7 years
('user_sessions', 30, 'HARD_DELETE'),  -- 30 days
('password_resets', 7, 'HARD_DELETE'); -- 7 days
```

## Backup & Recovery

### Automated Backup Strategy

```sql
-- Point-in-time recovery configuration
ALTER SYSTEM SET wal_level = 'replica';
ALTER SYSTEM SET archive_mode = 'on';
ALTER SYSTEM SET archive_command = 'cp %p /backup/wal/%f';

-- Backup policy
CREATE OR REPLACE FUNCTION backup_database()
RETURNS void AS $$
BEGIN
  -- Full backup daily at 3 AM
  PERFORM pg_backup_start('daily_backup');
  
  -- Incremental WAL archiving
  PERFORM pg_switch_wal();
  
  PERFORM pg_backup_stop();
END;
$$ LANGUAGE plpgsql;

-- Schedule via pg_cron
SELECT cron.schedule(
  'daily-backup',
  '0 3 * * *',
  'SELECT backup_database()'
);
```

## Monitoring & Alerting

### Performance Monitoring Queries

```sql
-- Table bloat monitoring
CREATE OR REPLACE VIEW table_bloat AS
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS bloat_size,
  round(100 * (pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) / pg_total_relation_size(schemaname||'.'||tablename)) AS bloat_pct
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Slow query monitoring
CREATE OR REPLACE VIEW slow_queries AS
SELECT
  query,
  calls,
  total_time,
  mean_time,
  min_time,
  max_time,
  stddev_time
FROM pg_stat_statements
WHERE mean_time > 100 -- queries slower than 100ms
ORDER BY mean_time DESC
LIMIT 20;

-- Connection monitoring
CREATE OR REPLACE VIEW connection_stats AS
SELECT
  datname,
  numbackends,
  xact_commit,
  xact_rollback,
  blks_read,
  blks_hit,
  tup_returned,
  tup_fetched,
  tup_inserted,
  tup_updated,
  tup_deleted
FROM pg_stat_database
WHERE datname NOT IN ('template0', 'template1');
```

## Security Hardening

### Additional Security Measures

```sql
-- Encrypt sensitive columns
ALTER TABLE users 
  ALTER COLUMN totp_secret TYPE text 
  USING pgp_sym_encrypt(totp_secret::text, current_setting('app.encryption_key'));

-- Create security definer functions for sensitive operations
CREATE OR REPLACE FUNCTION process_payment(
  p_booking_id UUID,
  p_amount DECIMAL,
  p_payment_intent_id TEXT
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment_id UUID;
BEGIN
  -- Validate booking exists and is valid
  IF NOT EXISTS (
    SELECT 1 FROM bookings 
    WHERE id = p_booking_id 
    AND status = 'CONFIRMED'
  ) THEN
    RAISE EXCEPTION 'Invalid booking';
  END IF;
  
  -- Insert payment with elevated privileges
  INSERT INTO payments (
    booking_id,
    amount,
    stripe_payment_intent_id,
    type,
    status
  ) VALUES (
    p_booking_id,
    p_amount,
    p_payment_intent_id,
    'DEPOSIT',
    'PENDING'
  ) RETURNING id INTO v_payment_id;
  
  RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql;

-- Grant minimal permissions
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- Specific grants for service role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
```

---

*Database architecture designed for The Backroom Leeds by Claude Opus 4.1 Architecture Agent*