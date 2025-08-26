// ======================================================================================
// The Backroom Leeds - Advanced Booking System Type Definitions
// ======================================================================================
// Version: 3.4.0
// Date: 2025-08-27
// Description: TypeScript type definitions for Phase 3 advanced booking features
// ======================================================================================

import { Database } from './database.types';

// ======================================================================================
// ENUMS AND CONSTANTS
// ======================================================================================

export enum SpecialRequestType {
  BIRTHDAY = 'birthday',
  ANNIVERSARY = 'anniversary',
  HEN_PARTY = 'hen_party',
  STAG_PARTY = 'stag_party',
  CORPORATE_EVENT = 'corporate_event',
  DIETARY_RESTRICTION = 'dietary_restriction',
  ACCESSIBILITY_NEED = 'accessibility_need',
  VIP_SERVICE = 'vip_service',
  PHOTOGRAPHER_REQUEST = 'photographer_request',
  DECORATION_REQUEST = 'decoration_request',
  OTHER = 'other'
}

export enum SpecialRequestStatus {
  PENDING = 'pending',
  ACKNOWLEDGED = 'acknowledged',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum WaitlistStatus {
  ACTIVE = 'active',
  NOTIFIED = 'notified',
  EXPIRED = 'expired',
  CONVERTED = 'converted',
  CANCELLED = 'cancelled'
}

export enum CombinationStatus {
  AVAILABLE = 'available',
  RESERVED = 'reserved',
  OCCUPIED = 'occupied',
  BLOCKED = 'blocked'
}

export enum BookingHoldStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CONVERTED = 'converted',
  RELEASED = 'released'
}

export enum BookingSource {
  WEBSITE = 'website',
  PHONE = 'phone',
  WALK_IN = 'walk_in',
  ADMIN = 'admin',
  MOBILE_APP = 'mobile_app',
  THIRD_PARTY = 'third_party'
}

// ======================================================================================
// TABLE COMBINATION TYPES
// ======================================================================================

export interface TableCombination {
  id: string;
  primaryTableId: number;
  secondaryTableId: number;
  combinedCapacityMin: number;
  combinedCapacityMax: number;
  combinationName: string;
  description?: string;
  autoCombineThreshold: number;
  requiresApproval: boolean;
  setupTimeMinutes: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActiveTableCombination {
  id: string;
  combinationId: string;
  bookingId?: string;
  status: CombinationStatus;
  combinedAt: Date;
  separatedAt?: Date;
  combinedBy?: string;
  notes?: string;
}

export interface TableLayoutPosition {
  tableNumber: number;
  positionX: number;
  positionY: number;
  rotation: number;
  shape: 'rectangle' | 'circle' | 'square';
  width: number;
  height: number;
  floor: 'upstairs' | 'downstairs';
}

export interface CombinationCheckResult {
  shouldCombine: boolean;
  combinationId?: string;
  tables: number[];
  totalCapacity: number;
  notes: string;
}

// ======================================================================================
// ENHANCED BOOKING TYPES
// ======================================================================================

export interface EnhancedBooking extends Database['public']['Tables']['bookings']['Row'] {
  // Version control
  version: number;
  
  // Combination tracking
  isCombinedBooking: boolean;
  combinationId?: string;
  originalPartySize?: number;
  
  // Source and marketing
  bookingSource: BookingSource;
  referralCode?: string;
  marketingConsent: boolean;
  smsReminders: boolean;
  
  // Accessibility
  accessibilityRequirements?: string;
  
  // Internal management
  internalNotes?: string;
  tags?: string[];
  priorityLevel: number;
  
  // QR and check-in
  qrCodeData?: QRCodeData;
  checkInCode: string;
}

export interface QRCodeData {
  bookingRef: string;
  checkInCode: string;
  customerName: string;
  partySize: number;
  tableNumbers: number[];
  arrivalTime: string;
  encryptedSignature: string;
}

export interface BookingLimits {
  customerId: string;
  customerEmail: string;
  bookingDate: Date;
  bookingsCount: number;
  tablesReserved: number[];
  totalGuests: number;
  firstBookingId?: string;
  secondBookingId?: string;
  attemptedExcessBookings: number;
}

// ======================================================================================
// SPECIAL REQUESTS TYPES
// ======================================================================================

export interface SpecialRequest {
  id: string;
  bookingId: string;
  requestType: SpecialRequestType;
  status: SpecialRequestStatus;
  title: string;
  description?: string;
  priority: number; // 1-10, 10 being highest
  
  // Request details
  dietaryDetails?: DietaryDetails;
  accessibilityDetails?: AccessibilityDetails;
  celebrationDetails?: CelebrationDetails;
  customDetails?: Record<string, any>;
  
  // Assignment and tracking
  assignedTo?: string;
  assignedAt?: Date;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  completedBy?: string;
  completedAt?: Date;
  
  // Communication
  customerNotes?: string;
  staffNotes?: string;
  resolutionNotes?: string;
  
  // Cost tracking
  estimatedCost?: number;
  actualCost?: number;
  
  // Department flags
  requiresKitchenPrep: boolean;
  requiresBarPrep: boolean;
  requiresDecoration: boolean;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface DietaryDetails {
  restrictions: string[];
  allergies: string[];
  preferences: string[];
  numberOfPeople: number;
  severity: 'mild' | 'moderate' | 'severe';
  notes?: string;
}

export interface AccessibilityDetails {
  requiresWheelchairAccess: boolean;
  requiresElevator: boolean;
  requiresAccessibleRestroom: boolean;
  requiresAssistance: boolean;
  mobilityAids: string[];
  notes?: string;
}

export interface CelebrationDetails {
  occasionType: string;
  celebrantName: string;
  ageOrYears?: number;
  requiresCake: boolean;
  cakeDetails?: string;
  decorationPreferences?: string;
  musicRequests?: string[];
  photographyAllowed: boolean;
  surpriseElement: boolean;
  notes?: string;
}

export interface SpecialRequestTemplate {
  id: string;
  requestType: SpecialRequestType;
  templateName: string;
  description?: string;
  defaultPriority: number;
  estimatedPrepTime?: number; // minutes
  estimatedCost?: number;
  checklist?: ChecklistItem[];
  isActive: boolean;
}

export interface ChecklistItem {
  item: string;
  required: boolean;
  completed: boolean;
  completedBy?: string;
  completedAt?: Date;
}

// ======================================================================================
// WAITLIST TYPES
// ======================================================================================

export interface WaitlistEntry {
  id: string;
  
  // Customer information
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  
  // Booking preferences
  bookingDate: Date;
  preferredArrivalTime: string;
  alternativeArrivalTimes?: string[];
  partySize: number;
  flexiblePartySize: boolean;
  minPartySize?: number;
  maxPartySize?: number;
  
  // Table preferences
  tablePreferences?: number[];
  floorPreference?: 'upstairs' | 'downstairs';
  acceptsAnyTable: boolean;
  acceptsCombination: boolean;
  
  // Waitlist management
  status: WaitlistStatus;
  priorityScore: number;
  positionInQueue: number;
  estimatedAvailability?: Date;
  
  // Notification preferences
  notificationMethods: ('email' | 'sms' | 'phone')[];
  notificationLeadTime: number; // minutes
  maxNotifications: number;
  notificationsSent: number;
  lastNotifiedAt?: Date;
  
  // Conversion tracking
  convertedToBookingId?: string;
  convertedAt?: Date;
  declinedOffers: number;
  
  // Metadata
  source: BookingSource;
  specialOccasion?: string;
  notes?: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface WaitlistNotification {
  id: string;
  waitlistId: string;
  notificationType: 'availability' | 'reminder' | 'expiry_warning';
  availableTables: number[];
  availableTime: string;
  offerExpiresAt: Date;
  
  // Response tracking
  sentAt: Date;
  viewedAt?: Date;
  respondedAt?: Date;
  response?: 'accepted' | 'declined' | 'no_response';
  
  // Delivery status
  deliveryMethod: 'email' | 'sms' | 'phone';
  deliveryStatus: 'pending' | 'sent' | 'delivered' | 'failed';
  deliveryError?: string;
  
  metadata?: Record<string, any>;
}

export interface WaitlistMatchResult {
  waitlistId: string;
  matchedTables: number[];
  matchScore: number;
  availableTime: string;
  expiresAt: Date;
}

// ======================================================================================
// CUSTOMER PROFILE TYPES
// ======================================================================================

export interface CustomerProfile {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  
  // Booking statistics
  totalBookings: number;
  totalCancellations: number;
  totalNoShows: number;
  totalSpend: number;
  averagePartySize: number;
  
  // Preferences
  preferredTables?: number[];
  dietaryPreferences?: DietaryPreference[];
  favoriteDrinks?: DrinkPreference[];
  specialOccasions?: SpecialOccasion[];
  
  // VIP status
  isVip: boolean;
  vipTier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  loyaltyPoints: number;
  
  // Behavior tracking
  lastBookingDate?: Date;
  lastCancellationDate?: Date;
  reliabilityScore: number; // 0-100
  
  // Marketing
  marketingConsent: boolean;
  communicationPreferences?: CommunicationPreferences;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface DietaryPreference {
  type: string;
  severity?: 'preference' | 'intolerance' | 'allergy';
  notes?: string;
}

export interface DrinkPreference {
  category: string;
  brands: string[];
  notes?: string;
}

export interface SpecialOccasion {
  type: string;
  date: string; // MM-DD format for recurring
  name?: string;
  preferences?: string;
}

export interface CommunicationPreferences {
  emailEnabled: boolean;
  smsEnabled: boolean;
  phoneEnabled: boolean;
  preferredTime?: 'morning' | 'afternoon' | 'evening';
  frequency?: 'always' | 'weekly' | 'monthly' | 'special_offers_only';
}

// ======================================================================================
// BOOKING HOLD TYPES
// ======================================================================================

export interface BookingHold {
  id: string;
  sessionId: string;
  tableIds: number[];
  bookingDate: Date;
  arrivalTime: string;
  partySize: number;
  status: BookingHoldStatus;
  
  // Hold management
  expiresAt: Date;
  convertedToBookingId?: string;
  
  // Client information
  clientIp?: string;
  userAgent?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

// ======================================================================================
// REAL-TIME OPERATIONS TYPES
// ======================================================================================

export interface BookingStateChange {
  id: string;
  bookingId: string;
  sequenceNumber: number;
  fromStatus?: Database['public']['Enums']['booking_status'];
  toStatus: Database['public']['Enums']['booking_status'];
  changedBy?: string;
  changeReason?: string;
  changeData?: Record<string, any>;
  occurredAt: Date;
}

export interface AvailabilityCache {
  id: string;
  cacheKey: string;
  bookingDate: Date;
  timeSlot: string;
  
  // Availability data
  availableTables: number[];
  availableCombinations: string[];
  totalCapacity: number;
  
  // Cache management
  calculatedAt: Date;
  expiresAt: Date;
  isStale: boolean;
  
  // Performance metrics
  calculationTimeMs?: number;
  hitCount: number;
}

export interface RealTimeAvailability {
  tableNumber: number;
  floor: 'upstairs' | 'downstairs';
  capacityMin: number;
  capacityMax: number;
  isAvailable: boolean;
  canAccommodate: boolean;
  combinationPossible: boolean;
}

// ======================================================================================
// API RESPONSE TYPES
// ======================================================================================

export interface BookingAvailabilityResponse {
  date: string;
  timeSlots: TimeSlotAvailability[];
  summary: {
    totalAvailable: number;
    totalCapacity: number;
    busyPercentage: number;
  };
}

export interface TimeSlotAvailability {
  time: string;
  availableTables: TableAvailability[];
  availableCombinations: CombinationAvailability[];
  totalCapacity: number;
  isFullyBooked: boolean;
}

export interface TableAvailability {
  tableNumber: number;
  floor: 'upstairs' | 'downstairs';
  capacity: {
    min: number;
    max: number;
  };
  features?: string[];
  isAvailable: boolean;
  holdExpiresAt?: Date;
}

export interface CombinationAvailability {
  combinationId: string;
  tables: number[];
  combinedCapacity: {
    min: number;
    max: number;
  };
  setupRequired: boolean;
  setupTimeMinutes: number;
}

// ======================================================================================
// CONFLICT RESOLUTION TYPES
// ======================================================================================

export interface BookingConflict {
  type: 'double_booking' | 'capacity_exceeded' | 'limit_exceeded' | 'hold_conflict';
  severity: 'warning' | 'error' | 'critical';
  affectedBookings: string[];
  affectedTables: number[];
  message: string;
  suggestedResolution?: string;
}

export interface OptimisticLockError {
  bookingId: string;
  expectedVersion: number;
  actualVersion: number;
  conflictingChanges: Record<string, any>;
}

// ======================================================================================
// REPORTING TYPES
// ======================================================================================

export interface BookingMetrics {
  date: Date;
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  arrivedBookings: number;
  noShowBookings: number;
  totalGuests: number;
  totalRevenue: number;
  averagePartySize: number;
  tableUtilization: number;
  waitlistConversions: number;
  specialRequestsCompleted: number;
}

export interface TableUtilizationMetrics {
  tableNumber: number;
  floor: 'upstairs' | 'downstairs';
  bookingsCount: number;
  totalGuests: number;
  totalRevenue: number;
  utilizationPercentage: number;
  averagePartySize: number;
  popularTimes: string[];
}

// ======================================================================================
// HELPER TYPES
// ======================================================================================

export type BookingUpdatePayload = Partial<EnhancedBooking> & {
  expectedVersion: number;
};

export type WaitlistPriority = 'low' | 'normal' | 'high' | 'urgent';

export type NotificationChannel = 'email' | 'sms' | 'phone' | 'push';

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
}

// ======================================================================================
// VALIDATION SCHEMAS
// ======================================================================================

export const BOOKING_LIMITS = {
  MAX_BOOKINGS_PER_CUSTOMER_PER_DAY: 2,
  MAX_PARTY_SIZE: 20,
  MIN_PARTY_SIZE: 1,
  MAX_TABLES_PER_BOOKING: 2,
  HOLD_DURATION_MINUTES: 15,
  CANCELLATION_CUTOFF_HOURS: 48,
  CHECK_IN_CODE_LENGTH: 6,
  BOOKING_REF_FORMAT: /^BRL-\d{4}-\d{5}$/
} as const;

export const WAITLIST_LIMITS = {
  MAX_WAITLIST_ENTRIES_PER_CUSTOMER: 3,
  DEFAULT_EXPIRY_HOURS: 24,
  MAX_NOTIFICATIONS: 3,
  DEFAULT_NOTIFICATION_LEAD_TIME_MINUTES: 120,
  PRIORITY_SCORE_RANGE: { min: 0, max: 1000 }
} as const;

// ======================================================================================
// END OF ADVANCED BOOKING TYPE DEFINITIONS
// ======================================================================================