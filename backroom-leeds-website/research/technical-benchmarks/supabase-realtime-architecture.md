# Supabase Real-time Architecture for Table Booking Management

## Executive Summary

Supabase provides enterprise-grade real-time capabilities with PostgreSQL Row Level Security (RLS) integration, making it ideal for secure, scalable nightclub booking systems. The platform's real-time features with RLS policies ensure data security while maintaining sub-second update propagation for table availability tracking.

## Core Real-time Capabilities

### Real-time with Row Level Security

**Key Features (2025):**
- Real-time database changes broadcast to authenticated users only
- PostgreSQL RLS policies automatically apply to real-time subscriptions
- Performance optimized with colocated security engine in PostgreSQL
- Single connection per subscription reduces overhead significantly

**Security Model:**
```sql
-- Enable RLS for bookings table
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own bookings
CREATE POLICY "users_can_view_own_bookings" ON bookings
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Staff can see all bookings for their venue
CREATE POLICY "staff_can_view_venue_bookings" ON bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM staff_permissions sp
      WHERE sp.user_id = auth.uid()
      AND sp.venue_id = bookings.venue_id
    )
  );
```

### Performance Characteristics

**Real-time Event Processing:**
- **Latency**: < 100ms for database change propagation
- **Throughput**: Handles 1000+ concurrent subscriptions per connection
- **Scalability**: Horizontal scaling with connection pooling
- **Reliability**: Built-in reconnection and event replay mechanisms

**Resource Optimization:**
- Single SQL function execution per change event
- No network I/O overhead for security checks
- Efficient PostgreSQL query planning for RLS policies
- Optimized WebSocket connection management

## Table Availability Tracking Implementation

### Database Schema Design
```sql
-- Tables and capacity management
CREATE TABLE venue_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id),
  table_number VARCHAR(10) NOT NULL,
  capacity INTEGER NOT NULL,
  floor_level VARCHAR(20) NOT NULL, -- 'upstairs' | 'downstairs'
  is_vip BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Real-time booking status
CREATE TABLE table_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID NOT NULL REFERENCES venue_tables(id),
  event_id UUID NOT NULL REFERENCES events(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  booking_status VARCHAR(20) DEFAULT 'pending',
  guest_count INTEGER NOT NULL,
  deposit_amount DECIMAL(10,2),
  booking_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Real-time availability view
CREATE VIEW table_availability AS
SELECT 
  vt.id as table_id,
  vt.table_number,
  vt.capacity,
  vt.floor_level,
  vt.is_vip,
  CASE 
    WHEN tb.id IS NULL THEN 'available'
    WHEN tb.booking_status = 'confirmed' THEN 'booked'
    WHEN tb.booking_status = 'pending' THEN 'pending'
    ELSE 'available'
  END as availability_status,
  tb.guest_count,
  tb.booking_date
FROM venue_tables vt
LEFT JOIN table_bookings tb ON vt.id = tb.table_id 
  AND tb.booking_date::date = CURRENT_DATE
  AND tb.booking_status IN ('confirmed', 'pending');
```

### Real-time Subscription Setup
```typescript
// Client-side real-time availability tracking
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export function useTableAvailability(eventId: string) {
  const [availability, setAvailability] = useState<TableAvailability[]>([]);
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Initial data fetch
    const fetchAvailability = async () => {
      const { data } = await supabase
        .from('table_availability')
        .select('*')
        .eq('event_id', eventId);
      
      setAvailability(data || []);
    };

    // Real-time subscription with RLS
    const subscription = supabase
      .channel('table-availability')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'table_bookings',
          filter: `event_id=eq.${eventId}`
        },
        (payload) => {
          // Update local state based on change type
          handleAvailabilityChange(payload);
        }
      )
      .subscribe();

    fetchAvailability();

    return () => {
      subscription.unsubscribe();
    };
  }, [eventId]);

  return availability;
}
```

## 2FA Authentication Implementation

### Setup and Configuration
```typescript
// Enable MFA for admin users
export async function enableMFA(userId: string) {
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    issuer: 'The Backroom Leeds',
    friendlyName: 'Venue Management System'
  });

  if (error) throw error;
  return data;
}

// Verify MFA during booking operations
export async function verifyMFAForBooking(
  challengeId: string,
  verificationCode: string
) {
  const { data, error } = await supabase.auth.mfa.verify({
    factorId: challengeId,
    challengeId,
    code: verificationCode
  });

  return { success: !error, error };
}
```

### Role-Based Access Control
```sql
-- Custom claims for venue roles
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM staff_permissions sp
  JOIN auth.users u ON sp.user_id = u.id
  WHERE u.id = user_id;
  
  RETURN COALESCE(user_role, 'customer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policy for admin access
CREATE POLICY "admin_full_access" ON table_bookings
  FOR ALL USING (
    get_user_role(auth.uid()) IN ('super_admin', 'manager')
  );
```

## PostgreSQL Triggers for Booking State Management

### Automated Status Updates
```sql
-- Trigger function for booking state changes
CREATE OR REPLACE FUNCTION handle_booking_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log booking status changes
  INSERT INTO booking_audit_log (
    booking_id,
    old_status,
    new_status,
    changed_by,
    changed_at
  ) VALUES (
    NEW.id,
    OLD.booking_status,
    NEW.booking_status,
    auth.uid(),
    NOW()
  );

  -- Handle automatic cancellation for expired pending bookings
  IF NEW.booking_status = 'pending' AND 
     NEW.created_at < NOW() - INTERVAL '15 minutes' THEN
    NEW.booking_status = 'expired';
  END IF;

  -- Notify real-time subscribers of changes
  PERFORM pg_notify(
    'booking_status_change',
    json_build_object(
      'booking_id', NEW.id,
      'table_id', NEW.table_id,
      'status', NEW.booking_status,
      'event_id', NEW.event_id
    )::text
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to bookings table
CREATE TRIGGER booking_status_trigger
  BEFORE UPDATE ON table_bookings
  FOR EACH ROW
  EXECUTE FUNCTION handle_booking_status_change();
```

### Capacity Management Triggers
```sql
-- Prevent overbooking with triggers
CREATE OR REPLACE FUNCTION check_table_capacity()
RETURNS TRIGGER AS $$
DECLARE
  table_capacity INTEGER;
  current_bookings INTEGER;
BEGIN
  -- Get table capacity
  SELECT capacity INTO table_capacity
  FROM venue_tables
  WHERE id = NEW.table_id;

  -- Count current confirmed bookings for the same time slot
  SELECT COALESCE(SUM(guest_count), 0) INTO current_bookings
  FROM table_bookings
  WHERE table_id = NEW.table_id
    AND booking_date = NEW.booking_date
    AND booking_status = 'confirmed'
    AND id != COALESCE(NEW.id, gen_random_uuid());

  -- Prevent overbooking
  IF current_bookings + NEW.guest_count > table_capacity THEN
    RAISE EXCEPTION 'Table capacity exceeded. Capacity: %, Current bookings: %, Requested: %',
      table_capacity, current_bookings, NEW.guest_count;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_overbooking
  BEFORE INSERT OR UPDATE ON table_bookings
  FOR EACH ROW
  EXECUTE FUNCTION check_table_capacity();
```

## Performance Optimization Strategies

### Connection Pooling Configuration
```typescript
// supabase/config.toml
[database]
max_connections = 100
pool_size = 15
pool_timeout = 10
pool_recycle = 3600

[realtime]
max_connections = 1000
websocket_timeout = 30000
```

### Indexing Strategy
```sql
-- Optimized indexes for real-time queries
CREATE INDEX idx_table_bookings_status_date ON table_bookings 
  (booking_status, booking_date) 
  WHERE booking_status IN ('confirmed', 'pending');

CREATE INDEX idx_table_bookings_realtime ON table_bookings 
  (event_id, table_id, booking_date, booking_status);

-- Partial index for active subscriptions
CREATE INDEX idx_active_bookings ON table_bookings 
  (table_id, booking_date) 
  WHERE booking_status != 'cancelled';
```

### Caching Layer
```typescript
// Redis-based caching for high-frequency queries
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function getCachedAvailability(eventId: string) {
  const cached = await redis.get(`availability:${eventId}`);
  if (cached) return cached;

  // Fetch from Supabase if not cached
  const { data } = await supabase
    .from('table_availability')
    .select('*')
    .eq('event_id', eventId);

  // Cache for 30 seconds
  await redis.setex(`availability:${eventId}`, 30, JSON.stringify(data));
  return data;
}
```

## Monitoring and Observability

### Real-time Metrics
```typescript
// Custom metrics for real-time performance
export const realtimeMetrics = {
  subscriptionCount: 0,
  messageLatency: 0,
  connectionDrops: 0,
  
  trackSubscription() {
    this.subscriptionCount++;
  },
  
  trackLatency(startTime: number) {
    this.messageLatency = Date.now() - startTime;
  },
  
  trackConnectionDrop() {
    this.connectionDrops++;
  }
};
```

### Health Checks
```sql
-- Database health monitoring
CREATE OR REPLACE FUNCTION booking_system_health()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'active_connections', (
      SELECT count(*) 
      FROM pg_stat_activity 
      WHERE state = 'active'
    ),
    'pending_bookings', (
      SELECT count(*) 
      FROM table_bookings 
      WHERE booking_status = 'pending'
        AND created_at > NOW() - INTERVAL '1 hour'
    ),
    'realtime_channels', (
      SELECT count(DISTINCT channel) 
      FROM realtime.subscription
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Security Best Practices

### RLS Policy Optimization
```sql
-- Efficient RLS policies with proper indexing
CREATE POLICY "customer_bookings_policy" ON table_bookings
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM staff_permissions sp
      WHERE sp.user_id = auth.uid()
        AND sp.venue_id = (
          SELECT venue_id FROM venue_tables vt 
          WHERE vt.id = table_bookings.table_id
        )
    )
  );

-- Index to support RLS policy
CREATE INDEX idx_staff_permissions_user_venue 
  ON staff_permissions (user_id, venue_id);
```

### Audit Trail Implementation
```sql
-- Comprehensive audit logging
CREATE TABLE booking_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);
```

## Deployment Configuration

### Environment Setup
```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres

# Real-time Configuration  
REALTIME_JWT_SECRET=your-jwt-secret
REALTIME_MAX_CONNECTIONS=1000
REALTIME_WEBSOCKET_TIMEOUT=30000

# Redis Cache
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

### Migration Strategy
```sql
-- Migration: Initial schema setup
-- 001_initial_schema.sql

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create tables, RLS policies, and triggers
-- (Schema definitions from above)

-- Enable realtime for relevant tables
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;

ALTER PUBLICATION supabase_realtime ADD TABLE table_bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE venue_tables;
```

---

*Research conducted: August 2025*
*Sources: Supabase documentation, PostgreSQL performance guides, real-time architecture patterns*