export const mockBookingConfirmation = {
  customer: {
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    phone: '+44 7700 900123'
  },
  booking: {
    reference: 'BRL-2025-ABC123',
    date: '2025-08-30',
    arrivalTime: '21:00',
    tableNumber: 8,
    partySize: 4,
    specialRequests: 'Birthday celebration'
  },
  payment: {
    depositPaid: 50,
    remainingBalance: 200,
    totalAmount: 250,
    drinksPackage: 'Premium Bottle Service'
  },
  qrCode: {
    dataUrl: 'data:image/png;base64,mock-qr-code',
    checkInCode: 'CH-456789'
  }
};

export const mockCancellationConfirmation = {
  customer: { 
    name: 'John Smith', 
    email: 'john.smith@example.com' 
  },
  booking: { 
    reference: 'BRL-2025-XYZ789', 
    date: '2025-08-30' 
  },
  cancellation: {
    date: '2025-08-28',
    refundEligible: true,
    refundAmount: 50,
    reason: 'Customer request'
  }
};