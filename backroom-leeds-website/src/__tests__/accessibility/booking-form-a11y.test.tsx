import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import BookingForm from '@/components/organisms/BookingForm';
import { mockTableAvailability } from '../fixtures/table-booking';

expect.extend(toHaveNoViolations);

describe('Booking Form Accessibility', () => {
  it('meets WCAG 2.1 AA standards', async () => {
    const { container } = render(
      <BookingForm 
        tableAvailability={mockTableAvailability} 
        onSubmit={jest.fn()} 
      />
    );

    const results = await axe(container, {
      rules: {
        // Optionally disable specific rules if they're false positives
        'color-contrast': { enabled: true },
        'landmark-one-main': { enabled: true },
        'page-has-heading-one': { enabled: true },
      },
    });

    expect(results).toHaveNoViolations();
  });

  it('has proper ARIA attributes', () => {
    const { getByLabelText, getByRole } = render(
      <BookingForm 
        tableAvailability={mockTableAvailability} 
        onSubmit={jest.fn()} 
      />
    );

    // Check form label associations
    expect(getByLabelText(/Name/i)).toHaveAttribute('aria-required', 'true');
    expect(getByLabelText(/Email/i)).toHaveAttribute('aria-required', 'true');
    expect(getByLabelText(/Phone/i)).toHaveAttribute('aria-required', 'true');

    // Check form navigation
    const nextButton = getByRole('button', { name: /Next/i });
    expect(nextButton).toHaveAttribute('aria-label', 'Proceed to next booking step');
  });

  it('provides error messages with ARIA live regions', () => {
    const { getByRole } = render(
      <BookingForm 
        tableAvailability={mockTableAvailability} 
        onSubmit={jest.fn()} 
      />
    );

    const errorContainer = getByRole('alert');
    expect(errorContainer).toHaveAttribute('aria-live', 'assertive');
  });
});