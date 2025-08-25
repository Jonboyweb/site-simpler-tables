'use client';

import { Button, Text } from '@/components/atoms';
import { Card } from '@/components/molecules';
import type { BookingLayoutProps } from '@/types/components';

export const BookingLayout = ({
  children,
  currentStep,
  totalSteps,
  onBack,
  onNext,
}: BookingLayoutProps) => {
  const stepLabels = [
    'Select Date & Time',
    'Choose Your Table',
    'Enter Details',
    'Payment',
    'Confirmation',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-speakeasy-noir via-speakeasy-burgundy/5 to-speakeasy-noir">
      <div className="container mx-auto px-4 py-12">
        {/* Progress Indicator */}
        <Card variant="default" padding="sm" className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bebas text-lg ${
                      step < currentStep
                        ? 'bg-speakeasy-gold text-speakeasy-noir'
                        : step === currentStep
                        ? 'bg-speakeasy-copper text-speakeasy-champagne ring-2 ring-speakeasy-gold'
                        : 'bg-speakeasy-noir border-2 border-speakeasy-gold/30 text-speakeasy-gold/30'
                    }`}
                  >
                    {step < currentStep ? '✓' : step}
                  </div>
                  <Text
                    variant="small"
                    className={`mt-2 text-center hidden sm:block ${
                      step <= currentStep ? 'text-speakeasy-gold' : 'text-speakeasy-champagne/40'
                    }`}
                  >
                    {stepLabels[step - 1]}
                  </Text>
                </div>
                {step < totalSteps && (
                  <div
                    className={`h-0.5 flex-1 mx-2 ${
                      step < currentStep
                        ? 'bg-speakeasy-gold'
                        : 'bg-speakeasy-gold/20'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {children}
        </div>

        {/* Navigation Buttons */}
        {(onBack || onNext) && (
          <div className="max-w-4xl mx-auto mt-8">
            <Card variant="default" padding="md">
              <div className="flex justify-between items-center">
                <div>
                  {onBack && currentStep > 1 && (
                    <Button variant="ghost" onClick={onBack}>
                      ← Previous Step
                    </Button>
                  )}
                </div>
                <div className="text-center">
                  <Text variant="caption">
                    Step {currentStep} of {totalSteps}
                  </Text>
                </div>
                <div>
                  {onNext && currentStep < totalSteps && (
                    <Button variant="gold" onClick={onNext}>
                      Next Step →
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};