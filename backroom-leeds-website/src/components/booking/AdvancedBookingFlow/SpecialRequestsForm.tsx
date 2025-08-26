'use client';

import React, { useState, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { 
  Plus, 
  X, 
  Gift, 
  Utensils, 
  Wheelchair, 
  Camera, 
  Music, 
  Sparkles,
  Calendar,
  Heart,
  Briefcase,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { FormField } from '@/components/molecules/FormField';
import { SpecialRequestType, SpecialRequest } from '@/types/advanced-booking.types';

// Zod schema for special requests
const specialRequestSchema = z.object({
  requests: z.array(z.object({
    type: z.nativeEnum(SpecialRequestType),
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    priority: z.number().min(1).max(10).default(5),
    dietaryDetails: z.object({
      restrictions: z.array(z.string()).default([]),
      allergies: z.array(z.string()).default([]),
      preferences: z.array(z.string()).default([]),
      numberOfPeople: z.number().min(1).default(1),
      severity: z.enum(['mild', 'moderate', 'severe']).default('moderate'),
      notes: z.string().optional()
    }).optional(),
    accessibilityDetails: z.object({
      requiresWheelchairAccess: z.boolean().default(false),
      requiresElevator: z.boolean().default(false),
      requiresAccessibleRestroom: z.boolean().default(false),
      requiresAssistance: z.boolean().default(false),
      mobilityAids: z.array(z.string()).default([]),
      notes: z.string().optional()
    }).optional(),
    celebrationDetails: z.object({
      occasionType: z.string(),
      celebrantName: z.string(),
      ageOrYears: z.number().optional(),
      requiresCake: z.boolean().default(false),
      cakeDetails: z.string().optional(),
      decorationPreferences: z.string().optional(),
      musicRequests: z.array(z.string()).default([]),
      photographyAllowed: z.boolean().default(true),
      surpriseElement: z.boolean().default(false),
      notes: z.string().optional()
    }).optional(),
    customerNotes: z.string().optional(),
    estimatedCost: z.number().min(0).optional()
  })).default([])
});

type SpecialRequestFormData = z.infer<typeof specialRequestSchema>;

interface SpecialRequestsFormProps {
  onSubmit: (data: SpecialRequestFormData) => void;
  initialData?: Partial<SpecialRequestFormData>;
  className?: string;
}

// Request type configurations
const REQUEST_TYPES = {
  [SpecialRequestType.BIRTHDAY]: {
    icon: Gift,
    label: 'Birthday Celebration',
    description: 'Make their special day unforgettable',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    templates: [
      'Birthday cake and candles',
      'Special birthday decorations',
      'Personalized birthday playlist',
      'Birthday photographer'
    ]
  },
  [SpecialRequestType.ANNIVERSARY]: {
    icon: Heart,
    label: 'Anniversary',
    description: 'Celebrate your special milestone',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    templates: [
      'Romantic table setting',
      'Anniversary cake',
      'Couples photography',
      'Special anniversary playlist'
    ]
  },
  [SpecialRequestType.DIETARY_RESTRICTION]: {
    icon: Utensils,
    label: 'Dietary Requirements',
    description: 'Ensure your dietary needs are met',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    templates: [
      'Vegetarian options',
      'Vegan requirements',
      'Gluten-free needs',
      'Nut allergy accommodation'
    ]
  },
  [SpecialRequestType.ACCESSIBILITY_NEED]: {
    icon: Wheelchair,
    label: 'Accessibility',
    description: 'Accessibility accommodations',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    templates: [
      'Wheelchair accessible seating',
      'Hearing assistance',
      'Visual aid support',
      'Mobility assistance'
    ]
  },
  [SpecialRequestType.VIP_SERVICE]: {
    icon: Sparkles,
    label: 'VIP Service',
    description: 'Premium VIP experience',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    templates: [
      'Dedicated VIP host',
      'Premium bottle service',
      'VIP area access',
      'Concierge service'
    ]
  },
  [SpecialRequestType.PHOTOGRAPHER_REQUEST]: {
    icon: Camera,
    label: 'Photography',
    description: 'Professional photography services',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    templates: [
      'Event photographer',
      'Group photos',
      'Candid photography',
      'Social media content'
    ]
  },
  [SpecialRequestType.CORPORATE_EVENT]: {
    icon: Briefcase,
    label: 'Corporate Event',
    description: 'Business celebration needs',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    templates: [
      'Corporate catering',
      'Business presentation setup',
      'Networking area',
      'Corporate branding'
    ]
  },
  [SpecialRequestType.OTHER]: {
    icon: Plus,
    label: 'Other Request',
    description: 'Custom special request',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    templates: []
  }
};

export function SpecialRequestsForm({ 
  onSubmit, 
  initialData,
  className = '' 
}: SpecialRequestsFormProps) {
  const [showRequestTypes, setShowRequestTypes] = useState(false);
  
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid }
  } = useForm<SpecialRequestFormData>({
    resolver: zodResolver(specialRequestSchema),
    defaultValues: initialData || { requests: [] },
    mode: 'onChange'
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'requests'
  });

  const watchedRequests = watch('requests');

  // Calculate estimated cost
  const estimatedTotalCost = useMemo(() => {
    return watchedRequests.reduce((total, request) => {
      return total + (request.estimatedCost || 0);
    }, 0);
  }, [watchedRequests]);

  const addRequest = (type: SpecialRequestType) => {
    const config = REQUEST_TYPES[type];
    
    append({
      type,
      title: config.label,
      description: config.description,
      priority: 5,
      customerNotes: '',
      estimatedCost: 0
    });
    
    setShowRequestTypes(false);
  };

  const addTemplateRequest = (type: SpecialRequestType, template: string) => {
    const config = REQUEST_TYPES[type];
    
    append({
      type,
      title: template,
      description: `${config.label}: ${template}`,
      priority: 5,
      customerNotes: '',
      estimatedCost: 0
    });
  };

  return (
    <div className={`special-requests-form space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Special Requests</h3>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Let us make your evening extraordinary. Add any special requests or requirements 
          to ensure your perfect night out.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Current Requests */}
        <AnimatePresence>
          {fields.map((field, index) => {
            const requestType = watchedRequests[index]?.type;
            const config = requestType ? REQUEST_TYPES[requestType] : REQUEST_TYPES[SpecialRequestType.OTHER];
            const IconComponent = config.icon;

            return (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`border-2 rounded-xl p-6 ${config.bgColor} ${config.borderColor}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full bg-white ${config.color}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900">{config.label}</h4>
                      <Badge variant="secondary" className="mt-1">
                        Priority: {watchedRequests[index]?.priority || 5}/10
                      </Badge>
                    </div>
                  </div>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <FormField
                    name={`requests.${index}.title`}
                    control={control}
                    label="Request Title"
                    placeholder="Brief description of your request"
                    className="bg-white"
                  />

                  <FormField
                    name={`requests.${index}.description`}
                    control={control}
                    label="Detailed Description"
                    type="textarea"
                    placeholder="Provide more details about your special request..."
                    className="bg-white"
                    rows={3}
                  />

                  {/* Specific request type fields */}
                  {requestType === SpecialRequestType.DIETARY_RESTRICTION && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-3 bg-white rounded-lg p-4"
                    >
                      <h5 className="font-medium text-gray-900">Dietary Details</h5>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          name={`requests.${index}.dietaryDetails.numberOfPeople`}
                          control={control}
                          label="Number of People"
                          type="number"
                          min={1}
                        />
                        
                        <FormField
                          name={`requests.${index}.dietaryDetails.severity`}
                          control={control}
                          label="Severity Level"
                          type="select"
                          options={[
                            { value: 'mild', label: 'Mild Preference' },
                            { value: 'moderate', label: 'Important Requirement' },
                            { value: 'severe', label: 'Critical/Allergy' }
                          ]}
                        />
                      </div>
                      
                      <FormField
                        name={`requests.${index}.dietaryDetails.notes`}
                        control={control}
                        label="Additional Notes"
                        type="textarea"
                        placeholder="Any other dietary information..."
                        rows={2}
                      />
                    </motion.div>
                  )}

                  {requestType === SpecialRequestType.BIRTHDAY && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-3 bg-white rounded-lg p-4"
                    >
                      <h5 className="font-medium text-gray-900">Birthday Details</h5>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          name={`requests.${index}.celebrationDetails.celebrantName`}
                          control={control}
                          label="Birthday Person's Name"
                          placeholder="e.g. Sarah"
                        />
                        
                        <FormField
                          name={`requests.${index}.celebrationDetails.ageOrYears`}
                          control={control}
                          label="Age (Optional)"
                          type="number"
                          min={18}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm text-gray-700">Birthday cake required</span>
                        </label>
                        
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm text-gray-700">Photography allowed</span>
                        </label>
                        
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm text-gray-700">Surprise element</span>
                        </label>
                      </div>
                    </motion.div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center space-x-4">
                      <FormField
                        name={`requests.${index}.priority`}
                        control={control}
                        label="Priority"
                        type="range"
                        min={1}
                        max={10}
                        className="w-24"
                      />
                      
                      <span className="text-sm text-gray-600">
                        {watchedRequests[index]?.priority === 10 ? 'Critical' :
                         watchedRequests[index]?.priority >= 7 ? 'High' :
                         watchedRequests[index]?.priority >= 4 ? 'Medium' : 'Low'}
                      </span>
                    </div>
                    
                    <FormField
                      name={`requests.${index}.estimatedCost`}
                      control={control}
                      label="Est. Cost (£)"
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder="0.00"
                      className="w-24"
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Add Request Button */}
        {!showRequestTypes ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowRequestTypes(true)}
            className="w-full border-dashed border-2 border-gray-300 hover:border-amber-300 py-6"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Special Request
          </Button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border-2 border-gray-200 rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900">Choose Request Type</h4>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowRequestTypes(false)}
                className="text-gray-400"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(REQUEST_TYPES).map(([type, config]) => (
                <motion.button
                  key={type}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => addRequest(type as SpecialRequestType)}
                  className={`
                    p-4 rounded-lg border-2 text-left transition-all
                    hover:shadow-md ${config.bgColor} ${config.borderColor}
                  `}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <config.icon className={`w-5 h-5 ${config.color}`} />
                    <span className="font-medium text-gray-900">{config.label}</span>
                  </div>
                  <p className="text-sm text-gray-600">{config.description}</p>
                  
                  {/* Template suggestions */}
                  {config.templates.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {config.templates.slice(0, 2).map((template, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            addTemplateRequest(type as SpecialRequestType, template);
                          }}
                          className="block w-full text-left text-xs text-amber-600 hover:text-amber-700 bg-amber-50 rounded px-2 py-1 transition-colors"
                        >
                          + {template}
                        </button>
                      ))}
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Summary */}
        {fields.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-50 border border-gray-200 rounded-lg p-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h4 className="font-medium text-gray-900">Request Summary</h4>
              </div>
              
              <Badge variant="secondary">
                {fields.length} Request{fields.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            
            <div className="mt-4 space-y-2">
              {fields.map((_, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">
                    {watchedRequests[index]?.title || 'Untitled Request'}
                  </span>
                  <span className="text-gray-500">
                    Priority: {watchedRequests[index]?.priority || 5}/10
                  </span>
                </div>
              ))}
            </div>
            
            {estimatedTotalCost > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">Estimated Total Cost:</span>
                  <span className="font-semibold text-gray-900">£{estimatedTotalCost.toFixed(2)}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Final costs will be confirmed by our team
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Form Actions */}
        {fields.length > 0 && (
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => fields.forEach((_, index) => remove(index))}
            >
              Clear All
            </Button>
            
            <Button
              type="submit"
              disabled={!isValid}
              className="px-8"
            >
              Save Requests
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}