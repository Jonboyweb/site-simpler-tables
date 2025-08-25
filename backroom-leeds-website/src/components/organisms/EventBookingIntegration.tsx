'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/atoms';
import type { EventBookingIntegrationProps, TableAvailabilityInfo } from '@/types/components';

/**
 * EventBookingIntegration Component
 * 
 * Seamless booking flow integration within event detail page,
 * featuring table selection, package options, and direct booking.
 */
export function EventBookingIntegration({
  eventId,
  eventDate,
  availableTables,
  onTableSelect,
  compact = false,
}: EventBookingIntegrationProps) {
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<'basic' | 'premium' | null>(null);
  const [partySize, setPartySize] = useState<number>(2);
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();

  const availableTablesForBooking = availableTables.filter(table => table.available);
  const suitableTables = availableTablesForBooking.filter(table => table.capacity >= partySize);

  const packages = {
    basic: {
      name: 'Essential Experience',
      price: 170,
      description: 'Perfect introduction to The Backroom Leeds',
      includes: [
        'Reserved table for your party',
        'Dedicated table service',
        'Welcome cocktail for each guest',
        'Access to full bar menu',
        'Complimentary coat check',
      ],
    },
    premium: {
      name: 'VIP Speakeasy Experience',
      price: 350,
      description: 'The ultimate luxury experience',
      includes: [
        'Premium table location',
        'Bottle of premium spirits',
        'Gourmet appetizer selection',
        'Personal concierge service',
        'Priority bar service',
        'Exclusive speakeasy keepsakes',
      ],
    },
  };

  const handleTableSelect = (tableNumber: number) => {
    setSelectedTable(tableNumber);
    if (onTableSelect) {
      onTableSelect(tableNumber);
    }
  };

  const handleBookNow = async () => {
    if (!selectedTable || !selectedPackage) return;

    setIsLoading(true);
    
    // Construct booking URL with pre-selected options
    const bookingUrl = `/book/${eventId}?table=${selectedTable}&package=${selectedPackage}&size=${partySize}`;
    
    // Small delay for UX
    setTimeout(() => {
      router.push(bookingUrl);
    }, 500);
  };

  const formatDate = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(eventDate);

  if (compact) {
    return (
      <section className="luxury-event-card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-futura text-luxury-copper mb-2 tracking-wide">
              BOOK YOUR TABLE
            </h3>
            <p className="text-luxury-champagne/80 font-crimson italic">
              {availableTablesForBooking.length} tables available for {formatDate}
            </p>
          </div>
          <Button
            variant="gold"
            size="lg"
            onClick={() => router.push(`/book/${eventId}`)}
            className="luxury-cta-primary px-8 py-3"
          >
            View Booking Options
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="luxury-event-card p-8">
      {/* Section Header */}
      <div className="text-center mb-8">
        <h2 className="text-4xl font-futura text-luxury-copper mb-4 tracking-wide">
          BOOK YOUR TABLE
        </h2>
        <p className="text-luxury-champagne/80 font-crimson italic text-lg max-w-2xl mx-auto">
          Secure your exclusive table for {formatDate} and experience Leeds&apos; premier speakeasy
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column - Table Selection */}
        <div className="space-y-6">
          {/* Party Size */}
          <div>
            <h3 className="text-xl font-futura text-luxury-champagne mb-4 tracking-wide">
              PARTY SIZE
            </h3>
            <div className="flex gap-2 flex-wrap">
              {[2, 3, 4, 5, 6, 7, 8].map((size) => (
                <button
                  key={size}
                  onClick={() => setPartySize(size)}
                  className={`px-4 py-2 rounded-lg font-raleway transition-all duration-300 ${
                    partySize === size
                      ? 'bg-luxury-copper text-luxury-noir'
                      : 'bg-luxury-noir/40 text-luxury-champagne/80 hover:text-luxury-champagne hover:bg-luxury-copper/20'
                  }`}
                >
                  {size} {size === 1 ? 'Guest' : 'Guests'}
                </button>
              ))}
            </div>
          </div>

          {/* Table Selection */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-futura text-luxury-champagne tracking-wide">
                AVAILABLE TABLES
              </h3>
              <span className="text-luxury-copper text-sm font-raleway">
                {suitableTables.length} suitable for {partySize} guests
              </span>
            </div>

            {suitableTables.length > 0 ? (
              <div className="space-y-3">
                {suitableTables.map((table) => (
                  <div
                    key={table.tableNumber}
                    onClick={() => handleTableSelect(table.tableNumber)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all duration-300 ${
                      selectedTable === table.tableNumber
                        ? 'bg-luxury-copper/20 border-luxury-copper/60'
                        : 'bg-luxury-noir/30 border-luxury-copper/20 hover:border-luxury-copper/40'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-luxury-champagne font-raleway font-medium">
                          Table {table.tableNumber}
                        </h4>
                        <p className="text-luxury-champagne/60 text-sm capitalize">
                          {table.location} • Up to {table.capacity} guests • {table.priceRange}
                        </p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedTable === table.tableNumber
                          ? 'border-luxury-copper bg-luxury-copper'
                          : 'border-luxury-copper/40'
                      }`}>
                        {selectedTable === table.tableNumber && (
                          <div className="w-2 h-2 bg-luxury-noir rounded-full" />
                        )}
                      </div>
                    </div>

                    {/* Table Features */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {table.features.map((feature) => (
                        <span
                          key={feature}
                          className="px-2 py-1 bg-luxury-noir/40 text-luxury-champagne/70 text-xs font-raleway rounded"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 px-4 bg-luxury-noir/20 rounded-lg">
                <p className="text-luxury-champagne/60 font-crimson italic">
                  No tables available for {partySize} guests. 
                  <br />
                  Try a smaller party size or contact us for assistance.
                </p>
                <Button
                  href="/contact"
                  variant="ghost"
                  size="sm"
                  className="mt-3"
                >
                  Contact Us
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Package Selection */}
        <div className="space-y-6">
          <h3 className="text-xl font-futura text-luxury-champagne mb-4 tracking-wide">
            SELECT EXPERIENCE
          </h3>

          <div className="space-y-4">
            {Object.entries(packages).map(([key, pkg]) => (
              <div
                key={key}
                onClick={() => setSelectedPackage(key as 'basic' | 'premium')}
                className={`p-6 rounded-lg border cursor-pointer transition-all duration-300 ${
                  selectedPackage === key
                    ? 'bg-luxury-copper/20 border-luxury-copper/60'
                    : 'bg-luxury-noir/30 border-luxury-copper/20 hover:border-luxury-copper/40'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-luxury-champagne font-futura text-lg">
                      {pkg.name}
                    </h4>
                    <p className="text-luxury-champagne/60 text-sm font-crimson italic">
                      {pkg.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-futura text-luxury-gold">
                      £{pkg.price}
                    </div>
                    <div className="text-luxury-champagne/60 text-xs font-raleway">
                      per table
                    </div>
                  </div>
                </div>

                <ul className="space-y-2">
                  {pkg.includes.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-luxury-champagne/80">
                      <svg className="w-4 h-4 text-luxury-copper flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>

                <div className={`mt-4 w-5 h-5 rounded-full border-2 flex items-center justify-center ml-auto ${
                  selectedPackage === key
                    ? 'border-luxury-copper bg-luxury-copper'
                    : 'border-luxury-copper/40'
                }`}>
                  {selectedPackage === key && (
                    <div className="w-2 h-2 bg-luxury-noir rounded-full" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Booking Summary */}
          {selectedTable && selectedPackage && (
            <div className="p-6 bg-luxury-copper/10 border border-luxury-copper/30 rounded-lg">
              <h4 className="text-luxury-copper font-futura text-lg mb-4 tracking-wide">
                BOOKING SUMMARY
              </h4>
              <div className="space-y-2 text-sm font-raleway">
                <div className="flex justify-between text-luxury-champagne/80">
                  <span>Date:</span>
                  <span>{formatDate}</span>
                </div>
                <div className="flex justify-between text-luxury-champagne/80">
                  <span>Table:</span>
                  <span>#{selectedTable} ({partySize} guests)</span>
                </div>
                <div className="flex justify-between text-luxury-champagne/80">
                  <span>Package:</span>
                  <span>{packages[selectedPackage].name}</span>
                </div>
                <div className="border-t border-luxury-copper/20 pt-2 mt-3">
                  <div className="flex justify-between text-luxury-champagne font-medium">
                    <span>Total:</span>
                    <span className="text-luxury-gold">£{packages[selectedPackage].price}</span>
                  </div>
                  <div className="text-luxury-champagne/60 text-xs mt-1">
                    £50 deposit required • Remaining balance due on arrival
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Book Now Button */}
          <Button
            onClick={handleBookNow}
            disabled={!selectedTable || !selectedPackage || isLoading}
            loading={isLoading}
            variant="gold"
            size="lg"
            className="w-full py-4 text-lg font-medium luxury-cta-primary"
            artDeco
          >
            {isLoading ? 'Processing...' : 'Complete Booking'}
          </Button>

          {/* Help Text */}
          <div className="text-center">
            <p className="text-luxury-champagne/60 text-sm font-crimson italic mb-2">
              Need help with your booking or have special requirements?
            </p>
            <Button
              href="/contact"
              variant="ghost"
              size="sm"
              className="text-luxury-copper hover:text-luxury-gold"
            >
              Contact Our Team
            </Button>
          </div>
        </div>
      </div>

      {/* Policy Notice */}
      <div className="mt-8 p-4 bg-luxury-noir/20 border border-luxury-copper/20 rounded-lg">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-luxury-copper mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-luxury-champagne/80 text-sm font-raleway">
            <p className="mb-2">
              <strong>Booking Policy:</strong> All bookings require a £50 deposit per table. 
              Free cancellation up to 48 hours before the event. Maximum 2 tables per booking.
            </p>
            <p>
              <strong>Age Requirement:</strong> This is a 21+ event. Valid ID required for entry.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}