# 💻 Backroom Leeds Development Hub

**Full-stack development environment for premium speakeasy platform**

## 🤖 Development Agent Configuration

**Agent**: `backroom-development-agent`  
**Model**: `claude-sonnet-4-20250514`  
**Context Window**: 1,000,000 tokens  
**Beta Features**: Enabled  
**Working Directory**: `./src`  
**Dependencies**: `backroom-architecture-agent`

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js 15 App Router
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Admin dashboard
│   ├── api/               # API routes
│   ├── booking/           # Booking flow pages
│   ├── events/            # Event pages
│   └── globals.css        # Global styles with prohibition theme
├── components/            # React components
│   ├── ui/               # shadcn/ui base components (atoms)
│   ├── molecules/        # Combined UI components  
│   ├── organisms/        # Complex feature components
│   └── templates/        # Page layout templates
├── lib/                  # Utility libraries
│   ├── api/              # API client functions
│   ├── auth/             # Authentication utilities
│   ├── db/               # Database configuration
│   └── utils/            # Helper functions
├── hooks/                # Custom React hooks
├── types/                # TypeScript type definitions
└── __tests__/           # Test files
```

## 🎯 Development Stack

### Frontend Technologies
- **Framework**: Next.js 15 with App Router and TypeScript
- **Styling**: Tailwind CSS 4.1 with prohibition-era theme
- **Components**: shadcn/ui with Art Deco customization
- **State**: Zustand (global) + React Query (server state)
- **Forms**: React Hook Form + Zod validation
- **Animation**: Framer Motion for Art Deco transitions

### Backend Technologies  
- **Runtime**: Node.js with TypeScript
- **API**: Next.js API routes with middleware
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js with JWT tokens
- **Cache**: Redis for session and query caching
- **Storage**: Vercel Blob for media assets

### Quality & Testing
- **Testing**: Jest + React Testing Library + Playwright
- **Linting**: ESLint with Next.js and custom rules
- **Formatting**: Prettier with consistent configuration
- **Type Safety**: Strict TypeScript with comprehensive types

## 🎨 Prohibition Theme Implementation

### Design System Colors
```css
/* Classic Speakeasy Palette */
--speakeasy-noir: oklch(8% 0.02 240);        /* Deep noir black */
--speakeasy-burgundy: oklch(25% 0.15 15);    /* Rich burgundy */  
--speakeasy-gold: oklch(76.9% 0.188 70.08);  /* Antique gold */
--speakeasy-copper: oklch(55% 0.12 45);      /* Aged copper */
--speakeasy-champagne: oklch(95% 0.05 85);   /* Light champagne */
```

### Typography Hierarchy
- **Headlines**: Bebas Neue for vintage poster impact
- **Subheadings**: Playfair Display for elegant serif charm
- **Body Text**: Inter for clean readability
- **Decorative**: Great Vibes for special accents and flourishes

### Art Deco Components
- **Sunburst Backgrounds**: Conic gradients for authentic Art Deco appeal
- **Geometric Borders**: CSS clip-path for frame effects  
- **Vintage Hover States**: 3D transform rotations and shadow effects
- **Ornamental Dividers**: Mask utilities for elegant section breaks

## 🧩 Component Architecture

### Atomic Design Structure
```typescript
// UI Components (Atoms)
export { Button } from './ui/button'
export { Input } from './ui/input'
export { Card } from './ui/card'

// Molecules (Combined Components)
export { SearchBar } from './molecules/search-bar'
export { DatePicker } from './molecules/date-picker'
export { BookingFormField } from './molecules/booking-form-field'

// Organisms (Feature Components)
export { BookingForm } from './organisms/booking-form'
export { EventCalendar } from './organisms/event-calendar'
export { CustomerDashboard } from './organisms/customer-dashboard'

// Templates (Page Layouts)
export { VenueLayout } from './templates/venue-layout'
export { AdminLayout } from './templates/admin-layout'
```

### Component Standards
- **Accessibility**: WCAG 2.1 AA compliance built into every component
- **Responsiveness**: Mobile-first design with breakpoint optimization
- **Theming**: Consistent prohibition-era styling with variant support  
- **Type Safety**: Full TypeScript integration with prop validation
- **Testing**: Component tests with user interaction scenarios

## 🔌 API Architecture

### Endpoint Organization
```typescript
// Booking System APIs
/api/bookings              # Booking CRUD operations
/api/bookings/availability # Real-time availability checking
/api/bookings/[id]        # Individual booking management

// Event Management APIs  
/api/events               # Event CRUD operations
/api/events/[id]/tickets  # Ticket management
/api/events/calendar      # Calendar view data

// Customer Management APIs
/api/customers            # Customer CRUD operations  
/api/customers/[id]/preferences # Preference management
/api/customers/[id]/history    # Booking history
```

### API Standards
- **Validation**: Zod schemas for request/response validation
- **Error Handling**: Consistent error responses with proper status codes
- **Authentication**: JWT-based authentication with role verification
- **Rate Limiting**: Protection against abuse and DDoS attacks
- **Documentation**: Auto-generated OpenAPI specifications

## 🏪 Venue Business Logic

### Booking System Features
- **Real-time Availability**: Dynamic table availability calculation
- **Conflict Resolution**: Automatic overbooking prevention
- **Dynamic Pricing**: Demand-based pricing with time slot optimization
- **Waitlist Management**: Automatic notification when tables become available
- **Multi-step Forms**: Guided booking flow with validation

### Event Management Features
- **Calendar Integration**: Full event scheduling with conflict detection
- **Capacity Management**: Occupancy tracking with fire safety compliance
- **Artist Booking**: Performance scheduling and technical requirements
- **Ticketing System**: Multi-tier ticket allocation and sales
- **Event Promotion**: Social media integration and marketing tools

### Customer Experience Features
- **Profile Management**: Customer preferences and dietary requirements
- **Booking History**: Complete reservation history with modification options
- **Loyalty System**: Points-based rewards with VIP tier progression
- **Communication**: Multi-channel notifications (email, SMS, push)
- **Personalization**: AI-powered recommendations based on history

## 🧪 Testing Strategy

### Unit Testing (Jest + RTL)
```typescript
// Component testing with user interactions
test('BookingForm submits with valid data', async () => {
  const user = userEvent.setup()
  const mockSubmit = jest.fn()
  
  render(<BookingForm onSubmit={mockSubmit} />)
  
  await user.selectOptions(screen.getByRole('combobox'), '2024-12-31')
  await user.click(screen.getByText('Reserve Table'))
  
  expect(mockSubmit).toHaveBeenCalledWith(expectedData)
})
```

### Integration Testing (API Routes)
```typescript
// API endpoint testing with database mocking
describe('/api/bookings', () => {
  test('creates booking with valid data', async () => {
    const response = await POST('/api/bookings', validBookingData)
    
    expect(response.status).toBe(201)
    expect(response.data).toMatchObject({
      id: expect.any(String),
      status: 'confirmed'
    })
  })
})
```

### E2E Testing (Playwright)
```typescript
// Complete user workflow testing
test('user completes booking flow', async ({ page }) => {
  await page.goto('/booking')
  
  // Select table and time
  await page.click('[data-testid="table-4"]')
  await page.fill('[data-testid="date-picker"]', '2024-12-31')
  
  // Complete guest details and payment
  await page.fill('[data-testid="guest-name"]', 'John Doe')
  await page.click('[data-testid="confirm-booking"]')
  
  // Verify booking confirmation
  await expect(page.locator('[data-testid="confirmation"]')).toBeVisible()
})
```

## ⚡ Performance Optimization

### Bundle Optimization
- **Code Splitting**: Automatic route-based and manual component splitting
- **Tree Shaking**: Eliminate unused code from production bundles
- **Dynamic Imports**: Lazy loading for heavy components and features
- **Image Optimization**: Next.js Image with WebP conversion and sizing

### Runtime Performance
- **React Optimization**: Memo, useMemo, and useCallback for expensive operations
- **Virtualization**: Large list rendering for booking history and events
- **Caching**: Redis for API responses and computed values
- **CDN**: Global edge distribution via Vercel Edge Network

### Core Web Vitals Targets
- **LCP (Largest Contentful Paint)**: <2.5s on 3G networks
- **FID (First Input Delay)**: <100ms for interactive elements
- **CLS (Cumulative Layout Shift)**: <0.1 for stable layouts
- **Bundle Size**: <500KB initial load, <200KB per route chunk

## 🔧 Development Automation

### Code Generation
```bash
# Generate component with prohibition theming
npm run generate:component TableSelector --type organism --theme prohibition

# Generate API endpoint with validation
npm run generate:api events --crud --auth required --validation zod

# Generate test suites  
npm run generate:test BookingForm --unit --integration --e2e
```

### Quality Gates
- **Pre-commit Hooks**: ESLint, Prettier, TypeScript check, unit tests
- **CI/CD Pipeline**: Full test suite, build verification, security scanning
- **Staging Deployment**: Automated E2E testing in production-like environment
- **Production Deployment**: Blue-green deployment with automatic rollback

## 🎯 Development Goals

### Delivery Targets
- **Sprint Velocity**: 2-week iterations with predictable feature delivery
- **Code Quality**: >95% automated test pass rate with comprehensive coverage
- **Bug Rate**: <2% production issues per release cycle
- **Performance**: Consistent Core Web Vitals compliance

### User Experience Metrics
- **Booking Conversion**: >85% form completion rate
- **Load Performance**: <2s average page load time
- **Mobile Optimization**: Seamless experience for 70% mobile traffic
- **Accessibility**: 100% WCAG 2.1 AA compliance across all features

---

*Powered by Claude Sonnet 4 with 1M token context for comprehensive full-stack development*