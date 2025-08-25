import { z } from 'zod';

// Validation schemas for each step
export const customerDetailsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name too long"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().regex(/^(\+44|0)[0-9\s\-()]{10,15}$/, "Please enter a valid UK phone number"),
  partySize: z.number().min(1, "Party size must be at least 1").max(12, "Maximum party size is 12"),
  specialRequests: z.string().max(500, "Special requests too long").optional()
});

export const tableSelectionSchema = z.object({
  tableIds: z.array(z.number()).min(1, "Please select at least one table").max(2, "Maximum 2 tables allowed"),
  arrivalTime: z.string().min(1, "Please select an arrival time"),
  drinksPackage: z.string().min(1, "Please select a drinks package")
});

export const paymentSchema = z.object({
  termsAccepted: z.boolean().refine(val => val === true, "You must accept the terms and conditions"),
  marketingConsent: z.boolean().optional(),
  privacyPolicyAccepted: z.boolean().refine(val => val === true, "You must accept the privacy policy")
});

// Combined form data type
export type BookingFormData = z.infer<typeof customerDetailsSchema> & 
                              z.infer<typeof tableSelectionSchema> & 
                              z.infer<typeof paymentSchema>;

export type CustomerDetailsData = z.infer<typeof customerDetailsSchema>;
export type TableSelectionData = z.infer<typeof tableSelectionSchema>;
export type PaymentData = z.infer<typeof paymentSchema>;

// Drinks packages
export interface DrinksPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  bottles?: number;
  mixers?: string[];
  features?: string[];
}

export const DRINKS_PACKAGES: DrinksPackage[] = [
  {
    id: 'basic',
    name: 'Basic Package',
    description: 'Perfect for smaller groups',
    price: 170,
    bottles: 1,
    mixers: ['Coke', 'Lemonade', 'Orange'],
    features: ['1 Premium bottle', 'Mixers included', 'Ice & garnishes']
  },
  {
    id: 'premium',
    name: 'Premium Package',
    description: 'Great for medium groups',
    price: 320,
    bottles: 2,
    mixers: ['Coke', 'Lemonade', 'Orange', 'Cranberry'],
    features: ['2 Premium bottles', 'Premium mixers', 'Ice & garnishes', 'Reserved seating']
  },
  {
    id: 'vip',
    name: 'VIP Package',
    description: 'Ultimate night out experience',
    price: 580,
    bottles: 3,
    mixers: ['Coke', 'Lemonade', 'Orange', 'Cranberry', 'Ginger Beer'],
    features: ['3 Premium bottles', 'Premium mixers', 'Ice & garnishes', 'Priority service', 'VIP area access']
  }
];

// Event-specific package recommendations
export const getRecommendedPackages = (eventType?: string) => {
  const allPackages = DRINKS_PACKAGES;
  
  switch (eventType) {
    case 'LA_FIESTA':
      // Emphasize premium and VIP for LA FIESTA (party atmosphere)
      return allPackages.map(pkg => ({
        ...pkg,
        recommended: pkg.id === 'premium'
      }));
    case 'SHHH':
      // VIP packages recommended for intimate SHHH! events
      return allPackages.map(pkg => ({
        ...pkg,
        recommended: pkg.id === 'vip'
      }));
    case 'NOSTALGIA':
      // Classic experience - basic to premium recommended
      return allPackages.map(pkg => ({
        ...pkg,
        recommended: pkg.id === 'basic' || pkg.id === 'premium'
      }));
    default:
      // Default recommendation for general bookings
      return allPackages.map(pkg => ({
        ...pkg,
        recommended: pkg.id === 'premium'
      }));
  }
};

// Arrival time slots
export const ARRIVAL_TIMES = [
  { value: '23:00', label: '11:00 PM', description: 'Early arrival - best table choice' },
  { value: '23:30', label: '11:30 PM', description: 'Popular time slot' },
  { value: '00:00', label: '12:00 AM', description: 'Peak time - buzzing atmosphere' },
  { value: '00:30', label: '12:30 AM', description: 'Late arrival - party in full swing' },
  { value: '01:00', label: '1:00 AM', description: 'Last arrival slot' }
];

// Form step configuration
export interface FormStep {
  id: string;
  title: string;
  description: string;
  required: boolean;
}

export const FORM_STEPS: FormStep[] = [
  {
    id: 'customer-details',
    title: 'Customer Details',
    description: 'Tell us about your group',
    required: true
  },
  {
    id: 'table-selection',
    title: 'Table & Package',
    description: 'Choose your table and drinks package',
    required: true
  },
  {
    id: 'payment',
    title: 'Confirmation & Payment',
    description: 'Review and complete your booking',
    required: true
  }
];

// Booking status types
export type BookingStatus = 'draft' | 'pending' | 'confirmed' | 'cancelled' | 'arrived' | 'no_show';

// Booking API types
export interface CreateBookingRequest {
  eventDate: string;
  eventInstanceId?: string; // New field to link booking to specific event
  customerDetails: CustomerDetailsData;
  tableSelection: TableSelectionData;
  payment: PaymentData;
}

export interface BookingResponse {
  id: string;
  bookingRef: string;
  status: BookingStatus;
  paymentIntent?: {
    id: string;
    clientSecret: string;
    amount: number;
  };
  totalAmount: number;
  depositAmount: number;
  remainingBalance: number;
  createdAt: string;
}

export interface BookingError {
  code: string;
  message: string;
  field?: string;
}