export const mockTables = {
  tables: [
    { 
      id: 15, 
      capacity: 7, 
      location: 'Upstairs',
      combinable: true,
      currentBookings: []
    },
    { 
      id: 16, 
      capacity: 7, 
      location: 'Upstairs', 
      combinable: true,
      currentBookings: []
    }
  ],
  combiningRules: {
    minPartySize: 7,
    maxPartySize: 12,
    combinationTables: [15, 16],
    combinationFee: 25,
    setupTime: 15
  }
};