'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { 
  Clock, 
  Users, 
  Calendar, 
  Bell, 
  Mail, 
  Phone, 
  Smartphone,
  CheckCircle,
  AlertCircle,
  Star,
  TrendingUp,
  Zap
} from 'lucide-react';

import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { FormField } from '@/components/molecules/FormField';
import { LoadingSpinner } from '@/components/atoms/LoadingSpinner';
import { WaitlistEntry, BookingSource } from '@/types/advanced-booking.types';

// Zod schema for waitlist signup
const waitlistSchema = z.object({
  customerEmail: z.string().email('Please enter a valid email address'),
  customerName: z.string().min(1, 'Name is required'),
  customerPhone: z.string().min(10, 'Please enter a valid phone number'),
  bookingDate: z.string().min(1, 'Please select a date'),
  preferredArrivalTime: z.string().min(1, 'Please select a preferred time'),
  alternativeArrivalTimes: z.array(z.string()).default([]),
  partySize: z.number().min(1, 'Party size must be at least 1').max(20, 'Maximum party size is 20'),
  flexiblePartySize: z.boolean().default(false),
  minPartySize: z.number().optional(),
  maxPartySize: z.number().optional(),
  tablePreferences: z.array(z.number()).default([]),
  floorPreference: z.enum(['upstairs', 'downstairs']).optional(),
  acceptsAnyTable: z.boolean().default(true),
  acceptsCombination: z.boolean().default(true),
  notificationMethods: z.array(z.enum(['email', 'sms', 'phone'])).min(1, 'Select at least one notification method'),
  notificationLeadTime: z.number().min(30).max(720).default(120), // 30 minutes to 12 hours
  maxNotifications: z.number().min(1).max(5).default(3),
  specialOccasion: z.string().optional(),
  notes: z.string().optional()
});

type WaitlistFormData = z.infer<typeof waitlistSchema>;

interface WaitlistSignupProps {
  bookingDate: string;
  unavailableTime: string;
  partySize: number;
  onSignupComplete: (waitlistEntry: WaitlistEntry) => void;
  onCancel: () => void;
  className?: string;
}

const TIME_SLOTS = [
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', 
  '21:00', '21:30', '22:00', '22:30', '23:00', '23:30'
];

const NOTIFICATION_LEAD_TIMES = [
  { value: 30, label: '30 minutes' },
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
  { value: 240, label: '4 hours' },
  { value: 480, label: '8 hours' },
  { value: 720, label: '12 hours' }
];

const SPECIAL_OCCASIONS = [
  'Birthday', 'Anniversary', 'Hen Party', 'Stag Party', 
  'Corporate Event', 'Date Night', 'Reunion', 'Other'
];

export function WaitlistSignup({
  bookingDate,
  unavailableTime,
  partySize,
  onSignupComplete,
  onCancel,
  className = ''
}: WaitlistSignupProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [estimatedPosition, setEstimatedPosition] = useState<number | null>(null);
  const [estimatedWaitTime, setEstimatedWaitTime] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<WaitlistFormData>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: {
      bookingDate,
      preferredArrivalTime: unavailableTime,
      partySize,
      alternativeArrivalTimes: [],
      flexiblePartySize: false,
      acceptsAnyTable: true,
      acceptsCombination: true,
      notificationMethods: ['email'],
      notificationLeadTime: 120,
      maxNotifications: 3
    },
    mode: 'onChange'
  });

  const watchedValues = watch();

  // Calculate estimated position and wait time
  React.useEffect(() => {
    // Mock calculation - would be real API call
    const calculatePosition = () => {
      const basePosition = Math.floor(Math.random() * 8) + 1;
      const timeMultiplier = watchedValues.alternativeArrivalTimes.length > 0 ? 0.7 : 1;
      const flexibilityMultiplier = watchedValues.flexiblePartySize ? 0.8 : 1;
      const combinationMultiplier = watchedValues.acceptsCombination ? 0.9 : 1;
      
      const adjustedPosition = Math.max(1, Math.floor(
        basePosition * timeMultiplier * flexibilityMultiplier * combinationMultiplier
      ));
      
      setEstimatedPosition(adjustedPosition);
      
      // Estimate wait time based on position
      const hoursPerPosition = 0.5;
      const totalHours = adjustedPosition * hoursPerPosition;
      
      if (totalHours < 1) {
        setEstimatedWaitTime('30-60 minutes');
      } else if (totalHours < 2) {
        setEstimatedWaitTime('1-2 hours');
      } else if (totalHours < 4) {
        setEstimatedWaitTime('2-4 hours');
      } else {
        setEstimatedWaitTime('Later this evening');
      }
    };

    calculatePosition();
  }, [watchedValues.alternativeArrivalTimes.length, watchedValues.flexiblePartySize, watchedValues.acceptsCombination]);

  const handleAlternativeTimeToggle = (time: string) => {
    const currentTimes = watchedValues.alternativeArrivalTimes || [];
    const isSelected = currentTimes.includes(time);
    
    if (isSelected) {
      setValue('alternativeArrivalTimes', currentTimes.filter(t => t !== time));
    } else {
      setValue('alternativeArrivalTimes', [...currentTimes, time]);
    }
  };

  const handleTablePreferenceToggle = (tableNumber: number) => {
    const currentPrefs = watchedValues.tablePreferences || [];
    const isSelected = currentPrefs.includes(tableNumber);
    
    if (isSelected) {
      setValue('tablePreferences', currentPrefs.filter(t => t !== tableNumber));
    } else {
      setValue('tablePreferences', [...currentPrefs, tableNumber]);
    }
  };

  const onSubmit = async (data: WaitlistFormData) => {
    setIsSubmitting(true);
    
    try {
      // Mock API call - would be real implementation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const waitlistEntry: WaitlistEntry = {
        id: `waitlist-${Date.now()}`,
        ...data,
        bookingDate: new Date(data.bookingDate),
        status: 'active' as const,
        priorityScore: 500, // Base priority score
        positionInQueue: estimatedPosition || 1,
        notificationsSent: 0,
        source: BookingSource.WEBSITE,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      onSignupComplete(waitlistEntry);
    } catch (error) {
      console.error('Waitlist signup failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const priorityBoosts = [
    {
      condition: watchedValues.alternativeArrivalTimes.length > 2,
      label: 'Flexible timing',
      boost: '+30 priority points'
    },
    {
      condition: watchedValues.flexiblePartySize,
      label: 'Flexible party size',
      boost: '+20 priority points'
    },
    {
      condition: watchedValues.acceptsCombination,
      label: 'Accepts table combination',
      boost: '+25 priority points'
    },
    {
      condition: watchedValues.acceptsAnyTable,
      label: 'Any table preference',
      boost: '+15 priority points'
    }
  ].filter(boost => boost.condition);

  return (
    <div className={`waitlist-signup max-w-2xl mx-auto ${className}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
          <Clock className="w-8 h-8 text-amber-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Join the Waitlist</h2>
        <p className="text-gray-600">
          Your preferred time isn't available, but we'll notify you as soon as a table opens up.
        </p>
        
        {/* Current Unavailable Details */}
        <div className="inline-flex items-center space-x-4 bg-gray-100 rounded-lg px-4 py-2 mt-4">
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700">{bookingDate}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700">{unavailableTime}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700">{partySize} guests</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Contact Information */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
          
          <div className="space-y-4">
            <FormField
              name="customerName"
              control={control}
              label="Full Name"
              placeholder="Enter your full name"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                name="customerEmail"
                control={control}
                label="Email Address"
                type="email"
                placeholder="your@email.com"
              />
              
              <FormField
                name="customerPhone"
                control={control}
                label="Phone Number"
                type="tel"
                placeholder="+44 7123 456789"
              />
            </div>
          </div>
        </div>

        {/* Booking Preferences */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Preferences</h3>
          
          <div className="space-y-6">
            {/* Primary booking details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                name="bookingDate"
                control={control}
                label="Date"
                type="date"
                disabled
              />
              
              <FormField
                name="preferredArrivalTime"
                control={control}
                label="Preferred Time"
                type="select"
                options={TIME_SLOTS.map(time => ({ value: time, label: time }))}
              />
              
              <FormField
                name="partySize"
                control={control}
                label="Party Size"
                type="number"
                min={1}
                max={20}
              />
            </div>

            {/* Flexibility Options */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="flexiblePartySize"
                  checked={watchedValues.flexiblePartySize}
                  onChange={(e) => setValue('flexiblePartySize', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="flexiblePartySize" className="text-sm text-gray-700">
                  I'm flexible with party size (±2 people)
                </label>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Better chance
                </Badge>
              </div>

              {watchedValues.flexiblePartySize && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="grid grid-cols-2 gap-4 pl-6"
                >
                  <FormField
                    name="minPartySize"
                    control={control}
                    label="Minimum Size"
                    type="number"
                    min={1}
                    max={watchedValues.partySize}
                  />
                  
                  <FormField
                    name="maxPartySize"
                    control={control}
                    label="Maximum Size"
                    type="number"
                    min={watchedValues.partySize}
                    max={20}
                  />
                </motion.div>
              )}
            </div>

            {/* Alternative Times */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Alternative Arrival Times
                <Badge variant="secondary" className="bg-green-100 text-green-800 ml-2">
                  <Zap className="w-3 h-3 mr-1" />
                  Higher priority
                </Badge>
              </label>
              
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {TIME_SLOTS.filter(time => time !== watchedValues.preferredArrivalTime).map(time => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => handleAlternativeTimeToggle(time)}
                    className={`
                      p-2 text-sm rounded-lg border transition-all
                      ${watchedValues.alternativeArrivalTimes?.includes(time)
                        ? 'bg-amber-100 border-amber-300 text-amber-800'
                        : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-amber-200'
                      }
                    `}
                  >
                    {time}
                  </button>
                ))}
              </div>
              
              <p className="text-xs text-gray-500 mt-2">
                Select additional times you'd accept ({watchedValues.alternativeArrivalTimes?.length || 0} selected)
              </p>
            </div>

            {/* Table Preferences */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Floor Preference</label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="floorPreference"
                      value="upstairs"
                      checked={watchedValues.floorPreference === 'upstairs'}
                      onChange={(e) => setValue('floorPreference', e.target.value as 'upstairs')}
                      className="text-amber-600"
                    />
                    <span className="text-sm">Upstairs</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="floorPreference"
                      value="downstairs"
                      checked={watchedValues.floorPreference === 'downstairs'}
                      onChange={(e) => setValue('floorPreference', e.target.value as 'downstairs')}
                      className="text-amber-600"
                    />
                    <span className="text-sm">Downstairs</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="floorPreference"
                      checked={!watchedValues.floorPreference}
                      onChange={() => setValue('floorPreference', undefined)}
                      className="text-amber-600"
                    />
                    <span className="text-sm">No preference</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <Star className="w-3 h-3 mr-1" />
                      Flexible
                    </Badge>
                  </label>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="acceptsCombination"
                  checked={watchedValues.acceptsCombination}
                  onChange={(e) => setValue('acceptsCombination', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="acceptsCombination" className="text-sm text-gray-700">
                  Accept table combinations for larger parties
                </label>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  More options
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                How should we notify you?
              </label>
              
              <div className="space-y-2">
                {[
                  { value: 'email', label: 'Email', icon: Mail },
                  { value: 'sms', label: 'SMS Text', icon: Smartphone },
                  { value: 'phone', label: 'Phone Call', icon: Phone }
                ].map(({ value, label, icon: Icon }) => (
                  <label key={value} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={watchedValues.notificationMethods?.includes(value as any) || false}
                      onChange={(e) => {
                        const current = watchedValues.notificationMethods || [];
                        if (e.target.checked) {
                          setValue('notificationMethods', [...current, value as any]);
                        } else {
                          setValue('notificationMethods', current.filter(m => m !== value));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <Icon className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                name="notificationLeadTime"
                control={control}
                label="How much notice do you need?"
                type="select"
                options={NOTIFICATION_LEAD_TIMES}
              />
              
              <FormField
                name="maxNotifications"
                control={control}
                label="Maximum notifications"
                type="number"
                min={1}
                max={5}
              />
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
          
          <div className="space-y-4">
            <FormField
              name="specialOccasion"
              control={control}
              label="Special Occasion (Optional)"
              type="select"
              options={[
                { value: '', label: 'No special occasion' },
                ...SPECIAL_OCCASIONS.map(occasion => ({ value: occasion, label: occasion }))
              ]}
            />
            
            <FormField
              name="notes"
              control={control}
              label="Additional Notes (Optional)"
              type="textarea"
              placeholder="Any special requirements or preferences..."
              rows={3}
            />
          </div>
        </div>

        {/* Priority Boosts */}
        {priorityBoosts.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-4">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <h4 className="font-medium text-green-900">Priority Boosts Active</h4>
            </div>
            
            <div className="space-y-2">
              {priorityBoosts.map((boost, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-green-800">{boost.label}</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {boost.boost}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Estimated Position */}
        {estimatedPosition && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-amber-900 mb-1">Estimated Position</h4>
                <p className="text-amber-800 text-sm">
                  You'll likely be #{estimatedPosition} in the queue
                </p>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold text-amber-900">#{estimatedPosition}</div>
                <div className="text-sm text-amber-700">{estimatedWaitTime}</div>
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          
          <Button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Joining Waitlist...
              </>
            ) : (
              <>
                <Bell className="w-4 h-4 mr-2" />
                Join Waitlist
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}