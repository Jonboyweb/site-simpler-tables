'use client';

import { useState } from 'react';
import { Card } from '@/components/molecules';
import { Button, Heading, Text, Input } from '@/components/atoms';

interface ManualCheckInProps {
  onCheckInSuccess: (result: any) => void;
}

interface SearchResult {
  id: string;
  booking_ref: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  party_size: number;
  arrival_time: string;
  table_ids: number[];
  tables: Array<{
    table_number: number;
    floor: string;
  }>;
  status: 'confirmed' | 'arrived';
  hasSpecialRequests: boolean;
  canCheckIn: boolean;
}

interface CustomerVerification {
  customerName: string;
  partySize: number;
  arrivalTime: string;
}

export const ManualCheckIn = ({ onCheckInSuccess }: ManualCheckInProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'booking_ref' | 'name' | 'phone'>('booking_ref');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<SearchResult | null>(null);
  const [verification, setVerification] = useState<CustomerVerification>({
    customerName: '',
    partySize: 1,
    arrivalTime: ''
  });
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVerification, setShowVerification] = useState(false);

  // Search for bookings
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search term');
      return;
    }

    setLoading(true);
    setError(null);
    setSearchResults([]);

    try {
      const params = new URLSearchParams({
        query: searchQuery.trim(),
        searchType
      });

      const response = await fetch(`/api/door-staff/search?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }

      setSearchResults(data.bookings || []);

      if (data.bookings?.length === 0) {
        setError('No bookings found matching your search criteria');
      }

    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Failed to search bookings');
    } finally {
      setLoading(false);
    }
  };

  // Select booking for verification
  const handleSelectBooking = (booking: SearchResult) => {
    if (!booking.canCheckIn) {
      setError('This booking cannot be checked in (already arrived or cancelled)');
      return;
    }

    setSelectedBooking(booking);
    setVerification({
      customerName: '',
      partySize: booking.party_size,
      arrivalTime: booking.arrival_time
    });
    setShowVerification(true);
    setError(null);
  };

  // Complete check-in with verification
  const handleCheckIn = async () => {
    if (!selectedBooking) return;

    // Verify customer details match
    if (verification.customerName.toLowerCase().trim() !== selectedBooking.customer_name.toLowerCase().trim()) {
      setError('Customer name does not match the booking');
      return;
    }

    if (verification.partySize !== selectedBooking.party_size) {
      setError('Party size does not match the booking');
      return;
    }

    if (verification.arrivalTime !== selectedBooking.arrival_time) {
      setError('Arrival time does not match the booking');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/door-staff/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookingId: selectedBooking.id,
          method: 'manual',
          verificationData: {
            customerName: verification.customerName,
            partySize: verification.partySize,
            arrivalTime: verification.arrivalTime
          }
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Check-in failed');
      }

      onCheckInSuccess({
        success: true,
        booking: {
          id: selectedBooking.id,
          bookingRef: selectedBooking.booking_ref,
          customerName: selectedBooking.customer_name,
          partySize: selectedBooking.party_size,
          tableIds: selectedBooking.table_ids,
          tables: selectedBooking.tables
        },
        checkedInAt: result.checkedInAt,
        method: 'manual'
      });

      // Reset form
      handleReset();

    } catch (err) {
      console.error('Check-in error:', err);
      setError(err instanceof Error ? err.message : 'Failed to complete check-in');
    } finally {
      setProcessing(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedBooking(null);
    setVerification({
      customerName: '',
      partySize: 1,
      arrivalTime: ''
    });
    setShowVerification(false);
    setError(null);
  };

  // Handle Enter key in search
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleSearch();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Search Interface */}
      <Card className="p-6">
        <Heading level={3} variant="bebas" className="text-speakeasy-gold mb-4">
          🔍 Manual Booking Search
        </Heading>

        <div className="space-y-4">
          {/* Search Type Selector */}
          <div className="flex gap-2">
            {[
              { key: 'booking_ref', label: '📄 Booking Ref' },
              { key: 'name', label: '👤 Name' },
              { key: 'phone', label: '📞 Phone' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSearchType(key as any)}
                className={`px-3 py-2 rounded-sm text-xs font-bebas tracking-wider border transition-all ${
                  searchType === key
                    ? 'bg-speakeasy-gold/20 text-speakeasy-gold border-speakeasy-gold/50'
                    : 'bg-speakeasy-noir/30 text-speakeasy-champagne border-speakeasy-gold/20 hover:bg-speakeasy-gold/10'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="flex gap-2">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                searchType === 'booking_ref' ? 'BRL-2025-XXXXX' :
                searchType === 'name' ? 'Customer name' :
                'Phone number'
              }
              disabled={loading}
              className="flex-1 bg-speakeasy-noir/50 border-speakeasy-gold/30 text-speakeasy-champagne"
            />
            <Button
              onClick={handleSearch}
              disabled={loading || !searchQuery.trim()}
              className="bg-speakeasy-gold text-speakeasy-noir hover:bg-speakeasy-champagne"
            >
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <Text variant="caption" className="text-speakeasy-champagne/70">
                Found {searchResults.length} booking{searchResults.length !== 1 ? 's' : ''}:
              </Text>
              
              {searchResults.map((booking) => (
                <div
                  key={booking.id}
                  onClick={() => handleSelectBooking(booking)}
                  className={`p-3 border rounded-sm cursor-pointer transition-all ${
                    booking.canCheckIn
                      ? 'bg-speakeasy-noir/30 border-speakeasy-gold/20 hover:bg-speakeasy-gold/10 hover:border-speakeasy-gold/40'
                      : 'bg-gray-800/30 border-gray-600/20 cursor-not-allowed opacity-60'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <Text className="font-medium text-speakeasy-champagne">
                        {booking.customer_name}
                      </Text>
                      <Text variant="caption" className="text-speakeasy-copper">
                        {booking.booking_ref} • {booking.party_size} guests • {booking.arrival_time}
                      </Text>
                      <Text variant="caption" className="text-speakeasy-copper">
                        Tables: {booking.tables?.map(t => t.table_number).join(', ') || 'TBD'}
                      </Text>
                    </div>
                    
                    <div className="text-right">
                      {booking.status === 'arrived' ? (
                        <span className="text-green-400 text-xs">✅ Arrived</span>
                      ) : booking.canCheckIn ? (
                        <span className="text-blue-400 text-xs">⏳ Ready</span>
                      ) : (
                        <span className="text-gray-400 text-xs">❌ Unavailable</span>
                      )}
                      
                      {booking.hasSpecialRequests && (
                        <div className="text-speakeasy-gold text-xs mt-1">⭐ Special</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-400/30 rounded-sm">
              <Text className="text-red-400 text-sm">
                ⚠️ {error}
              </Text>
            </div>
          )}
        </div>
      </Card>

      {/* Customer Verification */}
      {showVerification && selectedBooking ? (
        <Card className="p-6">
          <div className="text-center mb-4">
            <div className="text-4xl mb-2">👤</div>
            <Heading level={3} variant="bebas" className="text-speakeasy-gold">
              Verify Customer Details
            </Heading>
            <Text variant="caption" className="text-speakeasy-copper">
              Ask the customer to confirm these details
            </Text>
          </div>

          <div className="space-y-4 mb-6">
            <div className="p-3 bg-speakeasy-noir/30 rounded-sm border border-speakeasy-gold/20">
              <Text variant="caption" className="text-speakeasy-copper">Booking Reference:</Text>
              <Text className="font-mono text-speakeasy-champagne">
                {selectedBooking.booking_ref}
              </Text>
            </div>

            <div>
              <label className="block text-speakeasy-copper text-sm mb-1">
                Customer Name:
              </label>
              <Input
                type="text"
                value={verification.customerName}
                onChange={(e) => setVerification(prev => ({ ...prev, customerName: e.target.value }))}
                placeholder={`Expected: ${selectedBooking.customer_name}`}
                className="w-full bg-speakeasy-noir/50 border-speakeasy-gold/30 text-speakeasy-champagne"
              />
            </div>

            <div>
              <label className="block text-speakeasy-copper text-sm mb-1">
                Party Size:
              </label>
              <Input
                type="number"
                value={verification.partySize}
                onChange={(e) => setVerification(prev => ({ ...prev, partySize: parseInt(e.target.value) }))}
                min="1"
                max="20"
                className="w-full bg-speakeasy-noir/50 border-speakeasy-gold/30 text-speakeasy-champagne"
              />
              <Text variant="caption" className="text-speakeasy-copper">
                Expected: {selectedBooking.party_size} guests
              </Text>
            </div>

            <div>
              <label className="block text-speakeasy-copper text-sm mb-1">
                Arrival Time:
              </label>
              <Input
                type="time"
                value={verification.arrivalTime}
                onChange={(e) => setVerification(prev => ({ ...prev, arrivalTime: e.target.value }))}
                className="w-full bg-speakeasy-noir/50 border-speakeasy-gold/30 text-speakeasy-champagne"
              />
              <Text variant="caption" className="text-speakeasy-copper">
                Expected: {selectedBooking.arrival_time}
              </Text>
            </div>

            <div className="p-3 bg-speakeasy-noir/30 rounded-sm border border-speakeasy-gold/20">
              <Text variant="caption" className="text-speakeasy-copper">Table Assignment:</Text>
              <Text className="text-speakeasy-champagne">
                {selectedBooking.tables?.map(t => `Table ${t.table_number} (${t.floor})`).join(', ')}
              </Text>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleCheckIn}
              disabled={processing || !verification.customerName.trim()}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {processing ? 'Checking In...' : '✅ Confirm Check-In'}
            </Button>
            <Button
              onClick={() => setShowVerification(false)}
              variant="ghost"
              disabled={processing}
              className="text-speakeasy-copper hover:text-speakeasy-gold"
            >
              Back
            </Button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-400/30 rounded-sm">
              <Text className="text-red-400 text-sm">
                ⚠️ {error}
              </Text>
            </div>
          )}
        </Card>
      ) : (
        <Card className="p-6">
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🔍</div>
            <Heading level={3} variant="bebas" className="text-speakeasy-champagne mb-2">
              Search for Booking
            </Heading>
            <Text className="text-speakeasy-copper mb-4">
              Search by booking reference, customer name, or phone number
            </Text>
            
            {searchResults.length === 0 && (
              <div className="text-sm text-speakeasy-copper/70">
                <p>💡 Quick tips:</p>
                <p>• Booking references format: BRL-2025-XXXXX</p>
                <p>• Names: Search by first or last name</p>
                <p>• Phone: Include or exclude spaces/dashes</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};