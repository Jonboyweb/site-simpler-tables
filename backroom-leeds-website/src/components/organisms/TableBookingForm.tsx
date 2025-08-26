'use client';

import { useState, FormEvent } from 'react';
import { Card } from '@/components/molecules';
import { FormField, Select } from '@/components/molecules';
import { Button, Heading, Text, Badge } from '@/components/atoms';
import type { TableBookingFormProps, BookingFormData } from '@/types/components';

const timeSlots = [
  { value: '23:00', label: '11:00 PM' },
  { value: '23:30', label: '11:30 PM' },
  { value: '00:00', label: '12:00 AM' },
  { value: '00:30', label: '12:30 AM' },
  { value: '01:00', label: '1:00 AM' },
];

const partySizes = [
  { value: '2', label: '2 Guests' },
  { value: '3', label: '3 Guests' },
  { value: '4', label: '4 Guests' },
  { value: '5', label: '5 Guests' },
  { value: '6', label: '6 Guests' },
  { value: '7', label: '7 Guests' },
  { value: '8', label: '8 Guests' },
];

const drinkPackages = [
  { value: 'bronze', label: 'Bronze Package - £170' },
  { value: 'silver', label: 'Silver Package - £280' },
  { value: 'gold', label: 'Gold Package - £380' },
  { value: 'platinum', label: 'Platinum Package - £580' },
];

export const TableBookingForm = ({
  availableTables = [],
  onSubmit,
  step = 1,
  eventId,
  loading = false,
}: TableBookingFormProps) => {
  const [formData, setFormData] = useState<BookingFormData>({
    date: '',
    time: '',
    partySize: 2,
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    specialRequests: '',
    drinkPackage: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof BookingFormData, string>>>({});

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    const newErrors: Partial<Record<keyof BookingFormData, string>> = {};
    
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.time) newErrors.time = 'Time is required';
    if (!formData.customerName) newErrors.customerName = 'Name is required';
    if (!formData.customerEmail) newErrors.customerEmail = 'Email is required';
    if (!formData.customerPhone) newErrors.customerPhone = 'Phone is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onSubmit?.(formData);
  };

  const updateField = (field: keyof BookingFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  return (
    <Card variant="bordered" padding="lg" className="max-w-2xl mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          {eventId && (
            <div className="mb-4">
              <Badge variant="default" className="bg-speakeasy-burgundy/30 text-speakeasy-gold border border-speakeasy-gold/20">
                Event Booking: {eventId.toUpperCase()}
              </Badge>
            </div>
          )}
          <Heading level={2} variant="bebas">
            {eventId ? 'Book for Event' : 'Book Your Table'}
          </Heading>
          <Text variant="body" className="text-speakeasy-champagne/80">
            {eventId 
              ? 'Reserve your table for this exclusive event at Leeds\' most exclusive speakeasy'
              : 'Reserve your spot at Leeds\' most exclusive speakeasy'
            }
          </Text>
          {step > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              {[1, 2, 3].map((i) => (
                <Badge
                  key={i}
                  variant={i <= step ? 'default' : 'default'}
                  className={i <= step ? 'opacity-100' : 'opacity-40'}
                >
                  Step {i}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date & Time Selection */}
          <div className="grid md:grid-cols-2 gap-4">
            <FormField
              name="date"
              label="Date"
              type="date"
              required
              value={formData.date}
              onChange={(value) => updateField('date', value)}
              error={errors.date}
              artDeco
            />
            <Select
              label="Time"
              name="time"
              required
              value={formData.time}
              onChange={(e) => updateField('time', e.target.value)}
              options={timeSlots}
              error={errors.time}
              artDeco
            />
          </div>

          {/* Party Size */}
          <Select
            label="Party Size"
            name="partySize"
            required
            value={String(formData.partySize)}
            onChange={(e) => updateField('partySize', parseInt(e.target.value))}
            options={partySizes}
            artDeco
          />

          {/* Available Tables */}
          {availableTables.length > 0 && (
            <div className="space-y-2">
              <Text variant="caption" className="text-speakeasy-gold">
                Available Tables:
              </Text>
              <div className="grid grid-cols-4 gap-2">
                {availableTables.map((table) => (
                  <button
                    key={table}
                    type="button"
                    onClick={() => updateField('tableNumber', table)}
                    className={`p-3 rounded-sm border transition-all ${
                      formData.tableNumber === table
                        ? 'bg-speakeasy-gold text-speakeasy-noir border-speakeasy-gold'
                        : 'border-speakeasy-gold/30 hover:border-speakeasy-gold hover:bg-speakeasy-gold/10'
                    }`}
                  >
                    <Text variant="caption" champagne={formData.tableNumber !== table}>
                      Table {table}
                    </Text>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Customer Information */}
          <div className="space-y-4">
            <Heading level={5} variant="playfair">
              Your Information
            </Heading>
            <FormField
              name="customerName"
              label="Full Name"
              type="text"
              required
              value={formData.customerName}
              onChange={(value) => updateField('customerName', value)}
              error={errors.customerName}
              artDeco
            />
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                name="customerEmail"
                label="Email Address"
                type="email"
                required
                value={formData.customerEmail}
                onChange={(value) => updateField('customerEmail', value)}
                error={errors.customerEmail}
                artDeco
              />
              <FormField
                name="customerPhone"
                label="Phone Number"
                type="tel"
                required
                value={formData.customerPhone}
                onChange={(value) => updateField('customerPhone', value)}
                error={errors.customerPhone}
                artDeco
              />
            </div>
          </div>

          {/* Drinks Package */}
          <Select
            label="Drinks Package (Optional)"
            name="drinkPackage"
            value={formData.drinkPackage}
            onChange={(e) => updateField('drinkPackage', e.target.value)}
            options={drinkPackages}
            hint="Pre-order your drinks for a seamless experience"
            artDeco
          />

          {/* Special Requests */}
          <div>
            <label htmlFor="specialRequests" className="block text-sm font-playfair text-speakeasy-gold mb-1.5">
              Special Requests (Optional)
            </label>
            <textarea
              id="specialRequests"
              name="specialRequests"
              rows={3}
              value={formData.specialRequests}
              onChange={(e) => updateField('specialRequests', e.target.value)}
              className="w-full px-4 py-2.5 rounded-sm bg-speakeasy-noir/50 backdrop-blur-sm border border-speakeasy-gold/30 text-speakeasy-champagne placeholder-speakeasy-champagne/40 focus:outline-none focus:border-speakeasy-gold focus:ring-1 focus:ring-speakeasy-gold transition-all duration-200 art-deco-border"
              placeholder="Any dietary requirements, celebrations, or special requests..."
            />
          </div>

          {/* Terms & Conditions */}
          <Card variant="default" padding="sm" className="bg-speakeasy-burgundy/20">
            <Text variant="small">
              By booking, you agree to our terms and conditions. A £50 deposit per table is required
              to secure your reservation. Cancellations must be made at least 48 hours in advance.
            </Text>
          </Card>

          {/* Submit Button */}
          <Button 
            type="submit" 
            variant="gold" 
            size="lg" 
            fullWidth 
            artDeco
            loading={loading}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Complete Booking'}
          </Button>
        </form>
      </div>
    </Card>
  );
};