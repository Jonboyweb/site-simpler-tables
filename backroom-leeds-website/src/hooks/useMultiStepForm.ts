'use client';

import { useState, useCallback } from 'react';

export interface UseMultiStepFormOptions {
  totalSteps: number;
  initialStep?: number;
  onStepChange?: (step: number) => void;
}

export function useMultiStepForm({ 
  totalSteps, 
  initialStep = 0, 
  onStepChange 
}: UseMultiStepFormOptions) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [completedSteps, setCompletedSteps] = useState<boolean[]>(
    new Array(totalSteps).fill(false)
  );

  const nextStep = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      onStepChange?.(newStep);
    }
  }, [currentStep, totalSteps, onStepChange]);

  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      onStepChange?.(newStep);
    }
  }, [currentStep, onStepChange]);

  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < totalSteps) {
      // Only allow navigation to completed steps or the next immediate step
      const canNavigate = stepIndex <= currentStep || completedSteps[stepIndex];
      
      if (canNavigate) {
        setCurrentStep(stepIndex);
        onStepChange?.(stepIndex);
      }
    }
  }, [currentStep, totalSteps, completedSteps, onStepChange]);

  const markStepCompleted = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < totalSteps) {
      setCompletedSteps(prev => {
        const newCompleted = [...prev];
        newCompleted[stepIndex] = true;
        return newCompleted;
      });
    }
  }, [totalSteps]);

  const markStepIncomplete = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < totalSteps) {
      setCompletedSteps(prev => {
        const newCompleted = [...prev];
        newCompleted[stepIndex] = false;
        return newCompleted;
      });
    }
  }, [totalSteps]);

  const reset = useCallback(() => {
    setCurrentStep(initialStep);
    setCompletedSteps(new Array(totalSteps).fill(false));
    onStepChange?.(initialStep);
  }, [totalSteps, initialStep, onStepChange]);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const canGoNext = currentStep < totalSteps - 1;
  const canGoPrevious = currentStep > 0;

  return {
    currentStep,
    completedSteps,
    nextStep,
    previousStep,
    goToStep,
    markStepCompleted,
    markStepIncomplete,
    reset,
    isFirstStep,
    isLastStep,
    canGoNext,
    canGoPrevious,
    progress: ((currentStep + 1) / totalSteps) * 100
  };
}