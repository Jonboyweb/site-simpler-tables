'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Metadata } from 'next';
import { BookingLayout } from '@/components/templates';
import { Card } from '@/components/molecules';
import { Button, Heading, Text, Badge } from '@/components/atoms';

interface BookingConfirmationData {
  bookingRef: string;
  customerName: string;
  date: string;
  time: string;
  partySize: number;
  totalAmount: number;
  depositAmount: number;
  remainingBalance: number;
}

function BookingConfirmationContent() {
  const searchParams = useSearchParams();
  
  // Parse booking data from URL parameters
  const bookingData: BookingConfirmationData = {
    bookingRef: searchParams.get('ref') || '',
    customerName: searchParams.get('name') || '',
    date: searchParams.get('date') || '',
    time: searchParams.get('time') || '',
    partySize: parseInt(searchParams.get('partySize') || '0'),
    totalAmount: parseFloat(searchParams.get('total') || '0'),
    depositAmount: parseFloat(searchParams.get('deposit') || '0'),
    remainingBalance: parseFloat(searchParams.get('remaining') || '0'),
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 > 12 ? hour24 - 12 : hour24;
    const period = hour24 >= 12 ? 'AM' : 'PM';
    return `${hour12}:${minutes} ${period}`;
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Badge variant="success" className="bg-green-500/20 text-green-400 border border-green-500/30 mb-6">
            Booking Confirmed
          </Badge>
          <Heading level={1} variant="bebas" className="text-5xl md:text-6xl text-speakeasy-gold mb-4">
            Welcome to The Backroom
          </Heading>
          <Text variant="body" className="text-lg text-speakeasy-champagne max-w-2xl mx-auto font-playfair">
            Your table has been reserved! We're excited to host you at Leeds' most exclusive speakeasy.
          </Text>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Booking Details */}
          <Card variant="bordered" padding="lg">
            <div className="space-y-6">
              <Heading level={3} variant="playfair" className="text-speakeasy-gold">
                Booking Details
              </Heading>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Text variant="caption" className="text-speakeasy-champagne/80">
                    Booking Reference:
                  </Text>
                  <Text variant="body" className="font-mono text-speakeasy-gold">
                    {bookingData.bookingRef}
                  </Text>
                </div>
                
                <div className="flex justify-between items-center">
                  <Text variant="caption" className="text-speakeasy-champagne/80">
                    Name:
                  </Text>
                  <Text variant="body" className="text-speakeasy-champagne">
                    {bookingData.customerName}
                  </Text>
                </div>
                
                <div className="flex justify-between items-center">
                  <Text variant="caption" className="text-speakeasy-champagne/80">
                    Date:
                  </Text>
                  <Text variant="body" className="text-speakeasy-champagne">
                    {formatDate(bookingData.date)}
                  </Text>
                </div>
                
                <div className="flex justify-between items-center">
                  <Text variant="caption" className="text-speakeasy-champagne/80">
                    Arrival Time:
                  </Text>
                  <Text variant="body" className="text-speakeasy-champagne">
                    {formatTime(bookingData.time)}
                  </Text>
                </div>
                
                <div className="flex justify-between items-center">
                  <Text variant="caption" className="text-speakeasy-champagne/80">
                    Party Size:
                  </Text>
                  <Text variant="body" className="text-speakeasy-champagne">
                    {bookingData.partySize} guests
                  </Text>
                </div>
              </div>
            </div>
          </Card>

          {/* Payment Summary */}
          <Card variant="bordered" padding="lg">
            <div className="space-y-6">
              <Heading level={3} variant="playfair" className="text-speakeasy-gold">
                Payment Summary
              </Heading>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Text variant="caption" className="text-speakeasy-champagne/80">
                    Deposit Paid:
                  </Text>
                  <Text variant="body" className="text-green-400">
                    £{bookingData.depositAmount.toFixed(2)}
                  </Text>
                </div>
                
                <div className="flex justify-between items-center">
                  <Text variant="caption" className="text-speakeasy-champagne/80">
                    Remaining Balance:
                  </Text>
                  <Text variant="body" className="text-speakeasy-champagne">
                    £{bookingData.remainingBalance.toFixed(2)}
                  </Text>
                </div>
                
                <div className="border-t border-speakeasy-gold/20 pt-4">
                  <div className="flex justify-between items-center">
                    <Text variant="body" className="font-semibold text-speakeasy-gold">
                      Total Package:
                    </Text>
                    <Text variant="body" className="font-semibold text-speakeasy-gold">
                      £{bookingData.totalAmount.toFixed(2)}
                    </Text>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Important Information */}
        <Card variant="bordered" padding="lg" className="mt-8 bg-speakeasy-burgundy/20">
          <div className="space-y-4">
            <Heading level={4} variant="playfair" className="text-speakeasy-gold">
              Important Information
            </Heading>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Text variant="small" className="text-speakeasy-champagne/90">
                  <strong>Check-in:</strong> Please arrive at your reserved time. Late arrivals may forfeit their booking.
                </Text>
              </div>
              <div>
                <Text variant="small" className="text-speakeasy-champagne/90">
                  <strong>Remaining Balance:</strong> Pay on arrival. Card payments accepted.
                </Text>
              </div>
              <div>
                <Text variant="small" className="text-speakeasy-champagne/90">
                  <strong>Cancellations:</strong> Must be made at least 48 hours in advance for a full refund.
                </Text>
              </div>
              <div>
                <Text variant="small" className="text-speakeasy-champagne/90">
                  <strong>Dress Code:</strong> Smart casual to formal. No sportswear or trainers.
                </Text>
              </div>
            </div>
          </div>
        </Card>

        {/* Next Steps */}
        <div className="mt-12 text-center space-y-6">
          <Heading level={3} variant="playfair" className="text-speakeasy-gold">
            What's Next?
          </Heading>
          <Text variant="body" className="text-speakeasy-champagne/90 max-w-2xl mx-auto">
            A confirmation email has been sent to your email address with your QR code for entry. 
            Please present this at the door along with valid ID.
          </Text>
          
          <div className="flex gap-4 justify-center flex-wrap">
            <Button variant="gold" size="lg" artDeco href="/">
              Return Home
            </Button>
            <Button variant="outline" size="lg" artDeco href="/events">
              View Events
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingConfirmationPage() {
  return (
    <BookingLayout currentStep={3} totalSteps={3}>
      <Suspense fallback={
        <div className="animate-pulse">
          <div className="bg-speakeasy-burgundy/30 rounded-lg h-96"></div>
        </div>
      }>
        <BookingConfirmationContent />
      </Suspense>
    </BookingLayout>
  );
}