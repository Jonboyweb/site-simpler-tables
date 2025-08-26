'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { 
  CheckCircle, 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  CreditCard,
  Mail,
  Phone,
  Smartphone,
  Download,
  Share2,
  Copy,
  Star,
  Gift,
  Sparkles,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { LoadingSpinner } from '@/components/atoms/LoadingSpinner';
import { EnhancedBooking, SpecialRequest, QRCodeData } from '@/types/advanced-booking.types';

interface BookingConfirmationProps {
  booking: EnhancedBooking;
  qrCodeData: QRCodeData;
  specialRequests?: SpecialRequest[];
  onDownloadConfirmation: () => void;
  onAddToCalendar: () => void;
  className?: string;
}

interface ConfirmationStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  timestamp?: Date;
}

export function BookingConfirmation({
  booking,
  qrCodeData,
  specialRequests = [],
  onDownloadConfirmation,
  onAddToCalendar,
  className = ''
}: BookingConfirmationProps) {
  const [copySuccess, setCopySuccess] = useState(false);
  const [confirmationSteps, setConfirmationSteps] = useState<ConfirmationStep[]>([
    {
      id: 'booking-created',
      title: 'Booking Created',
      description: 'Your table reservation has been confirmed',
      status: 'completed',
      timestamp: new Date()
    },
    {
      id: 'payment-processed',
      title: 'Payment Processed',
      description: 'Deposit payment has been successfully processed',
      status: 'completed',
      timestamp: new Date()
    },
    {
      id: 'confirmation-sent',
      title: 'Confirmation Sent',
      description: 'Confirmation email sent to your address',
      status: 'pending'
    },
    {
      id: 'qr-generated',
      title: 'QR Code Generated',
      description: 'Your digital check-in code is ready',
      status: 'completed',
      timestamp: new Date()
    }
  ]);

  // Simulate confirmation email sending
  useEffect(() => {
    const timer = setTimeout(() => {
      setConfirmationSteps(prev => prev.map(step => 
        step.id === 'confirmation-sent' 
          ? { ...step, status: 'completed' as const, timestamp: new Date() }
          : step
      ));
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const copyBookingReference = async () => {
    try {
      await navigator.clipboard.writeText(booking.booking_reference);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy booking reference:', err);
    }
  };

  const shareBooking = async () => {
    const shareData = {
      title: 'The Backroom Leeds - Table Booking',
      text: `My table booking at The Backroom Leeds - Reference: ${booking.booking_reference}`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    }
  };

  const formatDateTime = (date: string, time: string) => {
    const bookingDate = new Date(`${date}T${time}`);
    return {
      date: bookingDate.toLocaleDateString('en-GB', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      }),
      time: bookingDate.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })
    };
  };

  const { date: formattedDate, time: formattedTime } = formatDateTime(
    booking.event_date.toString(), 
    booking.arrival_time
  );

  const isVipBooking = booking.isCombinedBooking || (booking.total_estimated && booking.total_estimated > 300);
  const hasSpecialRequests = specialRequests.length > 0;

  return (
    <div className={`booking-confirmation max-w-4xl mx-auto ${className}`}>
      {/* Success Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Booking Confirmed!
        </h1>
        
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Your table at The Backroom Leeds has been successfully reserved. 
          We can't wait to welcome you for an unforgettable evening.
        </p>
        
        {isVipBooking && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-full px-4 py-2 mt-4"
          >
            <Sparkles className="w-5 h-5 text-amber-600" />
            <span className="font-medium text-amber-800">VIP Experience Confirmed</span>
          </motion.div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Booking Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Booking Reference */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Booking Reference</h2>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Confirmed
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex-1 bg-gray-50 rounded-lg p-4">
                <div className="font-mono text-2xl font-bold text-gray-900 tracking-wider">
                  {booking.booking_reference}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Keep this reference number safe - you'll need it for check-in
                </p>
              </div>
              
              <div className="flex flex-col space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyBookingReference}
                  className={`transition-all ${copySuccess ? 'bg-green-50 border-green-200 text-green-700' : ''}`}
                >
                  {copySuccess ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copySuccess ? 'Copied!' : 'Copy'}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={shareBooking}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Booking Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{formattedDate}</div>
                    <div className="text-sm text-gray-600">Event Date</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{formattedTime}</div>
                    <div className="text-sm text-gray-600">Arrival Time</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{booking.party_size} Guests</div>
                    <div className="text-sm text-gray-600">Party Size</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {booking.isCombinedBooking ? 'Combined Tables' : 'Premium Table'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {booking.isCombinedBooking ? 'Enhanced seating arrangement' : 'Individual table'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">£{booking.deposit_amount}</div>
                    <div className="text-sm text-gray-600">Deposit Paid</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Special Features */}
            {(isVipBooking || hasSpecialRequests) && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-medium text-gray-900 mb-3">Special Features</h3>
                <div className="flex flex-wrap gap-2">
                  {isVipBooking && (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                      <Star className="w-3 h-3 mr-1" />
                      VIP Experience
                    </Badge>
                  )}
                  
                  {booking.isCombinedBooking && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Table Combination
                    </Badge>
                  )}
                  
                  {hasSpecialRequests && (
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                      <Gift className="w-3 h-3 mr-1" />
                      Special Requests ({specialRequests.length})
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Special Requests */}
          {hasSpecialRequests && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Special Requests</h2>
              
              <div className="space-y-3">
                {specialRequests.map((request, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Gift className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{request.title}</div>
                      {request.description && (
                        <p className="text-sm text-gray-600 mt-1">{request.description}</p>
                      )}
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${
                            request.status === 'completed' ? 'bg-green-100 text-green-800' :
                            request.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            request.status === 'acknowledged' ? 'bg-amber-100 text-amber-800' :
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {request.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        
                        <Badge variant="secondary" className="text-xs">
                          Priority: {request.priority}/10
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-800">
                      Our team will review and confirm your special requests before your arrival. 
                      You'll receive updates via email if any additional information is needed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Confirmation Steps */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Confirmation Progress</h2>
            
            <div className="space-y-4">
              {confirmationSteps.map((step, index) => (
                <div key={step.id} className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    {step.status === 'completed' ? (
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                    ) : step.status === 'pending' ? (
                      <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
                        <LoadingSpinner size="sm" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{step.title}</div>
                    <p className="text-sm text-gray-600">{step.description}</p>
                    {step.timestamp && (
                      <p className="text-xs text-gray-500 mt-1">
                        {step.timestamp.toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* QR Code & Actions */}
        <div className="space-y-6">
          {/* QR Code */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Digital Check-in</h3>
            
            <div className="bg-white p-4 rounded-lg border inline-block mb-4">
              <QRCodeSVG
                value={JSON.stringify(qrCodeData)}
                size={160}
                level="M"
                includeMargin={true}
              />
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Show this QR code at the door for quick check-in
            </p>
            
            <div className="space-y-2">
              <div className="text-xs text-gray-500">Check-in Code</div>
              <div className="font-mono text-lg font-bold text-gray-900">
                {qrCodeData.checkInCode}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h3>
            
            <div className="space-y-3">
              <a
                href="mailto:bookings@thebackroomleeds.com"
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Mail className="w-5 h-5 text-gray-500" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Email Us</div>
                  <div className="text-xs text-gray-500">bookings@thebackroomleeds.com</div>
                </div>
              </a>
              
              <a
                href="tel:+441132345678"
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Phone className="w-5 h-5 text-gray-500" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Call Us</div>
                  <div className="text-xs text-gray-500">+44 113 234 5678</div>
                </div>
              </a>
              
              <a
                href="https://wa.me/441132345678"
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Smartphone className="w-5 h-5 text-gray-500" />
                <div>
                  <div className="text-sm font-medium text-gray-900">WhatsApp</div>
                  <div className="text-xs text-gray-500">Quick support</div>
                </div>
              </a>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={onAddToCalendar}
              className="w-full"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Add to Calendar
            </Button>
            
            <Button
              variant="outline"
              onClick={onDownloadConfirmation}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Confirmation
            </Button>
            
            <Button
              variant="outline"
              onClick={() => window.open('/events', '_blank')}
              className="w-full"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Events
            </Button>
          </div>

          {/* Important Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-amber-900 mb-1">Important</h4>
                <p className="text-xs text-amber-800">
                  Please arrive within 15 minutes of your scheduled time. 
                  Tables may be released if you're more than 15 minutes late without notice.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}