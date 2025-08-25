# Backroom Development Agent Workflow

## 🚀 Development Agent Overview

**Agent**: `backroom-development-agent`  
**Model**: `claude-sonnet-4-20250514`  
**Context Window**: 1,000,000 tokens  
**Working Directory**: `./src`  
**Dependencies**: `backroom-architecture-agent`

## 🎯 Development Philosophy

**Architecture-First**: All implementation follows architectural blueprints  
**Component-Driven**: Reusable, accessible, and themeable components  
**Test-Driven**: Comprehensive testing at all levels  
**Performance-Conscious**: Core Web Vitals and user experience optimization

## 🏗️ Feature Development Workflow

### 1. Architecture Consultation
```
Development Agent → Architecture Agent
↓
- Review system design for feature
- Confirm technology stack alignment
- Validate component patterns
- Ensure quality attribute compliance
```

### 2. Component Planning
```
Feature Request → Component Analysis
↓
- Break down into atomic components
- Plan state management approach
- Design API integration points
- Consider accessibility requirements
```

### 3. Implementation Strategy
```
Planning → Test-Driven Development
↓
- Write component tests first
- Implement components incrementally
- Add API integration
- Validate against design system
```

### 4. Quality Validation
```
Implementation → Multi-Level Testing
↓
- Unit tests (>80% coverage)
- Integration tests (API endpoints)
- E2E tests (user workflows)
- Accessibility validation
```

## 🧩 Component Development Pattern

### Atomic Design Structure
```
src/components/
├── ui/           # shadcn/ui base components (atoms)
│   ├── button.tsx
│   ├── input.tsx
│   └── card.tsx
├── molecules/    # Combined UI components
│   ├── search-bar.tsx
│   ├── date-picker.tsx
│   └── booking-form-field.tsx
├── organisms/    # Complex feature components
│   ├── booking-form.tsx
│   ├── event-calendar.tsx
│   └── customer-dashboard.tsx
└── templates/    # Page layout templates
    ├── venue-layout.tsx
    └── admin-layout.tsx
```

### Component Creation Process
1. **Design System Check**: Verify against prohibition theme
2. **Accessibility First**: WCAG 2.1 AA compliance built-in
3. **Responsive Design**: Mobile-first with breakpoint optimization
4. **Type Safety**: Full TypeScript integration
5. **Testing**: Component tests with user interaction scenarios

## 🔌 API Development Pattern

### Endpoint Structure
```
src/app/api/
├── bookings/
│   ├── route.ts          # GET /api/bookings, POST /api/bookings
│   ├── [id]/route.ts     # GET, PUT, DELETE /api/bookings/[id]
│   └── availability/route.ts # GET /api/bookings/availability
├── events/
│   ├── route.ts          # Event CRUD operations
│   └── [id]/tickets/route.ts # Ticket management
└── customers/
    ├── route.ts          # Customer management
    └── [id]/preferences/route.ts # Preference handling
```

### API Implementation Process
1. **Schema Definition**: Zod schemas for validation
2. **Route Handler**: Next.js API route implementation
3. **Database Integration**: Prisma ORM with transactions
4. **Error Handling**: Consistent error responses
5. **Testing**: Integration tests with database mocking

## 🎨 Prohibition Theme Integration

### Art Deco Component Styling
```typescript
// Example: Booking form with prohibition theme
const BookingForm = () => {
  return (
    <Card className="bg-gradient-to-b from-speakeasy-noir to-speakeasy-noir/90 border-2 border-speakeasy-gold/30 art-deco-border">
      <CardHeader>
        <h2 className="font-bebas text-2xl text-speakeasy-gold tracking-wide">
          Reserve Your Table
        </h2>
      </CardHeader>
      <CardContent>
        <form className="space-y-6">
          <DatePicker className="vintage-hover" />
          <GuestSelector className="prohibition-styling" />
          <SpecialRequests className="art-deco-textarea" />
        </form>
      </CardContent>
    </Card>
  );
};
```

### Theme System Integration
- **Color Palette**: Speakeasy noir, burgundy, gold, copper, champagne
- **Typography**: Bebas Neue, Playfair Display, Great Vibes
- **Animations**: Art Deco transitions with Framer Motion
- **Patterns**: Sunburst backgrounds, geometric borders, vintage hover effects

## 📊 State Management Strategy

### Global State (Zustand)
```typescript
interface VenueStore {
  // User authentication state
  user: User | null;
  setUser: (user: User | null) => void;
  
  // Booking flow state
  bookingFlow: BookingState;
  updateBooking: (updates: Partial<BookingState>) => void;
  
  // UI theme state
  theme: 'classic' | 'modern' | 'luxury';
  setTheme: (theme: string) => void;
}
```

### Server State (React Query)
```typescript
// API data management with caching
const useBookings = () => {
  return useQuery({
    queryKey: ['bookings', user?.id],
    queryFn: () => fetchUserBookings(user?.id),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
```

## 🧪 Testing Strategy Implementation

### Component Testing
```typescript
// Example: Booking form component test
describe('BookingForm', () => {
  test('renders with prohibition theme', () => {
    render(<BookingForm />);
    expect(screen.getByText('Reserve Your Table')).toHaveClass('font-bebas');
  });
  
  test('handles form submission', async () => {
    const user = userEvent.setup();
    render(<BookingForm onSubmit={mockSubmit} />);
    
    await user.selectOptions(screen.getByRole('combobox'), '2024-12-31');
    await user.click(screen.getByText('Reserve Table'));
    
    expect(mockSubmit).toHaveBeenCalledWith(expectedBookingData);
  });
});
```

### API Testing
```typescript
// Example: Booking API endpoint test
describe('/api/bookings', () => {
  test('creates booking with valid data', async () => {
    const response = await POST('/api/bookings', {
      body: JSON.stringify(validBookingData),
    });
    
    expect(response.status).toBe(201);
    expect(response.data).toMatchObject({
      id: expect.any(String),
      status: 'confirmed',
    });
  });
});
```

### E2E Testing
```typescript
// Example: Complete booking workflow test
test('user can complete booking flow', async ({ page }) => {
  await page.goto('/booking');
  
  // Select table
  await page.click('[data-testid="table-4"]');
  
  // Choose date and time
  await page.fill('[data-testid="date-picker"]', '2024-12-31');
  await page.selectOption('[data-testid="time-select"]', '20:00');
  
  // Add guest details
  await page.fill('[data-testid="guest-name"]', 'John Doe');
  await page.fill('[data-testid="guest-email"]', 'john@example.com');
  
  // Complete payment
  await page.click('[data-testid="confirm-booking"]');
  
  // Verify confirmation
  await expect(page.locator('[data-testid="booking-confirmation"]')).toBeVisible();
});
```

## ⚡ Performance Optimization

### Bundle Optimization
- **Code Splitting**: Route-based and component-based splitting
- **Tree Shaking**: Remove unused code from bundles
- **Dynamic Imports**: Lazy loading for heavy components
- **Image Optimization**: Next.js Image component with WebP

### Runtime Performance
- **Memoization**: React.memo and useMemo for expensive operations
- **Virtualization**: For large lists (booking history, events)
- **Caching**: Redis for API responses and session data
- **CDN**: Vercel Edge Network for global optimization

## 🔧 Development Automation

### Code Generation Templates
```bash
# Component generation
npm run generate:component BookingCard --type organism --style prohibition

# API endpoint generation  
npm run generate:api bookings --crud --auth required

# Test file generation
npm run generate:tests BookingForm --type component --e2e
```

### Quality Gates
- **Pre-commit**: ESLint, Prettier, TypeScript check, unit tests
- **CI Pipeline**: Full test suite, build verification, security scan
- **Pre-deployment**: E2E tests, performance audit, accessibility check

## 🎯 Business Logic Implementation

### Booking System Logic
```typescript
class BookingEngine {
  async checkAvailability(date: Date, partySize: number): Promise<AvailableSlots> {
    // Real-time availability calculation
    // Consider existing bookings, table capacity, special events
    // Return available time slots with pricing
  }
  
  async createBooking(bookingData: BookingRequest): Promise<Booking> {
    // Validate availability, process payment
    // Create booking record, send confirmations
    // Handle waitlist if no availability
  }
}
```

### Event Management Logic
```typescript
class EventManager {
  async scheduleEvent(event: EventData): Promise<Event> {
    // Check venue availability and capacity
    // Handle artist requirements and technical specs
    // Create event with ticket allocation
  }
  
  async manageCapacity(eventId: string): Promise<CapacityStatus> {
    // Track occupancy vs. limits
    // Handle fire safety compliance
    // Manage entry and exit flows
  }
}
```

## 📈 Success Metrics

### Development Velocity
- **Feature Delivery**: 2-week sprint cycles with predictable delivery
- **Code Quality**: >95% automated test pass rate
- **Bug Rate**: <2% production bugs per release
- **Performance**: Meet Core Web Vitals targets consistently

### User Experience
- **Booking Conversion**: >85% completion rate
- **Load Performance**: <2s page load on 3G
- **Accessibility**: 100% WCAG 2.1 AA compliance
- **Mobile Usage**: Optimized for 70% mobile traffic