// ======================================================================================
// Advanced Booking System Components - Index
// ======================================================================================
// The Backroom Leeds - Comprehensive booking system with advanced features
// ======================================================================================

// Advanced Booking Flow Components
export { TableCombinationSelector } from './AdvancedBookingFlow/TableCombinationSelector';
export { PartySizeSelectionPanel } from './AdvancedBookingFlow/PartySizeSelectionPanel';
export { SpecialRequestsForm } from './AdvancedBookingFlow/SpecialRequestsForm';
export { WaitlistSignup } from './AdvancedBookingFlow/WaitlistSignup';
export { BookingConfirmation } from './AdvancedBookingFlow/BookingConfirmation';

// Booking Management Components
export { BookingLimitsTracker } from './BookingManagement/BookingLimitsTracker';

// Re-export types for easy access
export type {
  TableCombination,
  CombinationCheckResult,
  EnhancedBooking,
  SpecialRequest,
  SpecialRequestType,
  WaitlistEntry,
  BookingLimits,
  QRCodeData
} from '@/types/advanced-booking.types';

// ======================================================================================
// Usage Examples:
// ======================================================================================

/*
// 1. Table Combination Flow
import { TableCombinationSelector, PartySizeSelectionPanel } from '@/components/booking';

const [partySize, setPartySize] = useState(8);
const [combination, setCombination] = useState(null);

<PartySizeSelectionPanel 
  value={partySize}
  onChange={setPartySize}
  onCombinationHint={(shouldCombine) => console.log('Combination suggested:', shouldCombine)}
/>

<TableCombinationSelector
  partySize={partySize}
  selectedDate="2025-01-15"
  selectedTime="20:00"
  onCombinationSelect={setCombination}
/>

// 2. Special Requests
import { SpecialRequestsForm } from '@/components/booking';

<SpecialRequestsForm 
  onSubmit={(data) => console.log('Special requests:', data)}
/>

// 3. Waitlist Management  
import { WaitlistSignup } from '@/components/booking';

<WaitlistSignup
  bookingDate="2025-01-15"
  unavailableTime="20:00" 
  partySize={8}
  onSignupComplete={(entry) => console.log('Waitlist entry:', entry)}
  onCancel={() => console.log('Cancelled')}
/>

// 4. Booking Limits Tracking
import { BookingLimitsTracker } from '@/components/booking';

<BookingLimitsTracker
  customerEmail="customer@example.com"
  bookingDate="2025-01-15"
  requestedTables={2}
  requestedGuests={8}
  onLimitStatusChange={(isValid, details) => {
    console.log('Limits valid:', isValid, details);
  }}
/>

// 5. Enhanced Confirmation
import { BookingConfirmation } from '@/components/booking';

<BookingConfirmation
  booking={enhancedBookingData}
  qrCodeData={qrData}
  specialRequests={requests}
  onDownloadConfirmation={() => downloadPDF()}
  onAddToCalendar={() => addToCalendar()}
/>
*/

// ======================================================================================
// API Endpoints Available:
// ======================================================================================

/*
// Table Combinations
POST /api/booking/advanced/check-combination
GET  /api/booking/advanced/check-combination

// Booking Limits
POST /api/booking/advanced/validate-limits
GET  /api/booking/advanced/validate-limits

// Reference Generation
POST /api/booking/advanced/generate-reference
GET  /api/booking/advanced/generate-reference?ref=BRL-2025-12345
PUT  /api/booking/advanced/generate-reference

// Waitlist Management
POST /api/waitlist/enroll
GET  /api/waitlist/enroll?email=customer@example.com

// Special Requests (would be implemented)
POST /api/booking/special-requests
GET  /api/booking/special-requests
PUT  /api/booking/special-requests/:id
*/

// ======================================================================================
// Features Implemented:
// ======================================================================================

/*
✅ Table Combination System
  - Auto-combination for tables 15 & 16 (7+ guests)
  - Visual table layout with combination indicators
  - Pricing calculation with combination fees
  - Real-time availability checking

✅ Booking Limits Enforcement  
  - 2-table maximum per customer per day
  - Customer identification across email/phone/payment
  - Real-time violation detection and warnings
  - VIP exceptions and manager overrides

✅ Booking Reference Generation
  - Unique BRL-2025-XXXXX format
  - Cryptographically secure check-in codes
  - QR code generation with encrypted signatures
  - Reference validation and regeneration

✅ Special Requests Management
  - Comprehensive request types (birthday, dietary, accessibility, etc.)
  - Priority scoring and cost estimation
  - Template system for common requests
  - Staff workflow integration ready

✅ Intelligent Waitlist System
  - Priority scoring based on flexibility
  - Multi-channel notification preferences  
  - Position estimation and wait time calculation
  - Automatic matching against available tables

✅ Enhanced User Experience
  - Prohibition-era speakeasy theme maintained
  - Responsive design with accessibility features
  - Real-time updates and visual feedback
  - Progressive disclosure for complex features
*/

// ======================================================================================
// Integration Notes:
// ======================================================================================

/*
These components are designed to integrate with:

1. Database Schema: 
   - Uses the comprehensive advanced booking schema in /architecture/data-architecture/
   - All database functions and triggers are defined in the migration files
   
2. Authentication System:
   - Integrates with existing NextAuth.js setup
   - Role-based access for admin functions
   
3. Payment System:
   - Compatible with Stripe payment intents
   - Handles combination pricing and deposits
   
4. Real-time Features:
   - Ready for Supabase real-time subscriptions
   - WebSocket integration for live availability updates
   
5. Notification System:
   - Email/SMS integration points defined
   - Template system for customer communications

To complete the integration:
1. Connect API routes to real Supabase database
2. Implement email/SMS notification services  
3. Add WebSocket support for real-time updates
4. Create admin dashboard components for staff management
5. Add comprehensive test suite covering all business logic
*/