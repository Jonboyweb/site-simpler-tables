'use client';

import { useFormContext } from 'react-hook-form';
import { AccessibleFormField } from '@/components/molecules/AccessibleFormField';
import type { CustomerDetailsData } from '@/types/booking';

interface CustomerDetailsStepProps {
  className?: string;
}

export function CustomerDetailsStep({ className = '' }: CustomerDetailsStepProps) {
  const {
    register,
    formState: { errors },
    watch
  } = useFormContext<CustomerDetailsData>();

  const partySize = watch('partySize');

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Tell us about your group
        </h2>
        <p className="text-gray-600">
          We'll need these details to prepare for your visit
        </p>
      </div>

      <div className="grid gap-6">
        {/* Name */}
        <AccessibleFormField
          label="Full Name"
          required
          instructions="Enter the name for the booking"
          error={errors.name}
          placeholder="e.g., John Smith"
          {...register('name')}
        />

        {/* Email */}
        <AccessibleFormField
          label="Email Address"
          type="email"
          required
          instructions="We'll send your booking confirmation here"
          error={errors.email}
          placeholder="e.g., john@example.com"
          {...register('email')}
        />

        {/* Phone */}
        <AccessibleFormField
          label="Phone Number"
          type="tel"
          required
          instructions="UK number for booking updates (e.g., 07700 900123 or +44 7700 900123)"
          error={errors.phone}
          placeholder="e.g., 07700 900123"
          {...register('phone')}
        />

        {/* Party Size */}
        <AccessibleFormField
          label="Party Size"
          type="number"
          required
          instructions="Total number of people in your group (maximum 12)"
          error={errors.partySize}
          placeholder="e.g., 4"
          min={1}
          max={12}
          {...register('partySize', { 
            valueAsNumber: true,
            min: 1,
            max: 12
          })}
        />

        {/* Party size guidance */}
        {partySize && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">
              Great! We'll help you find the perfect table for {partySize} people.
            </h3>
            <ul className="text-sm text-blue-700 space-y-1">
              {partySize <= 4 && (
                <li>• Perfect for our cozy 2-4 person tables</li>
              )}
              {partySize > 4 && partySize <= 8 && (
                <li>• We have spacious tables that can accommodate your group</li>
              )}
              {partySize > 8 && (
                <li>• You can book up to 2 tables to accommodate your larger group</li>
              )}
              <li>• All tables include comfortable seating and table service</li>
            </ul>
          </div>
        )}

        {/* Special Requests */}
        <AccessibleFormField
          label="Special Requests"
          type="textarea"
          instructions="Any special requirements, celebrations, or dietary needs? (optional)"
          error={errors.specialRequests}
          placeholder="e.g., Birthday celebration, wheelchair access needed, etc."
          maxLength={500}
          {...register('specialRequests')}
        />
      </div>

      {/* Data Privacy Notice */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
        <h4 className="font-medium text-gray-900 mb-2">Your Privacy</h4>
        <p>
          We'll use your details to manage your booking and provide the best service. 
          We'll only contact you about your booking unless you opt-in to marketing. 
          Your data is stored securely and won't be shared with third parties without your consent.
        </p>
      </div>
    </div>
  );
}