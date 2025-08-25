export const mockTableAvailability = {
  tables: [
    { id: 1, capacity: 4, floor: 'upstairs', isAvailable: true },
    { id: 2, capacity: 6, floor: 'downstairs', isAvailable: true },
    { id: 3, capacity: 4, floor: 'upstairs', isAvailable: false },
  ],
  event: {
    id: 'la-fiesta-2025-08-30',
    name: 'LA FIESTA',
    date: '2025-08-30',
    startTime: '22:00',
    endTime: '03:00',
  },
};

export const mockBookingData = {
  customerDetails: {
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+447911123456',
  },
  tableSelection: {
    tableId: 2,
    capacity: 6,
    floor: 'downstairs',
  },
  packageDetails: {
    id: 'premium-package',
    name: 'Premium Package',
    price: 450,
    deposit: 50,
  },
  gdprConsent: true,
};