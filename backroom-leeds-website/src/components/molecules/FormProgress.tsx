'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils';
import type { FormStep } from '@/types/booking';

interface FormProgressProps {
  steps: FormStep[];
  currentStep: number;
  completedSteps: boolean[];
  onStepClick?: (stepIndex: number) => void;
  className?: string;
  'aria-label'?: string;
}

export function FormProgress({ 
  steps, 
  currentStep, 
  completedSteps, 
  onStepClick, 
  className = '',
  'aria-label': ariaLabel = 'Booking progress'
}: FormProgressProps) {
  const progressId = useId();

  return (
    <nav 
      className={cn('form-progress w-full', className)} 
      aria-label={ariaLabel}
      role="navigation"
    >
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps[index];
          const isCurrent = index === currentStep;
          const isClickable = (index < currentStep || isCompleted) && onStepClick;
          const isPast = index < currentStep;
          const isFuture = index > currentStep;

          const stepNumber = index + 1;

          return (
            <li
              key={step.id}
              className={cn(
                'flex-1 flex items-center',
                {
                  'pr-4': index < steps.length - 1
                }
              )}
            >
              {/* Step connector line */}
              {index < steps.length - 1 && (
                <div className="absolute left-8 top-4 h-0.5 w-full z-0">
                  <div
                    className={cn(
                      'h-full transition-colors duration-300',
                      {
                        'bg-green-300': isPast,
                        'bg-blue-300': isCurrent,
                        'bg-gray-200': isFuture
                      }
                    )}
                  />
                </div>
              )}

              {/* Step button/content */}
              {isClickable ? (
                <button
                  type="button"
                  onClick={() => onStepClick(index)}
                  className={cn(
                    'relative z-10 flex flex-col items-center p-2 rounded-lg transition-all duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
                    'hover:bg-gray-50 active:bg-gray-100'
                  )}
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-label={`${step.title}${isCompleted ? ' (completed)' : ''}${isCurrent ? ' (current)' : ''}`}
                >
                  <StepIndicator
                    stepNumber={stepNumber}
                    isCompleted={isCompleted}
                    isCurrent={isCurrent}
                    isPast={isPast}
                  />
                  <StepLabel step={step} isCurrent={isCurrent} />
                </button>
              ) : (
                <div
                  className="relative z-10 flex flex-col items-center p-2"
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-label={`${step.title}${isCurrent ? ' (current)' : ''}`}
                >
                  <StepIndicator
                    stepNumber={stepNumber}
                    isCompleted={isCompleted}
                    isCurrent={isCurrent}
                    isPast={isPast}
                  />
                  <StepLabel step={step} isCurrent={isCurrent} />
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {/* Screen reader announcement of current step */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Step {currentStep + 1} of {steps.length}: {steps[currentStep]?.title}
      </div>
    </nav>
  );
}

interface StepIndicatorProps {
  stepNumber: number;
  isCompleted: boolean;
  isCurrent: boolean;
  isPast: boolean;
}

function StepIndicator({ stepNumber, isCompleted, isCurrent, isPast }: StepIndicatorProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300',
        'text-sm font-semibold',
        {
          // Completed step
          'bg-green-100 border-green-300 text-green-800': isCompleted && !isCurrent,
          
          // Current step
          'bg-blue-100 border-blue-500 text-blue-800 ring-2 ring-blue-200': isCurrent,
          
          // Past step (not completed)
          'bg-gray-100 border-gray-300 text-gray-600': isPast && !isCompleted,
          
          // Future step
          'bg-white border-gray-200 text-gray-400': !isPast && !isCurrent && !isCompleted
        }
      )}
    >
      {isCompleted && !isCurrent ? (
        <svg
          className="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <span>{stepNumber}</span>
      )}
    </div>
  );
}

interface StepLabelProps {
  step: FormStep;
  isCurrent: boolean;
}

function StepLabel({ step, isCurrent }: StepLabelProps) {
  return (
    <div className="mt-2 text-center">
      <div
        className={cn(
          'text-xs font-medium transition-colors duration-300',
          {
            'text-blue-800': isCurrent,
            'text-gray-900': !isCurrent,
          }
        )}
      >
        {step.title}
      </div>
      <div className="text-xs text-gray-500 mt-1 hidden sm:block">
        {step.description}
      </div>
    </div>
  );
}