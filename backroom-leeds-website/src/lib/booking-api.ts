import type { BookingFormData } from '@/types/components';
import type { CreateBookingRequest, BookingResponse } from '@/types/booking';

// Transform the form data from the component to the API format
export function transformBookingFormData(formData: BookingFormData): CreateBookingRequest {
  // Map drink package form values to API values
  const packageMapping: Record<string, string> = {
    'bronze': 'basic',
    'silver': 'premium',
    'gold': 'vip',
    'platinum': 'vip'
  };

  return {
    eventDate: formData.date,
    customerDetails: {
      name: formData.customerName,
      email: formData.customerEmail,
      phone: formData.customerPhone,
      partySize: formData.partySize,
      specialRequests: formData.specialRequests || undefined
    },
    tableSelection: {
      tableIds: formData.tableNumber ? [formData.tableNumber] : [1], // Default to table 1 if none selected
      arrivalTime: formData.time,
      drinksPackage: packageMapping[formData.drinkPackage || 'bronze'] || 'basic'
    },
    payment: {
      termsAccepted: true,
      marketingConsent: false,
      privacyPolicyAccepted: true,
      paymentStatus: 'pending'
    }
  };
}

// Submit booking to API
export async function submitBooking(formData: BookingFormData): Promise<{
  success: boolean;
  data?: BookingResponse;
  error?: string;
}> {
  try {
    const bookingRequest = transformBookingFormData(formData);
    
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingRequest),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || `HTTP error! status: ${response.status}`
      };
    }

    const data: BookingResponse = await response.json();
    return {
      success: true,
      data
    };

  } catch (error) {
    console.error('Booking submission error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    };
  }
}

// Helper function to build confirmation page URL
export function buildConfirmationUrl(bookingData: BookingResponse, formData: BookingFormData): string {
  const params = new URLSearchParams({
    ref: bookingData.bookingRef,
    name: formData.customerName,
    date: formData.date,
    time: formData.time,
    partySize: formData.partySize.toString(),
    total: bookingData.totalAmount.toString(),
    deposit: bookingData.depositAmount.toString(),
    remaining: bookingData.remainingBalance.toString()
  });

  return `/book/confirmation?${params.toString()}`;
}