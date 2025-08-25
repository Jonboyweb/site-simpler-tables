# The Backroom Leeds - System Design Architecture

## Overview
This document outlines the comprehensive system design for The Backroom Leeds, a prohibition-themed nightclub booking platform with advanced technological integrations.

## Database Entity Relationship Diagram (ERD)

### Core Entities
1. **Users**
   - `id` (UUID)
   - `email` (string)
   - `name` (string)
   - `role` (enum: customer, staff, admin)
   - `authentication_method` (string)

2. **Tables**
   - `id` (UUID)
   - `name` (string)
   - `capacity` (integer)
   - `location` (enum: upstairs, downstairs)
   - `minimum_spend` (decimal)
   - `availability_status` (boolean)

3. **Bookings**
   - `id` (UUID)
   - `user_id` (foreign key → Users)
   - `table_id` (foreign key → Tables)
   - `event_id` (foreign key → Events)
   - `booking_date` (timestamp)
   - `start_time` (time)
   - `end_time` (time)
   - `status` (enum: pending, confirmed, cancelled)
   - `total_price` (decimal)
   - `deposit_paid` (boolean)

4. **Events**
   - `id` (UUID)
   - `name` (string)
   - `description` (text)
   - `date` (date)
   - `start_time` (time)
   - `end_time` (time)
   - `dj_lineup` (string[])
   - `ticket_price` (decimal)

5. **Payments**
   - `id` (UUID)
   - `booking_id` (foreign key → Bookings)
   - `stripe_payment_intent_id` (string)
   - `amount` (decimal)
   - `currency` (string)
   - `status` (enum: pending, completed, refunded)
   - `payment_method` (string)

## Component Hierarchy

### Frontend Components
```
📁 Root
│
├── 🏠 Home
│   ├── Event Carousel
│   └── Quick Booking Widget
│
├── 📅 Events
│   ├── Event List
│   └── Event Details
│
├── 🍽️ Booking Flow
│   ├── Table Selection
│   ├── Date/Time Picker
│   ├── Guest Details
│   └── Payment Confirmation
│
└── 👤 User Dashboard
    ├── Booking History
    ├── Upcoming Events
    └── Profile Management
```

### Backend Architecture
```
🔧 Next.js API Routes
│
├── 🔒 Authentication
│   ├── Login
│   ├── Registration
│   └── Role Management
│
├── 📊 Booking Management
│   ├── Availability Checker
│   ├── Booking Creator
│   └── Cancellation Handler
│
├── 💰 Payment Processing
│   ├── Stripe Integration
│   ├── Webhook Handler
│   └── Refund Management
│
└── 🎉 Event Management
    ├── Event Creation
    ├── Ticket Allocation
    └── DJ Lineup Management
```

## Authentication Flow

1. User Registration/Login
   - Email/Password
   - Social Authentication (Google, Facebook)
   - 2FA Optional

2. Role-Based Access Control
   ```
   Customer → Limited Booking Access
   Staff → Booking Management
   Admin → Full System Control
   ```

3. Authentication Middleware
   - JWT Token Validation
   - Role-Based Permissions
   - Session Management

## Deployment Architecture

### Infrastructure
- **Hosting**: Vercel
- **Database**: Supabase PostgreSQL
- **Payment Gateway**: Stripe
- **Authentication**: NextAuth.js

### Environment Separation
- Development
- Staging
- Production

### Deployment Pipeline
```
Code Commit → GitHub
    ↓
Vercel CI/CD
    ↓
Automated Testing
    ↓
Deployment to Environment
```

## Performance & Scalability Considerations

### Caching Strategies
- Server-Side Rendering (SSR)
- Incremental Static Regeneration (ISR)
- Redis Caching for Frequent Queries

### Rate Limiting
- API Request Throttling
- Booking Slot Reservation Mechanism

### Monitoring & Logging
- Sentry Error Tracking
- Vercel Analytics
- Custom Performance Metrics

## Security Implementations

### Data Protection
- GDPR Compliant
- End-to-End Encryption
- Secure Payment Processing

### Access Controls
- Role-Based Permissions
- Two-Factor Authentication
- IP Whitelisting for Admin Panel

## Real-Time Features

### WebSocket Integrations
- Live Table Availability
- Instant Booking Confirmations
- Admin Dashboard Updates

## Compliance Checklist
- ✅ WCAG 2.1 AA Accessibility
- ✅ PCI DSS Payment Compliance
- ✅ GDPR Data Protection
- ✅ UK Gambling Commission Guidelines

## Future Scalability
- Microservices Architecture
- Serverless Function Optimization
- Machine Learning Booking Recommendations