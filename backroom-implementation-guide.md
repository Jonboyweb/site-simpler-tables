# The Backroom Leeds Website - AI Agent Implementation Guide

## 🎯 Project Overview
**Project**: Prohibition-themed nightclub website for "The Backroom" Leeds  
**Tech Stack**: Next.js 15.5, Supabase, Stripe, TypeScript  
**Target**: Mobile-first responsive design with real-time table booking system  

---

## 👥 AI Agent Team Structure

### 1. **Research Agent (RA)**
- Researches official documentation for Next.js 15.5, Supabase, Stripe
- Validates all code patterns against current best practices
- Documents API changes and deprecations

### 2. **Architecture Agent (AA)**
- Plans system architecture based on research
- Creates component hierarchy and data flow diagrams
- Defines database schema and API structure

### 3. **Development Agent (DA)**
- Implements code based on researched patterns
- Creates unit tests for each component
- Documents code with inline comments

### 4. **Testing Agent (TA)**
- Executes unit tests and integration tests
- Documents all errors and fixes
- Validates performance metrics

### 5. **Documentation Agent (DocA)**
- Maintains project documentation
- Updates progress tracking
- Creates deployment guides

---

## 📋 Implementation Phases

## Phase 1: Research & Planning (Days 1-3)

### Step 1.1: Technology Stack Research
**Owner**: Research Agent

#### Research Tasks:
```markdown
□ Research Next.js 15.5 official documentation
  - App Router patterns
  - Server Components vs Client Components
  - Middleware implementation
  - Image optimization strategies
  
□ Research Supabase documentation
  - Real-time subscriptions for table availability
  - Row Level Security (RLS) policies
  - Database triggers and functions
  - Authentication patterns
  
□ Research Stripe documentation
  - Payment Intent API for deposits
  - Webhook handling
  - PCI compliance requirements
  - Testing with Stripe CLI
  
□ Research deployment best practices
  - Vercel deployment configuration
  - Environment variable management
  - CI/CD pipeline setup
```

#### Documentation Requirements:
```markdown
CREATE: /docs/research/tech-stack-findings.md
INCLUDE:
- Version numbers and compatibility matrix
- Official documentation links
- Code examples from official sources
- Potential deprecation warnings
- Alternative solutions for each technology
```

### Step 1.2: Architecture Planning
**Owner**: Architecture Agent

#### Tasks:
```markdown
□ Create database schema based on requirements
□ Design component architecture
□ Plan API routes structure
□ Define state management approach
□ Create security model
```

#### Deliverable:
```markdown
CREATE: /docs/architecture/system-design.md
INCLUDE:
- Database ERD diagram
- Component hierarchy diagram
- API endpoint documentation
- Authentication flow diagram
- Deployment architecture
```

---

## Phase 2: Project Setup & Configuration (Days 4-5)

### Step 2.1: Initialize Next.js Project
**Owner**: Development Agent

#### Pre-Implementation Research:
```bash
# Research Agent must verify from official docs:
- Next.js 15.5 create-next-app syntax
- TypeScript configuration best practices
- ESLint and Prettier setup
- Tailwind CSS integration
```

#### Implementation:
```bash
npx create-next-app@15.5 backroom-leeds --typescript --tailwind --app --src-dir
cd backroom-leeds
```

#### Unit Test:
```typescript
// tests/setup/project-structure.test.ts
describe('Project Structure Validation', () => {
  test('Next.js 15.5 configuration exists', () => {
    // Verify next.config.js exists and has correct version
    // Check package.json for correct dependencies
    // Validate TypeScript configuration
  });
});
```

#### Git Commit:
```bash
git init
git add .
git commit -m "feat: Initialize Next.js 15.5 project with TypeScript and Tailwind"
git push origin main
```

### Step 2.2: Supabase Setup
**Owner**: Development Agent

#### Research Requirements:
```markdown
□ Latest Supabase client SDK setup
□ Environment variable configuration
□ Type generation from database
□ Connection pooling best practices
```

#### Implementation:
```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

#### Database Schema:
```sql
-- Research Agent must verify this against Supabase best practices

-- Events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  description TEXT,
  ticket_link VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tables configuration
CREATE TABLE venue_tables (
  id SERIAL PRIMARY KEY,
  table_number INTEGER NOT NULL,
  floor VARCHAR(20) NOT NULL,
  capacity_min INTEGER NOT NULL,
  capacity_max INTEGER NOT NULL,
  description TEXT,
  features TEXT[]
);

-- Bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id),
  table_id INTEGER REFERENCES venue_tables(id),
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  party_size INTEGER NOT NULL,
  booking_date DATE NOT NULL,
  drinks_package JSONB,
  deposit_paid BOOLEAN DEFAULT FALSE,
  stripe_payment_intent_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
```

#### Unit Test:
```typescript
// tests/database/schema-validation.test.ts
describe('Database Schema Validation', () => {
  test('All required tables exist', async () => {
    // Connect to Supabase
    // Verify table structures
    // Check RLS policies
  });
});
```

---

## Phase 3: Core Features Implementation (Days 6-20)

### Step 3.1: Events Listing Page
**Owner**: Development Agent

#### Research Checkpoint:
```markdown
RESEARCH AGENT MUST VERIFY:
□ Next.js 15.5 Server Components data fetching patterns
□ Suspense boundaries implementation
□ Error handling best practices
□ SEO optimization techniques
```

#### Implementation Structure:
```typescript
// app/events/page.tsx
// CODE MUST BE BASED ON OFFICIAL NEXT.JS 15.5 DOCUMENTATION

import { Suspense } from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

// Research Agent: Verify this pattern from official docs
export default async function EventsPage() {
  // Implementation based on researched patterns
}
```

#### Unit Tests Required:
```typescript
// tests/pages/events.test.tsx
describe('Events Page', () => {
  test('Renders weekly events correctly', () => {});
  test('CTA buttons link to correct URLs', () => {});
  test('Handles loading states', () => {});
  test('Handles error states', () => {});
});
```

### Step 3.2: Table Booking System
**Owner**: Development Agent

#### Critical Research Points:
```markdown
RESEARCH REQUIRED BEFORE IMPLEMENTATION:
□ Real-time availability using Supabase subscriptions
□ Stripe Payment Intent for £50 deposits
□ Form validation with React Hook Form or official solution
□ Accessibility standards (WCAG 2.1)
□ UK GDPR compliance for data handling
```

#### Component Breakdown:
```markdown
1. TableAvailability Component
   - Real-time updates via Supabase
   - Visual table layout
   - Capacity filtering
   - Time slot selection (11pm, 11:30pm, 12am, 12:30am, 1am)

2. BookingForm Component
   - Multi-step form with arrival time selection
   - Customer details collection (GDPR compliant)
   - Drinks package selection
   - Payment integration (£50 deposit)
   - 48-hour cancellation policy display

3. PaymentProcessor Component
   - Stripe Elements integration
   - 3D Secure handling
   - Failed payment retry UI
   - No automatic retry logic

4. CancellationHandler Component
   - 48-hour policy check
   - Refund eligibility calculation
   - Email notification trigger
   - Deposit status update
```

#### Database Schema Updates:
```sql
-- Add arrival time and cancellation fields to bookings table
ALTER TABLE bookings 
ADD COLUMN arrival_time TIME NOT NULL,
ADD COLUMN cancelled_at TIMESTAMPTZ,
ADD COLUMN cancellation_reason TEXT,
ADD COLUMN refund_eligible BOOLEAN,
ADD COLUMN refund_processed BOOLEAN DEFAULT FALSE;

-- Create email_notifications table for tracking
CREATE TABLE email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id),
  type VARCHAR(50) NOT NULL, -- 'confirmation', 'cancellation', 'refund_request'
  recipient_email VARCHAR(255) NOT NULL,
  cc_emails TEXT[],
  sent_at TIMESTAMPTZ,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Testing Strategy:
```markdown
For each component:
1. Unit tests for business logic
2. Integration tests for API calls
3. E2E tests for booking flow
4. Accessibility tests
5. Performance tests (Core Web Vitals)
```

---

## 📊 Progress Tracking System

### Daily Standup Format:
```markdown
## Date: [DATE]
### Research Agent Report:
- Documentation reviewed: [LINKS]
- New findings: [SUMMARY]
- Deprecated patterns found: [LIST]

### Development Progress:
- Components completed: [LIST]
- Tests written: [COUNT]
- Tests passing: [COUNT]
- Blockers: [LIST]

### Errors Encountered:
- Error: [DESCRIPTION]
- Research conducted: [LINKS]
- Solution applied: [CODE]
- Test verification: [RESULT]
```

### Git Commit Strategy:
```bash
# Commit after each verified step
git add [files]
git commit -m "type(scope): description

- Research sources: [LINKS]
- Tests passing: X/Y
- Performance metrics: [DATA]"

# Push to feature branch
git push origin feature/[feature-name]

# Create PR with test results
```

---

## 🚨 Error Handling Protocol

### When Errors Occur:
1. **Document the error immediately**
   ```markdown
   ERROR LOG: [timestamp]
   Component: [name]
   Error: [full error message]
   Stack trace: [trace]
   ```

2. **Research the solution**
   ```markdown
   RESEARCH CONDUCTED:
   - Official docs checked: [LINKS]
   - GitHub issues reviewed: [LINKS]
   - Solution source: [LINK]
   ```

3. **Implement fix with test**
   ```typescript
   // test to verify fix
   test('Error case: [description]', () => {
     // Test that previously failed
     // Now passes with fix
   });
   ```

4. **Update documentation**
   ```markdown
   RESOLUTION LOG:
   - Root cause: [description]
   - Fix applied: [code reference]
   - Test verification: [test file]
   - Prevention strategy: [description]
   ```

---

## 🔄 Communication Protocol

### Inter-Agent Communication:
```markdown
## Message Format:
FROM: [Agent Role]
TO: [Agent Role]
SUBJECT: [Clear subject]
PRIORITY: [HIGH/MEDIUM/LOW]

CONTEXT:
[Relevant background]

REQUEST/FINDING:
[Specific request or finding]

SOURCES:
[Documentation links]

ACTION REQUIRED:
[Specific next steps]
```

### Questions for Product Owner:
```markdown
## Clarification Request Template:
COMPONENT: [Component name]
QUESTION: [Specific question]
CONTEXT: [Why this matters]
OPTIONS CONSIDERED:
1. [Option 1 with pros/cons]
2. [Option 2 with pros/cons]
RECOMMENDATION: [If applicable]
URGENCY: [Blocking/Non-blocking]
```

---

## 🧪 Testing Requirements

### For Every Feature:
1. **Unit Tests** (minimum 80% coverage)
   ```typescript
   describe('[Feature Name]', () => {
     // Positive cases
     // Negative cases
     // Edge cases
     // Error handling
   });
   ```

2. **Integration Tests**
   ```typescript
   describe('[Feature] Integration', () => {
     // API calls
     // Database operations
     // External service integration
   });
   ```

3. **Performance Tests**
   ```typescript
   describe('[Feature] Performance', () => {
     // Load time < 2 seconds
     // Core Web Vitals scores
     // Memory usage
   });
   ```

---

## 📚 Documentation Requirements

### For Each Component:
```typescript
/**
 * Component: [Name]
 * Purpose: [Clear description]
 * 
 * Research Sources:
 * - [Official doc link 1]
 * - [Official doc link 2]
 * 
 * Dependencies:
 * - [Package@version]
 * 
 * Props:
 * @param {Type} propName - Description
 * 
 * State Management:
 * - [Description of state]
 * 
 * Side Effects:
 * - [List any side effects]
 * 
 * Testing:
 * - Unit tests: /tests/[path]
 * - Coverage: X%
 * 
 * Performance:
 * - Render time: Xms
 * - Bundle size: XkB
 */
```

---

## 🚀 Deployment Checklist

### Pre-Deployment Validation:
```markdown
□ All tests passing (100% required)
□ Performance metrics meet requirements
□ Security audit completed
□ Accessibility audit passed
□ SEO optimization verified
□ Environment variables documented
□ Backup and rollback plan ready
□ Monitoring and alerting configured
```

### Step 3.3: Admin Dashboard & Authentication System
**Owner**: Development Agent

#### Research Requirements:
```markdown
RESEARCH AGENT MUST VERIFY:
□ Next.js 15.5 authentication with 2FA implementation
□ TOTP (Time-based One-Time Password) libraries
□ Role-based access control (RBAC) patterns
□ QR code generation and scanning libraries
□ Session management best practices
□ File upload security for event artwork (JPEG/PNG, 5MB limit)
```

#### Authentication Implementation:

##### User Role Hierarchy:
```typescript
enum UserRole {
  SUPER_ADMIN = 'super_admin',  // Full system + user management
  MANAGER = 'manager',           // Full access except user management (max 10)
  DOOR_STAFF = 'door_staff'      // Bookings view & check-in only (max 10)
}

// Permissions matrix
const permissions = {
  super_admin: ['all'],
  manager: ['bookings:*', 'events:*', 'artists:*', 'reports:*'],
  door_staff: ['bookings:view', 'bookings:checkin']
};
```

##### Database Schema for Authentication:
```sql
-- Update admin_users table with 2FA and role limits
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'manager', 'door_staff')),
  totp_secret VARCHAR(255),  -- For 2FA
  totp_enabled BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add constraint to limit managers and door staff
CREATE OR REPLACE FUNCTION check_user_limits()
RETURNS TRIGGER AS $
BEGIN
  IF NEW.role = 'manager' THEN
    IF (SELECT COUNT(*) FROM admin_users WHERE role = 'manager' AND is_active = TRUE) >= 10 THEN
      RAISE EXCEPTION 'Maximum number of managers (10) reached';
    END IF;
  ELSIF NEW.role = 'door_staff' THEN
    IF (SELECT COUNT(*) FROM admin_users WHERE role = 'door_staff' AND is_active = TRUE) >= 10 THEN
      RAISE EXCEPTION 'Maximum number of door staff (10) reached';
    END IF;
  END IF;
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_user_limits
BEFORE INSERT OR UPDATE ON admin_users
FOR EACH ROW
EXECUTE FUNCTION check_user_limits();
```

##### Admin Features by Role:

###### 1. Super Admin Dashboard
```typescript
// app/admin/users/page.tsx
// Features:
- User management (CRUD)
- Password reset functionality
- 2FA reset for users
- Activity logs
- System settings
```

###### 2. Manager Dashboard
```typescript
// app/admin/dashboard/page.tsx
// Features:
- All booking management features
- Event management with image upload
- Artist profile management
- Reports and analytics
- NO access to user management
```

###### 3. Door Staff Dashboard
```typescript
// app/admin/door/page.tsx
// Features:
- Tonight's bookings list
- QR code scanner interface
- Manual check-in by reference
- Real-time arrival tracking
- NO access to modifications
```

#### QR Code & Check-in System:

##### QR Code Generation:
```typescript
// utils/qrcode.ts
// Generate QR code containing:
{
  bookingRef: "BRL-2025-XXXXX",
  tableNumber: 5,
  arrivalTime: "23:00",
  partySize: 4,
  customerName: "John Doe"
}
```

##### Check-in Interface:
```typescript
// components/admin/CheckInScanner.tsx
// Features:
- Camera-based QR scanner
- Fallback manual entry
- Visual confirmation of check-in
- Update booking status to 'arrived'
```

#### Unit Tests:
```typescript
// tests/admin/authentication.test.tsx
describe('Admin Authentication', () => {
  test('Enforces 2FA for all admin users', () => {});
  test('Limits managers to 10 active users', () => {});
  test('Limits door staff to 10 active users', () => {});
  test('Super admin can reset user credentials', () => {});
  test('Role-based access control works correctly', () => {});
});

// tests/admin/checkin.test.tsx
describe('Check-in System', () => {
  test('QR code contains correct booking data', () => {});
  test('QR scanner updates booking status', () => {});
  test('Manual check-in works with reference', () => {});
  test('Door staff cannot modify bookings', () => {});
});
```

### Step 3.4: Advanced Booking System Features
**Owner**: Development Agent

#### Implementation Requirements:

##### Table Combination Logic:
```typescript
// utils/tableCombination.ts
// Auto-combine tables 15 & 16 for parties of 7-12
const checkTableCombination = (partySize: number) => {
  if (partySize >= 7 && partySize <= 12) {
    return {
      combine: true,
      tables: [15, 16],
      description: "Combined curved seating area"
    };
  }
  return { combine: false };
};
```

##### Booking Limits Enforcement:
```sql
-- Add function to check booking limits per customer
CREATE OR REPLACE FUNCTION check_booking_limit()
RETURNS TRIGGER AS $
BEGIN
  IF (SELECT COUNT(*) FROM bookings 
      WHERE customer_email = NEW.customer_email 
      AND booking_date = NEW.booking_date 
      AND status != 'cancelled') >= 2 THEN
    RAISE EXCEPTION 'Maximum 2 tables per customer per night';
  END IF;
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_booking_limit
BEFORE INSERT ON bookings
FOR EACH ROW
EXECUTE FUNCTION check_booking_limit();
```

##### Waitlist System:
```sql
-- Create waitlist table
CREATE TABLE waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  party_size INTEGER NOT NULL,
  preferred_date DATE NOT NULL,
  preferred_time TIME NOT NULL,
  preferred_table_id INTEGER REFERENCES venue_tables(id),
  special_requests TEXT,
  notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to notify when table becomes available
CREATE OR REPLACE FUNCTION notify_waitlist()
RETURNS TRIGGER AS $
BEGIN
  -- When a booking is cancelled, check waitlist
  IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
    -- Queue notification for waitlist customers
    INSERT INTO email_notifications (
      type, 
      recipient_email, 
      subject,
      body
    )
    SELECT 
      'waitlist_availability',
      w.customer_email,
      'Table Now Available at The Backroom Leeds',
      'A table matching your preferences is now available'
    FROM waitlist w
    WHERE w.preferred_date = OLD.booking_date
      AND w.preferred_time = OLD.arrival_time
      AND w.notified = FALSE
    LIMIT 3; -- Notify top 3 on waitlist
  END IF;
  RETURN NEW;
END;
$ LANGUAGE plpgsql;
```

##### Booking Reference Generation:
```typescript
// utils/bookingReference.ts
export const generateBookingReference = (): string => {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `BRL-${year}-${random}`;
};

// QR Code content structure
export interface QRCodeData {
  ref: string;           // BRL-2025-XXXXX
  table: number;         
  time: string;         // "23:00"
  size: number;         // party size
  name: string;         // customer name
  date: string;         // booking date
}
```

##### Special Requests Handling:
```typescript
// components/BookingForm/SpecialRequests.tsx
interface SpecialRequestOptions {
  birthday: boolean;
  anniversary: boolean;
  dietary: string[];
  accessibility: string[];
  other: string;
}

// Add to bookings table
ALTER TABLE bookings 
ADD COLUMN special_requests JSONB,
ADD COLUMN is_birthday BOOLEAN DEFAULT FALSE,
ADD COLUMN is_special_occasion BOOLEAN DEFAULT FALSE;
```

### Step 3.5: Automated Reporting System
**Owner**: Development Agent

#### Implementation Requirements:

##### Daily Summary Report:
```typescript
// jobs/dailySummary.ts
// Runs at 10pm daily
interface DailySummary {
  date: Date;
  metrics: {
    totalBookings: number;
    totalRevenue: number;
    tablesOccupied: number;
    cancellations: number;
    avgPartySize: number;
    topDrinksPackage: string;
  };
  tonightBookings: BookingSummary[];
  waitlistCount: number;
  checkedInCount: number;
  noShowCount: number;
}
```

##### Weekly Summary Report:
```typescript
// jobs/weeklySummary.ts
// Runs Monday 9am
interface WeeklySummary {
  weekCommencing: Date;
  metrics: {
    totalBookings: number;
    totalRevenue: number;
    peakNight: string;
    cancellationRate: number;
    avgOccupancy: number;
    topEvents: Event[];
  };
  trendsVsPreviousWeek: {
    bookingsChange: number;
    revenueChange: number;
  };
}
```

##### Report Distribution:
```sql
-- Report recipients table
CREATE TABLE report_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('daily', 'weekly', 'both')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scheduled jobs tracking
CREATE TABLE scheduled_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name VARCHAR(100) NOT NULL,
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  status VARCHAR(50),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Unit Tests:
```typescript
// tests/bookings/advanced-features.test.tsx
describe('Advanced Booking Features', () => {
  test('Enforces 2 table maximum per customer', () => {});
  test('Auto-combines tables 15-16 for large parties', () => {});
  test('Generates unique booking references', () => {});
  test('QR code contains all required data', () => {});
  test('Waitlist notification triggers on cancellation', () => {});
  test('Special requests are saved correctly', () => {});
});

// tests/reports/automated.test.tsx
describe('Automated Reports', () => {
  test('Daily summary calculates metrics correctly', () => {});
  test('Weekly summary includes trends', () => {});
  test('Reports sent to correct recipients', () => {});
  test('Failed reports are logged', () => {});
});
```

### Step 3.6: Email Notification System
**Owner**: Development Agent

#### Implementation Requirements:
```markdown
□ Research email service (Resend, SendGrid, or AWS SES)
□ Template engine for emails with QR code generation
□ Queue system for reliability
□ Bounce handling
□ Email tracking (open rates, clicks)
```

#### Email Templates:

##### 1. Booking Confirmation (with QR Code):
```typescript
// templates/bookingConfirmation.tsx
interface BookingConfirmationData {
  customerName: string;
  bookingRef: string;
  date: string;
  arrivalTime: string;
  tableNumber: number;
  partySize: number;
  drinksPackage: string;
  totalAmount: number;
  depositPaid: number;
  remainingBalance: number;
  specialRequests?: string;
  qrCodeDataUrl: string; // Base64 QR code image
}
```

##### 2. Cancellation Confirmation:
```typescript
// templates/cancellationConfirmation.tsx
interface CancellationData {
  customerName: string;
  bookingRef: string;
  refundEligible: boolean;
  refundAmount: number;
  cancellationDate: string;
}
```

##### 3. Refund Request (Manual Process):
```typescript
// templates/refundRequest.tsx
// To: sales@backroomleeds.co.uk
// CC: admin@backroomleeds.co.uk
interface RefundRequestData {
  bookingRef: string;
  customerName: string;
  customerEmail: string;
  stripePaymentIntentId: string;
  refundAmount: number;
  cancellationDate: string;
}
```

##### 4. Waitlist Notification:
```typescript
// templates/waitlistNotification.tsx
interface WaitlistNotificationData {
  customerName: string;
  availableDate: string;
  availableTime: string;
  tableNumber: number;
  bookingLink: string;
  expiresIn: string; // "24 hours"
}
```

##### 5. Daily Summary Report:
```typescript
// templates/dailySummary.tsx
// To: Management team
// Sent: 10pm daily
interface DailySummaryData {
  date: string;
  totalBookings: number;
  totalRevenue: number;
  tonightBookings: BookingSummary[];
  cancellations: number;
  waitlistCount: number;
}
```

##### 6. Weekly Summary Report:
```typescript
// templates/weeklySummary.tsx
// To: Management team
// Sent: Monday 9am
interface WeeklySummaryData {
  weekRange: string;
  metrics: WeeklyMetrics;
  topEvents: Event[];
  trends: TrendComparison;
}
```

1. **NEVER implement without research**
   - Every code pattern must reference official documentation
   - Include documentation links in comments

2. **NEVER guess or hallucinate**
   - If information is unclear, ASK
   - If documentation is outdated, RESEARCH current solution
   - If multiple solutions exist, DOCUMENT all options

3. **ALWAYS test before proceeding**
   - No feature is complete without passing tests
   - No commit without test verification
   - No deployment without full test suite passing

4. **ALWAYS document decisions**
   - Why this approach was chosen
   - What alternatives were considered
   - What trade-offs were made

5. **ALWAYS maintain communication**
   - Update progress every 2 hours
   - Flag blockers immediately
   - Request clarification proactively

---

## 📝 Questions to Ask Before Implementation

### For Research Agent:
1. Is this pattern still recommended in the latest documentation?
2. Are there any security vulnerabilities in this approach?
3. What are the performance implications?
4. Are there accessibility concerns?

### ✅ Clarified Business Requirements:

1. **Booking Modifications & Cancellations**:
   - Customers can cancel bookings at any time
   - Deposits refunded if cancelled 48+ hours in advance
   - Deposits forfeited if cancelled within 48 hours
   - No modification feature needed (cancel and rebook)

2. **Payment Handling**:
   - Failed payments: Prompt user to retry or use different card
   - No automatic retry logic needed
   - Never store customer card details (PCI compliance)
   - Remaining balance handled separately on the night

3. **Email Notifications**:
   - Booking confirmation emails to customer (with QR code & reference number)
   - Cancellation confirmation emails to customer
   - Cancellation notifications to sales@backroomleeds.co.uk (CC: admin@backroomleeds.co.uk)
   - Daily and weekly summary reports to management

4. **Admin Dashboard Requirements**:
   - **User Roles**:
     * Super Admin: Full system access + user management
     * Managers (10 max): Full access to bookings, events, artists
     * Door Staff (10 max): View bookings & check-in only
   - **Authentication**: Email/password + 2FA (authenticator app)
   - **Bookings Management**:
     * View all bookings with filters (past/future/specific date)
     * Sort by: table number, arrival time, customer name, email, phone
     * Real-time availability viewer for manual bookings
     * QR code scanner for check-in
     * Manual check-in via reference number
     * Modify existing bookings functionality
   - **Events Management**:
     * Add new events with artwork upload (JPEG/PNG, max 5MB)
     * Edit/delete existing events
   - **DJ/Artist Profiles**:
     * Update DJ/artist information
   - **Reporting**:
     * Export bookings as PDF/CSV by date range
     * Automated daily and weekly summaries

5. **Analytics**: Google Analytics implementation required

6. **Privacy**: UK GDPR compliant implementation

7. **Social Media**: No embedded feeds required

8. **Language Support**: English only

9. **Booking Time Slots**:
   - Available arrival times: 11pm, 11:30pm, 12am, 12:30am, 1am
   - Tables booked for entire night after arrival

10. **Refund Process**:
    - 48+ hour cancellation: Full deposit refund
    - <48 hour cancellation: Deposit forfeited
    - Manual refund process via email notification

11. **Booking Rules**:
    - Maximum 2 tables per customer per night
    - Tables 15 & 16 auto-combine for parties of 7-12
    - Special requests field available
    - Waitlist feature for unavailable slots

12. **Pricing Display**:
    - Calculate and show total amount (package + remaining balance)
    - Clear breakdown of costs in booking flow

---

## 🔒 Security Considerations

### Must Research and Implement:
- [ ] Input sanitization for all forms
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF tokens
- [ ] Rate limiting
- [ ] Secure headers
- [ ] Content Security Policy
- [ ] PCI compliance for payments

---

## Success Metrics

### Technical Metrics:
- Page load time < 2 seconds
- Core Web Vitals score > 90
- Test coverage > 80%
- Zero critical security vulnerabilities
- Mobile responsiveness score 100%

### Business Metrics:
- Booking conversion rate tracking
- Event ticket click-through rate
- Table booking completion rate
- User engagement metrics

---

**END OF GUIDE**

Note: This is a living document. Update after each sprint with lessons learned and process improvements.