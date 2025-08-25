# The Backroom Leeds - Technical Specification Document

**Version**: 1.0  
**Date**: 24th August 2025  
**Project**: Prohibition-themed Nightclub Website & Booking System

---

## 1. Executive Summary

### 1.1 Project Overview
Development of a full-stack web application for The Backroom Leeds, a prohibition-themed nightclub, featuring real-time table booking, event management, and comprehensive admin dashboard with role-based access control.

### 1.2 Key Deliverables
- Public-facing website with mobile-first responsive design
- Real-time table booking system with payment processing
- Multi-tier admin dashboard with 2FA authentication
- Automated reporting and notification system
- UK GDPR compliant data handling

### 1.3 Technology Stack
- **Frontend**: Next.js 15.5, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (via Supabase)
- **Payment**: Stripe Payment Intents API
- **Authentication**: Supabase Auth with TOTP 2FA
- **Email**: SendGrid
- **Hosting**: Vercel
- **Analytics**: Google Analytics 4

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
├───────────────────────────┬─────────────────────────────────┤
│    Public Website         │         Admin Dashboard         │
│  - Events Listing         │    - Super Admin Portal         │
│  - Table Booking          │    - Manager Dashboard          │
│  - Private Hire           │    - Door Staff Interface      │
│  - Contact Forms          │    - QR Scanner                 │
└───────────────────────────┴─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                        │
│                    Next.js 15.5 Server                       │
├─────────────────────────────────────────────────────────────┤
│  - Server Components      - API Routes                      │
│  - Authentication         - Business Logic                  │
│  - Email Queue           - Report Generation                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER                              │
├───────────────────────────┬─────────────────────────────────┤
│      Supabase            │         External APIs           │
│  - PostgreSQL DB         │    - Stripe Payments            │
│  - Real-time Updates     │    - Email Service              │
│  - File Storage          │    - Google Analytics           │
│  - Row Level Security    │    - TOTP Authentication        │
└───────────────────────────┴─────────────────────────────────┘
```

### 2.2 Component Architecture

```typescript
// Core Component Structure
src/
├── app/                          // Next.js 15.5 App Router
│   ├── (public)/                // Public routes
│   │   ├── page.tsx             // Homepage
│   │   ├── events/              // Events listing
│   │   ├── booking/             // Table booking flow
│   │   ├── private-hire/        // Private hire info
│   │   └── contact/             // Contact page
│   │
│   ├── admin/                   // Admin routes (protected)
│   │   ├── layout.tsx           // Admin layout with auth
│   │   ├── dashboard/           // Main dashboard
│   │   ├── bookings/            // Booking management
│   │   ├── events/              // Event management
│   │   ├── artists/             // DJ/Artist profiles
│   │   ├── users/               // User management (super admin)
│   │   ├── reports/             // Reporting interface
│   │   └── door/                // Door staff interface
│   │
│   └── api/                     // API routes
│       ├── bookings/            // Booking CRUD
│       ├── payments/            // Stripe webhooks
│       ├── auth/                // Authentication
│       ├── reports/             // Report generation
│       └── webhooks/            // External webhooks
│
├── components/                   // Reusable components
│   ├── booking/                 // Booking-specific
│   ├── admin/                   // Admin-specific
│   ├── shared/                  // Shared components
│   └── ui/                      // UI primitives
│
├── lib/                         // Utilities & helpers
│   ├── supabase/               // Database client
│   ├── stripe/                 // Payment client
│   ├── email/                  // Email service
│   └── auth/                   // Auth utilities
│
└── types/                       // TypeScript definitions
```

---

## 3. Functional Specifications

### 3.1 Public Website Features

#### 3.1.1 Events Page
- **Weekly Events Display**
  - LA FIESTA (Fridays, 11pm-6am)
  - SHHH! (Saturdays, 11pm-6am)
  - NOSTALGIA (Sundays, 11pm-5am)
- **Event Information**
  - Music genres by floor
  - DJ lineups
  - Ticket links (Fatsoma integration)
  - Table booking CTAs

#### 3.1.2 Table Booking System
- **Booking Flow**
  1. Select date and arrival time (11pm, 11:30pm, 12am, 12:30am, 1am)
  2. Choose party size (2-12 guests)
  3. View real-time table availability
  4. Select table(s) - auto-combine 15&16 for 7-12 guests
  5. Choose drinks package or custom selection
  6. Add special requests
  7. Enter customer details
  8. Pay £50 deposit via Stripe
  9. Receive confirmation with QR code

- **Booking Constraints**
  - Max 2 tables per customer per night
  - 48-hour cancellation for refund
  - Tables booked for entire night
  - Waitlist for unavailable slots

#### 3.1.3 Private Hire
- Venue space information
- Entertainment options with pricing
- Catering menus
- Decoration packages
- Contact form for enquiries

### 3.2 Admin Dashboard Features

#### 3.2.1 Authentication & Authorization

**User Roles & Permissions Matrix:**

| Feature | Super Admin | Manager | Door Staff |
|---------|------------|---------|------------|
| User Management | ✓ | ✗ | ✗ |
| View All Bookings | ✓ | ✓ | ✓ |
| Modify Bookings | ✓ | ✓ | ✗ |
| Check-in Guests | ✓ | ✓ | ✓ |
| Event Management | ✓ | ✓ | ✗ |
| Artist Management | ✓ | ✓ | ✗ |
| Reports Access | ✓ | ✓ | ✗ |
| System Settings | ✓ | ✗ | ✗ |

**Authentication Flow:**
1. Email/password login
2. TOTP 2FA verification
3. Session management with JWT
4. Account lockout after 5 failed attempts

#### 3.2.2 Booking Management
- **View & Filter Options**
  - Past/Future/Specific date
  - Sort by: table, time, name, email, phone
  - Search functionality
  - Export to PDF/CSV

- **Booking Actions**
  - Create manual booking
  - Modify existing bookings
  - Process cancellations
  - View special requests
  - Check payment status

#### 3.2.3 Check-in System
- **QR Code Scanner**
  - Camera-based scanning
  - Instant booking verification
  - Update status to "arrived"
  
- **Manual Check-in**
  - Search by reference number
  - Search by customer name
  - Mark as arrived/no-show

#### 3.2.4 Event Management
- Create/Edit/Delete events
- Upload event artwork (JPEG/PNG, max 5MB)
- Set recurring events
- Manage ticket links

#### 3.2.5 Reporting
- **Daily Summary (10pm)**
  - Tonight's bookings list
  - Revenue metrics
  - Occupancy rates
  - Check-in status
  
- **Weekly Summary (Monday 9am)**
  - Week's performance metrics
  - Trends vs previous week
  - Top events and packages
  - Cancellation rates

---

## 4. Technical Specifications

### 4.1 Database Schema

#### 4.1.1 Core Tables

**bookings**
```sql
- id: UUID (PK)
- booking_ref: VARCHAR(20) UNIQUE
- customer_email: VARCHAR(255)
- customer_name: VARCHAR(255)
- customer_phone: VARCHAR(20)
- party_size: INTEGER
- booking_date: DATE
- arrival_time: TIME
- table_ids: INTEGER[]
- drinks_package: JSONB
- special_requests: JSONB
- deposit_amount: DECIMAL(10,2)
- package_amount: DECIMAL(10,2)
- remaining_balance: DECIMAL(10,2)
- status: ENUM('pending','confirmed','cancelled','arrived','no_show')
- stripe_payment_intent_id: VARCHAR(255)
- checked_in_at: TIMESTAMPTZ
- cancelled_at: TIMESTAMPTZ
- refund_eligible: BOOLEAN
```

**venue_tables**
```sql
- id: SERIAL (PK)
- table_number: INTEGER
- floor: ENUM('upstairs','downstairs')
- capacity_min: INTEGER
- capacity_max: INTEGER
- can_combine_with: INTEGER[]
- description: TEXT
- features: TEXT[]
```

**admin_users**
```sql
- id: UUID (PK)
- email: VARCHAR(255) UNIQUE
- password_hash: VARCHAR(255)
- role: ENUM('super_admin','manager','door_staff')
- totp_secret: VARCHAR(255)
- totp_enabled: BOOLEAN
- is_active: BOOLEAN
- failed_login_attempts: INTEGER
- locked_until: TIMESTAMPTZ
```

#### 4.1.2 Database Triggers

1. **Booking Limit Enforcement**: Max 2 tables per customer per night
2. **Refund Eligibility**: Auto-calculate based on 48-hour rule
3. **Balance Calculation**: Auto-calculate remaining balance
4. **User Limits**: Enforce max 10 managers, 10 door staff
5. **Waitlist Notification**: Trigger on cancellation

### 4.2 API Endpoints

#### 4.2.1 Public API

```typescript
// Booking APIs
POST   /api/bookings/check-availability
POST   /api/bookings/create
POST   /api/bookings/cancel
GET    /api/bookings/verify/{ref}

// Events APIs
GET    /api/events
GET    /api/events/{id}

// Waitlist APIs
POST   /api/waitlist/join
DELETE /api/waitlist/leave

// Payment APIs
POST   /api/payments/create-intent
POST   /api/payments/webhook (Stripe webhook)
```

#### 4.2.2 Admin API (Protected)

```typescript
// Authentication
POST   /api/auth/login
POST   /api/auth/2fa/verify
POST   /api/auth/logout
POST   /api/auth/refresh

// Booking Management
GET    /api/admin/bookings
GET    /api/admin/bookings/{id}
PUT    /api/admin/bookings/{id}
POST   /api/admin/bookings/check-in
GET    /api/admin/bookings/export

// Event Management
GET    /api/admin/events
POST   /api/admin/events
PUT    /api/admin/events/{id}
DELETE /api/admin/events/{id}
POST   /api/admin/events/{id}/upload-image

// User Management (Super Admin)
GET    /api/admin/users
POST   /api/admin/users
PUT    /api/admin/users/{id}
DELETE /api/admin/users/{id}
POST   /api/admin/users/{id}/reset-password
POST   /api/admin/users/{id}/reset-2fa

// Reports
GET    /api/admin/reports/daily
GET    /api/admin/reports/weekly
POST   /api/admin/reports/custom
```

### 4.3 Real-time Features

#### 4.3.1 Supabase Subscriptions
```typescript
// Real-time table availability
const subscription = supabase
  .channel('table-availability')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'bookings',
    filter: `booking_date=eq.${date}`
  }, handleAvailabilityChange)
  .subscribe();
```

#### 4.3.2 WebSocket Events
- Table availability updates
- Booking status changes
- Waitlist notifications
- Check-in updates

### 4.4 Security Specifications

#### 4.4.1 Authentication Security
- **Password Requirements**
  - Minimum 12 characters
  - Mix of uppercase, lowercase, numbers, symbols
  - Bcrypt hashing with salt rounds: 12

- **2FA Implementation**
  - TOTP with 30-second window
  - Backup codes generation
  - QR code for authenticator apps

#### 4.4.2 Data Protection
- **Encryption**
  - TLS 1.3 for all connections
  - Encryption at rest for sensitive data
  - No storage of card details (PCI compliance)

- **Row Level Security (RLS)**
  ```sql
  -- Example RLS policy
  CREATE POLICY "Users can only see own bookings"
  ON bookings FOR SELECT
  USING (auth.email() = customer_email);
  ```

#### 4.4.3 GDPR Compliance
- Cookie consent management
- Data retention policies (2 years)
- Right to erasure implementation
- Data export functionality
- Audit logging for all admin actions

### 4.5 Performance Requirements

#### 4.5.1 Performance Metrics
- **Page Load Time**: < 2 seconds
- **Time to Interactive**: < 3 seconds
- **Core Web Vitals**:
  - LCP: < 2.5s
  - FID: < 100ms
  - CLS: < 0.1

#### 4.5.2 Optimization Strategies
- Server-side rendering with Next.js
- Image optimization with next/image
- Code splitting and lazy loading
- Database query optimization
- CDN for static assets
- Redis caching for frequent queries

### 4.6 Email Specifications

#### 4.6.1 Email Templates
1. **Booking Confirmation**
   - QR code generation
   - Booking reference
   - Table details
   - Arrival time
   - Cancellation policy

2. **Cancellation Confirmation**
   - Refund eligibility
   - Processing timeline

3. **Refund Request**
   - To: sales@backroomleeds.co.uk
   - CC: admin@backroomleeds.co.uk
   - Manual processing instructions

4. **Waitlist Notification**
   - Available slot details
   - 24-hour expiry
   - Direct booking link

5. **Daily Summary (10pm)**
   - Tonight's bookings
   - Revenue metrics
   - Check-in status

6. **Weekly Summary (Monday 9am)**
   - Performance metrics
   - Comparison trends

#### 4.6.2 Email Service Requirements
- Transactional email support
- Template management
- Bounce handling
- Click/open tracking
- Unsubscribe management
- DKIM/SPF configuration

---

## 5. Integration Specifications

### 5.1 Stripe Integration

#### 5.1.1 Payment Flow
```typescript
// 1. Create Payment Intent
const paymentIntent = await stripe.paymentIntents.create({
  amount: 5000, // £50 in pence
  currency: 'gbp',
  metadata: {
    booking_ref: 'BRL-2025-XXXXX',
    customer_email: 'customer@email.com'
  }
});

// 2. Confirm payment client-side
// 3. Handle webhook for payment confirmation
// 4. Update booking status
```

#### 5.1.2 Webhook Events
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`

### 5.2 Google Analytics 4

#### 5.2.1 Event Tracking
```typescript
// Key events to track
gtag('event', 'booking_started', {
  event_category: 'engagement',
  event_label: 'table_booking'
});

gtag('event', 'booking_completed', {
  event_category: 'conversion',
  value: 50,
  currency: 'GBP'
});

gtag('event', 'table_selected', {
  table_number: 5,
  party_size: 4
});
```

#### 5.2.2 Conversion Goals
- Booking completion rate
- Event ticket click-through
- Private hire enquiries
- Average booking value

### 5.3 External Links
- **Fatsoma**: Event ticketing (https://www.fatsoma.com/p/backroomleeds)
- **Social Media**: Instagram, Facebook, Twitter
- **Maps**: Google Maps integration for directions

---

## 6. Testing Specifications

### 6.1 Test Coverage Requirements
- **Unit Tests**: Minimum 80% coverage
- **Integration Tests**: All API endpoints
- **E2E Tests**: Critical user journeys
- **Performance Tests**: Load testing for 500 concurrent users

### 6.2 Test Scenarios

#### 6.2.1 Booking Flow Tests
```typescript
describe('Booking Flow', () => {
  test('Complete booking with payment');
  test('Booking with table combination');
  test('Enforcement of 2-table limit');
  test('48-hour cancellation refund');
  test('Waitlist notification on cancellation');
  test('QR code generation and validation');
});
```

#### 6.2.2 Admin Tests
```typescript
describe('Admin Functions', () => {
  test('2FA authentication flow');
  test('Role-based access control');
  test('QR code check-in');
  test('Manual booking creation');
  test('Report generation');
  test('User limit enforcement');
});
```

### 6.3 Performance Testing
- **Load Testing**: 500 concurrent users
- **Stress Testing**: Peak booking times
- **Database Performance**: Query optimization
- **API Response Times**: < 200ms average

---

## 7. Deployment Specifications

### 7.1 Environment Configuration

#### 7.1.1 Environment Variables
```env
# Database
DATABASE_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=

# Authentication
JWT_SECRET=
TOTP_SECRET=

# Stripe
STRIPE_PUBLIC_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Email
EMAIL_API_KEY=
EMAIL_FROM_ADDRESS=

# Analytics
GA_MEASUREMENT_ID=

# Application
NEXT_PUBLIC_APP_URL=
NODE_ENV=
```

### 7.2 Deployment Pipeline

```yaml
# CI/CD Pipeline
1. Code Push → GitHub
2. Automated Tests → GitHub Actions
3. Build → Vercel
4. Deploy to Staging
5. E2E Tests on Staging
6. Deploy to Production
7. Post-deployment Tests
8. Monitoring & Alerts
```

### 7.3 Infrastructure

#### 7.3.1 Hosting Architecture
- **Frontend**: Vercel (Auto-scaling)
- **Database**: Supabase (Managed PostgreSQL)
- **File Storage**: Supabase Storage
- **CDN**: Vercel Edge Network
- **DNS**: Cloudflare

#### 7.3.2 Backup Strategy
- **Database**: Daily automated backups (30-day retention)
- **Files**: Versioned storage with 90-day retention
- **Code**: Git repository with tagged releases

### 7.4 Monitoring & Alerting

#### 7.4.1 Application Monitoring
- Vercel Analytics
- Error tracking (Sentry)
- Uptime monitoring
- Performance metrics

#### 7.4.2 Alert Triggers
- Payment failures
- Booking system errors
- Database connection issues
- High error rates (>1%)
- Slow response times (>2s)

---

## 8. Maintenance & Support

### 8.1 Regular Maintenance Tasks
- **Daily**: Monitor error logs, check email delivery
- **Weekly**: Review performance metrics, backup verification
- **Monthly**: Security updates, dependency updates
- **Quarterly**: Performance optimization, security audit

### 8.2 Support Documentation
- Admin user guide
- Door staff training manual
- Troubleshooting guide
- API documentation
- Database schema documentation

### 8.3 Disaster Recovery
- **RTO (Recovery Time Objective)**: 4 hours
- **RPO (Recovery Point Objective)**: 24 hours
- **Backup restoration procedure**
- **Rollback procedures**
- **Emergency contact list**

---

## 9. Future Enhancements (Phase 2)

### 9.1 Potential Features
- Mobile app (iOS/Android)
- Loyalty program integration
- SMS notifications
- Advanced analytics dashboard
- AI-powered demand forecasting
- Dynamic pricing for packages
- Multi-venue support
- Integration with POS systems

### 9.2 Scalability Considerations
- Microservices architecture
- GraphQL API layer
- Event-driven architecture
- Kubernetes deployment
- Multi-region deployment

---

## 10. Appendices

### Appendix A: Table Configuration
```javascript
const tables = [
  // Upstairs
  { id: 1, number: 1, floor: 'upstairs', min: 4, max: 12, description: 'Dance floor premium booth' },
  { id: 2, number: 2, floor: 'upstairs', min: 4, max: 8, description: 'Dance floor side high table' },
  { id: 3, number: 3, floor: 'upstairs', min: 4, max: 8, description: 'Dance floor side high table' },
  { id: 4, number: 4, floor: 'upstairs', min: 4, max: 8, description: 'Dance floor front high table' },
  { id: 5, number: 5, floor: 'upstairs', min: 4, max: 10, description: 'Dance floor front large high table' },
  { id: 6, number: 6, floor: 'upstairs', min: 2, max: 4, description: 'Barrel bar area' },
  { id: 7, number: 7, floor: 'upstairs', min: 2, max: 4, description: 'Barrel bar area' },
  { id: 8, number: 8, floor: 'upstairs', min: 2, max: 4, description: 'Barrel bar area' },
  { id: 9, number: 9, floor: 'upstairs', min: 4, max: 10, description: 'Large booth' },
  { id: 10, number: 10, floor: 'upstairs', min: 4, max: 12, description: 'Premium Ciroc booth' },
  
  // Downstairs
  { id: 11, number: 11, floor: 'downstairs', min: 2, max: 8, description: 'Intimate booth' },
  { id: 12, number: 12, floor: 'downstairs', min: 2, max: 8, description: 'Intimate booth' },
  { id: 13, number: 13, floor: 'downstairs', min: 2, max: 8, description: 'Dancefloor booth' },
  { id: 14, number: 14, floor: 'downstairs', min: 2, max: 8, description: 'Dance floor booth' },
  { id: 15, number: 15, floor: 'downstairs', min: 2, max: 6, description: 'Curved seating', combinable: [16] },
  { id: 16, number: 16, floor: 'downstairs', min: 2, max: 6, description: 'Curved seating', combinable: [15] }
];
```

### Appendix B: Drinks Packages
```javascript
const packages = [
  {
    name: 'HUSH & SHUSH',
    price: 170,
    includes: ['Bottle of Smirnoff', '2 jugs mixer', 'Bottle of Prosecco', '8 Tequila Rose shots']
  },
  {
    name: 'SPEAK WHISKEY TO ME',
    price: 280,
    includes: ['Bottle of Jack Daniels', 'Bottle of Bacardi Spiced', '4 jugs mixer']
  },
  {
    name: 'AFTER HOURS',
    price: 400,
    includes: ['8 Grey Goose Espresso Martinis', 'Bottle of Ciroc', 'Bottle of Ciroc Flavours', '4 jugs mixer']
  },
  {
    name: 'MIDNIGHT MADNESS',
    price: 580,
    includes: ['Premium Spirit', 'Moet', 'Don Julio Blanco', 'Hennessy VS', '6 jugs mixer']
  }
];
```

### Appendix C: Error Codes
```typescript
enum ErrorCodes {
  // Booking Errors (1000-1099)
  BOOKING_LIMIT_EXCEEDED = 1001,
  TABLE_UNAVAILABLE = 1002,
  INVALID_PARTY_SIZE = 1003,
  PAYMENT_FAILED = 1004,
  
  // Auth Errors (2000-2099)
  INVALID_CREDENTIALS = 2001,
  ACCOUNT_LOCKED = 2002,
  INVALID_2FA = 2003,
  SESSION_EXPIRED = 2004,
  
  // System Errors (3000-3099)
  DATABASE_ERROR = 3001,
  EMAIL_SEND_FAILED = 3002,
  FILE_UPLOAD_FAILED = 3003
}
```

---

## Document Control

**Version History:**
- v1.0 - Initial specification (24th August 2025)

**Approval:**
- Technical Lead: _____________
- Project Manager: ____________
- Client Representative: _______

**Distribution:**
- Development Team
- Project Management
- Client Stakeholders
- QA Team

---

**END OF TECHNICAL SPECIFICATION DOCUMENT**