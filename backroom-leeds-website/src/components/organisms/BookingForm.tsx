'use client';

import { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { FormProgress } from '@/components/molecules/FormProgress';
import { Button } from '@/components/atoms/Button';
import { CustomerDetailsStep } from './BookingForm/CustomerDetailsStep';
import { TableSelectionStep } from './BookingForm/TableSelectionStep';
import { PaymentStep } from './BookingForm/PaymentStep';

import {
  customerDetailsSchema,
  tableSelectionSchema,
  paymentSchema,
  FORM_STEPS,
  type BookingFormData,
  type CustomerDetailsData,
  type TableSelectionData,
  type PaymentData,
  type CreateBookingRequest,
  type BookingResponse
} from '@/types/booking';

interface BookingFormProps {
  eventDate: string;
  eventId?: string;
  eventInstanceId?: string;
  eventType?: 'LA_FIESTA' | 'SHHH' | 'NOSTALGIA';
  eventTitle?: string;
  className?: string;
}

// Get the appropriate schema for current step
const getSchemaForStep = (stepIndex: number) => {
  switch (stepIndex) {
    case 0:
      return customerDetailsSchema;
    case 1:
      return tableSelectionSchema;
    case 2:
      return paymentSchema;
    default:
      return customerDetailsSchema;
  }
};

// Screen reader announcements
const announceToScreenReader = (message: string) => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    if (document.body.contains(announcement)) {
      document.body.removeChild(announcement);
    }
  }, 1000);
};

export function BookingForm({ 
  eventDate, 
  eventId, 
  eventInstanceId,
  eventType,
  eventTitle,
  className = '' 
}: BookingFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<boolean[]>([false, false, false]);
  const [formData, setFormData] = useState<Partial<BookingFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const router = useRouter();

  // Create form instance with current step schema
  const methods = useForm({
    resolver: zodResolver(getSchemaForStep(currentStep)),
    defaultValues: formData,
    mode: 'onChange'
  });

  const { handleSubmit, formState: { isValid, errors }, reset, trigger } = methods;

  // Announce step changes for screen readers
  useEffect(() => {
    const currentStepInfo = FORM_STEPS[currentStep];
    const announcement = `Step ${currentStep + 1} of ${FORM_STEPS.length}: ${currentStepInfo.title}. ${currentStepInfo.description}`;
    announceToScreenReader(announcement);
  }, [currentStep]);

  // Reset form with current data when step changes
  useEffect(() => {
    reset(formData);
  }, [currentStep, formData, reset]);

  const validateCurrentStep = async () => {
    const result = await trigger();
    return result;
  };

  const onStepSubmit = async (stepData: any) => {
    const updatedFormData = { ...formData, ...stepData };
    setFormData(updatedFormData);

    // Mark current step as completed
    setCompletedSteps(prev => {
      const newCompleted = [...prev];
      newCompleted[currentStep] = true;
      return newCompleted;
    });

    if (currentStep < FORM_STEPS.length - 1) {
      // Move to next step
      setCurrentStep(prev => prev + 1);
      announceToScreenReader(`Moving to ${FORM_STEPS[currentStep + 1].title}`);
    } else {
      // Final submission
      await handleFinalSubmission(updatedFormData as BookingFormData);
    }
  };

  const handleFinalSubmission = async (completeFormData: BookingFormData) => {
    setIsSubmitting(true);
    
    try {
      const bookingRequest: CreateBookingRequest = {
        eventDate,
        eventInstanceId, // Include event instance ID for event-specific bookings
        customerDetails: {
          name: completeFormData.name,
          email: completeFormData.email,
          phone: completeFormData.phone,
          partySize: completeFormData.partySize,
          specialRequests: completeFormData.specialRequests
        },
        tableSelection: {
          tableIds: completeFormData.tableIds,
          arrivalTime: completeFormData.arrivalTime,
          drinksPackage: completeFormData.drinksPackage
        },
        payment: {
          termsAccepted: completeFormData.termsAccepted,
          marketingConsent: completeFormData.marketingConsent,
          privacyPolicyAccepted: completeFormData.privacyPolicyAccepted
        }
      };

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingRequest)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Booking submission failed');
      }

      const bookingResult: BookingResponse = await response.json();
      
      // Success - redirect to payment processing or confirmation
      if (bookingResult.paymentIntent?.clientSecret) {
        // Redirect to payment processing page
        router.push(`/book/payment?booking=${bookingResult.bookingRef}&client_secret=${bookingResult.paymentIntent.clientSecret}`);
      } else {
        // Direct to confirmation (shouldn't happen with deposit required)
        router.push(`/book/confirmation/${bookingResult.bookingRef}`);
      }

      toast.success('Booking created successfully! Redirecting to payment...');

    } catch (error: any) {
      console.error('Booking submission failed:', error);
      toast.error(error.message || 'Booking failed. Please try again.');
      announceToScreenReader(`Error: ${error.message || 'Booking failed'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      announceToScreenReader(`Returning to ${FORM_STEPS[newStep].title}`);
    }
  };

  const goToStep = (stepIndex: number) => {
    // Can only go to previous steps or completed steps
    if (stepIndex < currentStep || completedSteps[stepIndex]) {
      setCurrentStep(stepIndex);
      announceToScreenReader(`Navigating to ${FORM_STEPS[stepIndex].title}`);
    }
  };

  // Error handling for form errors
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      const errorMessage = firstError?.message || 'Please fix the errors in the form';
      announceToScreenReader(`Form error: ${errorMessage}`);
    }
  }, [errors]);

  const renderCurrentStep = () => {
    const stepProps = {
      eventDate,
      eventId,
      eventInstanceId,
      eventType,
      eventTitle,
      className: 'max-w-4xl mx-auto'
    };

    switch (currentStep) {
      case 0:
        return <CustomerDetailsStep {...stepProps} />;
      case 1:
        return <TableSelectionStep {...stepProps} />;
      case 2:
        return (
          <PaymentStep
            {...stepProps}
            onSubmit={onStepSubmit}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return <CustomerDetailsStep {...stepProps} />;
    }
  };

  const canProceed = isValid && !isSubmitting;
  const isLastStep = currentStep === FORM_STEPS.length - 1;

  return (
    <div className={`booking-form space-y-8 ${className}`}>
      {/* Hidden heading for screen readers */}
      <h1 className="sr-only">Table Booking Form - {FORM_STEPS[currentStep].title}</h1>
      
      {/* Progress indicator */}
      <FormProgress
        steps={FORM_STEPS}
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={goToStep}
        className="max-w-2xl mx-auto"
      />

      {/* Form content */}
      <FormProvider {...methods}>
        <form 
          onSubmit={handleSubmit(onStepSubmit)} 
          noValidate
          className="space-y-8"
        >
          <fieldset disabled={isSubmitting} className="space-y-8">
            <legend className="sr-only">
              {FORM_STEPS[currentStep].title}: {FORM_STEPS[currentStep].description}
            </legend>
            
            {/* Current step content */}
            <div className="min-h-[500px]">
              {renderCurrentStep()}
            </div>
          </fieldset>

          {/* Navigation - only show for first two steps */}
          {!isLastStep && (
            <div className="flex justify-between items-center pt-6 max-w-4xl mx-auto">
              {currentStep > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={goToPreviousStep}
                  disabled={isSubmitting}
                  className="px-6 py-3"
                  aria-label="Go to previous step"
                >
                  ← Previous
                </Button>
              ) : (
                <div></div>
              )}
              
              <Button
                type="submit"
                disabled={!canProceed}
                className="px-8 py-3 font-semibold"
                aria-label="Continue to next step"
              >
                Continue →
              </Button>
            </div>
          )}
        </form>
      </FormProvider>

      {/* Form help/support */}
      <div className="text-center pt-8 border-t border-gray-200 max-w-4xl mx-auto">
        <p className="text-sm text-gray-600">
          Need help with your booking? 
          <a 
            href="/contact" 
            className="text-blue-600 hover:text-blue-700 font-medium ml-1"
          >
            Contact us
          </a>
        </p>
      </div>
    </div>
  );
}